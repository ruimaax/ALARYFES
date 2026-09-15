/**
 * Borradores: todo lo que se guarda en /admin queda aquí, en D1, hasta que se
 * pulsa «Publicar». Entonces todos los cambios salen juntos en un solo commit
 * y Cloudflare recompila la web una sola vez.
 */
import { ahora } from "./bd";
import { aBase64, bytesDe, deBase64, shaGit, type Bytes } from "./cripto";
import { ErrorApi } from "./respuestas";
import type { CambioRepo, Repositorio } from "./repositorio";
import type { BaseDatos, Entorno } from "./tipos";

export type FilaBorrador = {
  ruta: string;
  contenido: string | null;
  binario: number;
  borrar: number;
  base: string | null;
  actualizado: string;
};

// Lo único del repositorio que el panel puede escribir.
export const rutaPermitida = (ruta: string) =>
  /^src\/content\/[a-z0-9-]+\.json$/.test(ruta) ||
  /^src\/content\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(ruta) ||
  /^public\/media\/[a-z0-9][a-z0-9._-]*\.(webp|jpe?g|png|avif|gif|pdf)$/.test(ruta);

export function comprobarRuta(ruta: string) {
  if (!rutaPermitida(ruta)) throw new ErrorApi("Ruta no permitida.", 400);
}

export function necesita(entorno: Entorno): { db: BaseDatos; repo: Repositorio } {
  if (!entorno.db) throw new ErrorApi("Falta la base de datos D1.", 503);
  if (!entorno.repo)
    throw new ErrorApi(
      "Falta conectar GitHub (GITHUB_TOKEN y GITHUB_REPO) para leer y publicar el contenido.",
      503,
    );
  return { db: entorno.db, repo: entorno.repo };
}

const decodificador = new TextDecoder();
const bytesDeFila = (fila: FilaBorrador): Bytes =>
  fila.binario ? deBase64(fila.contenido || "") : bytesDe(fila.contenido || "");

export const leerBorrador = (db: BaseDatos, ruta: string) =>
  db.prepare("SELECT * FROM borradores WHERE ruta = ?").bind(ruta).first<FilaBorrador>();

/** Lo que verá la web tras publicar: el borrador si existe, si no lo publicado. */
export async function leerActual(entorno: Entorno, ruta: string) {
  const { db, repo } = necesita(entorno);
  const borrador = await leerBorrador(db, ruta);
  if (borrador) return borrador.borrar ? null : { bytes: bytesDeFila(borrador), borrador };
  const publicado = await repo.leer(ruta);
  return publicado ? { bytes: publicado.bytes, borrador: null } : null;
}
export async function leerTextoActual(entorno: Entorno, ruta: string) {
  const actual = await leerActual(entorno, ruta);
  return actual ? decodificador.decode(actual.bytes) : null;
}
export async function leerJsonActual<T>(entorno: Entorno, ruta: string): Promise<T | null> {
  const textoActual = await leerTextoActual(entorno, ruta);
  return textoActual === null ? null : (JSON.parse(textoActual) as T);
}
export async function leerJsonPublicado<T>(entorno: Entorno, ruta: string): Promise<T | null> {
  const publicado = await necesita(entorno).repo.leer(ruta);
  return publicado ? (JSON.parse(decodificador.decode(publicado.bytes)) as T) : null;
}

export const aJson = (datos: unknown) => `${JSON.stringify(datos, null, 2)}\n`;

type Nuevo = { texto: string } | { bytes: Bytes } | { borrar: true };
/**
 * Guarda un borrador. Si el resultado es idéntico a lo publicado, el
 * borrador desaparece: así «Publicar» solo lista cambios de verdad.
 */
export async function guardarBorrador(
  entorno: Entorno,
  ruta: string,
  nuevo: Nuevo,
): Promise<"guardado" | "sin-cambios"> {
  comprobarRuta(ruta);
  const { db, repo } = necesita(entorno);
  const previo = await leerBorrador(db, ruta);
  const base = previo ? previo.base : ((await repo.leer(ruta))?.sha ?? null);
  const quitar = () => db.prepare("DELETE FROM borradores WHERE ruta = ?").bind(ruta).run();
  if ("borrar" in nuevo) {
    if (base === null) {
      await quitar();
      return "sin-cambios";
    }
    await db
      .prepare(
        `INSERT INTO borradores (ruta, contenido, binario, borrar, base, actualizado)
         VALUES (?, NULL, 0, 1, ?, ?)
         ON CONFLICT(ruta) DO UPDATE SET contenido = NULL, binario = 0, borrar = 1, actualizado = excluded.actualizado`,
      )
      .bind(ruta, base, ahora())
      .run();
    return "guardado";
  }
  const bytes = "texto" in nuevo ? bytesDe(nuevo.texto) : nuevo.bytes;
  if (base !== null && (await shaGit(bytes)) === base) {
    await quitar();
    return "sin-cambios";
  }
  const binario = "bytes" in nuevo;
  const contenido = binario ? aBase64(bytes) : (nuevo as { texto: string }).texto;
  if (contenido.length > 1_900_000)
    throw new ErrorApi("El archivo es demasiado grande (máximo 1,4 MB).", 413);
  await db
    .prepare(
      `INSERT INTO borradores (ruta, contenido, binario, borrar, base, actualizado)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(ruta) DO UPDATE SET contenido = excluded.contenido,
         binario = excluded.binario, borrar = 0, actualizado = excluded.actualizado`,
    )
    .bind(ruta, contenido, binario ? 1 : 0, base, ahora())
    .run();
  return "guardado";
}

export const descartarBorrador = (db: BaseDatos, ruta: string) =>
  db.prepare("DELETE FROM borradores WHERE ruta = ?").bind(ruta).run();

export async function listarBorradores(db: BaseDatos) {
  const { results } = await db
    .prepare(
      "SELECT ruta, binario, borrar, base, actualizado, length(contenido) AS longitud FROM borradores ORDER BY actualizado DESC",
    )
    .all<Omit<FilaBorrador, "contenido"> & { longitud: number | null }>();
  return results;
}

/**
 * Prepara la publicación. Un conflicto significa que el archivo ha cambiado
 * en GitHub desde que empezaste a editarlo (por ejemplo, un cambio de código).
 */
export async function prepararPublicacion(entorno: Entorno) {
  const { db, repo } = necesita(entorno);
  const { results } = await db
    .prepare("SELECT * FROM borradores ORDER BY ruta")
    .all<FilaBorrador>();
  const actuales = await repo.shasDe(results.map((f) => f.ruta));
  const conflictos = results
    .filter((f) => (actuales[f.ruta] ?? null) !== f.base)
    .map((f) => f.ruta);
  const cambios: CambioRepo[] = results
    // Borrar algo que ya no existe haría fallar el commit.
    .filter((f) => !(f.borrar && actuales[f.ruta] == null))
    .map((f) =>
      f.borrar
        ? { ruta: f.ruta, borrar: true }
        : f.binario
          ? { ruta: f.ruta, bytes: deBase64(f.contenido || "") }
          : { ruta: f.ruta, texto: f.contenido || "" },
    );
  return { filas: results, cambios, conflictos };
}
