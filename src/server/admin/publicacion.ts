import { ahora, anotar } from "../bd";
import {
  comprobarRuta,
  descartarBorrador,
  guardarBorrador,
  leerBorrador,
  leerJsonActual,
  listarBorradores,
  necesita,
  prepararPublicacion,
  rutaPermitida,
} from "../borradores";
import { ErrorApi, json, leerJson, texto } from "../respuestas";
import { validarDocumento } from "../../cms/esquema";
import { INDICE_BLOG, RUTA_MEDIOS, seccionPorArchivo } from "../../cms/secciones";
import { ruta, type Contexto } from "./contexto";

const decodificador = new TextDecoder();
const esBinario = (r: string) => r.startsWith(`${RUTA_MEDIOS}/`);

/** Nombre legible y enlace al editor de cada archivo pendiente. */
export function describir(r: string) {
  const s = seccionPorArchivo(r);
  if (s) return { tipo: "contenido", titulo: s.titulo, enlace: `/admin/contenido/editar?s=${s.id}` };
  if (r === INDICE_BLOG) return { tipo: "blog", titulo: "Lista de artículos del blog", enlace: "/admin/blog" };
  const articulo = r.match(/^src\/content\/blog\/(.+)\.md$/);
  if (articulo)
    return { tipo: "blog", titulo: `Texto del artículo «${articulo[1]}»`, enlace: `/admin/blog/editar?slug=${articulo[1]}` };
  if (esBinario(r)) return { tipo: "medio", titulo: r.slice(RUTA_MEDIOS.length + 1), enlace: "/admin/medios" };
  return { tipo: "otro", titulo: r, enlace: "" };
}

const sha = (c: Contexto) => {
  const valor = c.url.searchParams.get("sha") || "";
  if (!/^[0-9a-f]{7,40}$/.test(valor)) throw new ErrorApi("Versión no válida.", 400);
  return valor;
};
const rutaConsulta = (c: Contexto) => {
  const r = c.url.searchParams.get("ruta") || "";
  comprobarRuta(r);
  return r;
};

export const rutasPublicacion = [
  ruta("GET", /^publicacion$/, async (c) => {
    const filas = await listarBorradores(c.db);
    const { results: ultimas } = await c.db
      .prepare("SELECT * FROM publicaciones ORDER BY fecha DESC LIMIT 10")
      .all();
    return json({
      cambios: filas.map((f) => ({
        ruta: f.ruta,
        accion: f.borrar ? "borrar" : f.base === null ? "crear" : "modificar",
        actualizado: f.actualizado,
        ...describir(f.ruta),
      })),
      ultimas,
      recompilar: !!c.entorno.secretos.CLOUDFLARE_DEPLOY_HOOK,
      repositorio: c.entorno.repo
        ? { tipo: c.entorno.repo.tipo, descripcion: c.entorno.repo.descripcion }
        : null,
    });
  }),

  ruta("GET", /^publicacion\/diff$/, async (c) => {
    const r = rutaConsulta(c);
    if (esBinario(r)) return json({ binario: true });
    const { repo } = necesita(c.entorno);
    const publicado = await repo.leer(r);
    const borrador = await leerBorrador(c.db, r);
    const antes = publicado ? decodificador.decode(publicado.bytes) : null;
    return json({
      binario: false,
      antes,
      despues: borrador ? (borrador.borrar ? null : borrador.contenido) : antes,
    });
  }),

  ruta("POST", /^publicacion$/, async (c) => {
    const { repo } = necesita(c.entorno);
    const cuerpo = await leerJson(c.request);
    const { filas, cambios, conflictos } = await prepararPublicacion(c.entorno);
    if (!filas.length) throw new ErrorApi("No hay cambios pendientes.", 409);
    if (conflictos.length && cuerpo.forzar !== true)
      throw new ErrorApi(
        "Algunos archivos han cambiado en GitHub desde que empezaste a editarlos.",
        409,
        { conflictos: conflictos.map((r) => ({ ruta: r, ...describir(r) })) },
      );
    const titulos = [...new Set(filas.map((f) => describir(f.ruta).titulo))];
    const mensaje =
      texto(cuerpo.mensaje, 200) ||
      `CMS: ${titulos.slice(0, 4).join(", ")}${titulos.length > 4 ? ` y ${titulos.length - 4} más` : ""}`;
    const resultado = await repo.publicar(cambios, mensaje);
    // Solo se borran los borradores publicados tal como estaban: si alguien
    // guardó otro cambio mientras tanto, se conserva para la siguiente vez.
    await c.db.batch(
      filas.map((f) =>
        c.db
          .prepare("DELETE FROM borradores WHERE ruta = ? AND actualizado = ?")
          .bind(f.ruta, f.actualizado),
      ),
    );
    if (resultado.sha)
      await c.db
        .prepare("INSERT OR REPLACE INTO publicaciones (sha, fecha, mensaje, archivos, url) VALUES (?, ?, ?, ?, ?)")
        .bind(resultado.sha, ahora(), mensaje, filas.length, resultado.url ?? null)
        .run();
    await anotar(
      c.db,
      "publicacion",
      `${mensaje} (${filas.length} ${filas.length === 1 ? "archivo" : "archivos"})`,
      c.ip,
    );
    return json({ ok: true, sha: resultado.sha, url: resultado.url, archivos: filas.length, local: repo.tipo === "local" });
  }),

  ruta("DELETE", /^publicacion$/, async (c) => {
    const r = c.url.searchParams.get("ruta");
    if (r) {
      comprobarRuta(r);
      await descartarBorrador(c.db, r);
      await anotar(c.db, "borrador.descartado", describir(r).titulo, c.ip);
    } else {
      await c.db.prepare("DELETE FROM borradores").run();
      await anotar(c.db, "borrador.descartados-todos", "", c.ip);
    }
    return json({ ok: true });
  }),

  ruta("GET", /^publicacion\/estado$/, async (c) =>
    json(await necesita(c.entorno).repo.estadoDespliegue(sha(c))),
  ),

  ruta("POST", /^publicacion\/recompilar$/, async (c) => {
    const hook = c.entorno.secretos.CLOUDFLARE_DEPLOY_HOOK;
    if (!hook) throw new ErrorApi("Falta CLOUDFLARE_DEPLOY_HOOK en la configuración.", 409);
    const respuesta = await fetch(hook, { method: "POST", signal: AbortSignal.timeout(10_000) });
    if (!respuesta.ok) throw new ErrorApi(`Cloudflare respondió ${respuesta.status}.`, 502);
    await anotar(c.db, "publicacion.recompilada", "", c.ip);
    return json({ ok: true });
  }),

  // ——— Historial de versiones ———
  ruta("GET", /^historial$/, async (c) => {
    const r = c.url.searchParams.get("ruta") || "src/content";
    if (!["src/content", RUTA_MEDIOS].includes(r)) comprobarRuta(r);
    return json({ commits: await necesita(c.entorno).repo.historial(r, 40) });
  }),

  ruta("GET", /^historial\/commit$/, async (c) => {
    const detalle = await necesita(c.entorno).repo.detalleCommit(sha(c));
    return json({
      commit: detalle.commit,
      archivos: detalle.archivos.map((a) => ({
        ...a,
        restaurable: rutaPermitida(a.ruta) && a.estado !== "removed",
        ...(rutaPermitida(a.ruta) ? describir(a.ruta) : { titulo: a.ruta, tipo: "codigo", enlace: "" }),
      })),
    });
  }),

  ruta("GET", /^historial\/version$/, async (c) => {
    const r = rutaConsulta(c);
    if (esBinario(r)) return json({ binario: true });
    const bytes = await necesita(c.entorno).repo.leerEnVersion(r, sha(c));
    return json({ binario: false, texto: bytes ? decodificador.decode(bytes) : null });
  }),

  ruta("POST", /^historial\/restaurar$/, async (c) => {
    const cuerpo = await leerJson(c.request);
    const r = texto(cuerpo.ruta, 300);
    const version = texto(cuerpo.sha, 40);
    comprobarRuta(r);
    if (!/^[0-9a-f]{7,40}$/.test(version)) throw new ErrorApi("Versión no válida.", 400);
    const bytes = await necesita(c.entorno).repo.leerEnVersion(r, version);
    if (!bytes) throw new ErrorApi("Ese archivo no existía en esa versión.", 404);
    const s = seccionPorArchivo(r);
    if (s) {
      // Se valida con el formulario de hoy: una versión muy antigua puede no
      // encajar si desde entonces han cambiado los campos.
      const antiguo = JSON.parse(decodificador.decode(bytes));
      const resultado = validarDocumento(s.esquema, antiguo, await leerJsonActual(c.entorno, r));
      if (!resultado.ok)
        throw new ErrorApi(
          "Esa versión no encaja con el formulario actual y no se puede restaurar desde aquí.",
          422,
          { errores: resultado.errores },
        );
    }
    await guardarBorrador(
      c.entorno,
      r,
      esBinario(r) ? { bytes } : { texto: decodificador.decode(bytes) },
    );
    await anotar(c.db, "historial.restaurado", `${describir(r).titulo} (${version.slice(0, 7)})`, c.ip);
    return json({ ok: true });
  }),
];
