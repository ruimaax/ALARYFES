import { anotar } from "../bd";
import {
  aJson,
  comprobarRuta,
  descartarBorrador,
  guardarBorrador,
  leerActual,
  leerBorrador,
  leerJsonActual,
  leerJsonPublicado,
  leerTextoActual,
  listarBorradores,
  necesita,
} from "../borradores";
import { deBase64, type Bytes } from "../cripto";
import { ErrorApi, json, leerJson } from "../respuestas";
import { validarDocumento } from "../../cms/esquema";
import {
  INDICE_BLOG,
  RUTA_BLOG,
  RUTA_CONTENIDO,
  RUTA_MEDIOS,
  esquemaArticulo,
  seccionPorId,
  secciones,
} from "../../cms/secciones";
import type { Articulo } from "../../data/blog";
import { ruta, type Contexto } from "./contexto";

type IndiceBlog = { articulos: Articulo[] };
type Redirecciones = { redirecciones: { desde: string; hasta: string; codigo: string }[] };
const RUTA_REDIRECCIONES = `${RUTA_CONTENIDO}/redirecciones.json`;
const cuerpoDe = (slug: string) => `${RUTA_BLOG}/${slug}.md`;
const hoy = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());
const enLaWeb = (a?: Articulo) => !!a && a.publicado && a.fecha <= hoy();

function seccion(c: Contexto) {
  const s = seccionPorId(c.params[0]);
  if (!s) throw new ErrorApi("Esa sección no existe.", 404);
  return s;
}

/** Añade una redirección (si no existe ya) al borrador de redirecciones. */
async function redirigir(c: Contexto, desde: string, hasta: string) {
  const actual = (await leerJsonActual<Redirecciones>(c.entorno, RUTA_REDIRECCIONES)) ?? {
    redirecciones: [],
  };
  const resto = actual.redirecciones.filter((r) => r.desde !== desde);
  // Si algo apuntaba a la dirección antigua, ahora apunta a la nueva.
  const corregidas = resto.map((r) => (r.hasta === desde ? { ...r, hasta } : r));
  await guardarBorrador(c.entorno, RUTA_REDIRECCIONES, {
    texto: aJson({ ...actual, redirecciones: [...corregidas, { desde, hasta, codigo: "301" }] }),
  });
}

// Tipos de archivo que admite la biblioteca, reconocidos por su contenido y
// no por el nombre. SVG no se admite: puede llevar código incrustado.
const TIPOS: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  gif: "image/gif",
  pdf: "application/pdf",
};
function tipoPorFirma(b: Bytes): string | null {
  const ascii = (desde: number, hasta: number) => String.fromCharCode(...b.subarray(desde, hasta));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "GIF8") return "gif";
  if (ascii(0, 4) === "%PDF") return "pdf";
  if (ascii(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(8, 12))) return "avif";
  return null;
}
const nombreSeguro = (nombre: string) =>
  nombre
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "archivo";

function rutaMedio(c: Contexto) {
  const r = c.url.searchParams.get("ruta") || "";
  comprobarRuta(r);
  if (!r.startsWith(`${RUTA_MEDIOS}/`)) throw new ErrorApi("Ruta no permitida.", 400);
  return r;
}

export const rutasContenido = [
  // ——— Secciones de contenido ———
  ruta("GET", /^contenido$/, async (c) => {
    const borradores = new Map(
      (await listarBorradores(c.db)).map((b) => [b.ruta, b.actualizado]),
    );
    return json({
      secciones: secciones.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        descripcion: s.descripcion,
        grupo: s.grupo,
        ver: s.ver,
        borrador: borradores.get(s.archivo) ?? null,
      })),
    });
  }),

  ruta("GET", /^contenido\/([a-z]+)$/, async (c) => {
    const s = seccion(c);
    const datos = await leerJsonActual(c.entorno, s.archivo);
    if (datos === null) throw new ErrorApi(`No se encuentra ${s.archivo}.`, 404);
    const borrador = await leerBorrador(c.db, s.archivo);
    return json({ datos, borrador: borrador ? borrador.actualizado : null });
  }),

  ruta("PUT", /^contenido\/([a-z]+)$/, async (c) => {
    const s = seccion(c);
    const { datos } = await leerJson<{ datos: unknown }>(c.request);
    const anterior = await leerJsonActual(c.entorno, s.archivo);
    const resultado = validarDocumento(s.esquema, datos, anterior);
    if (!resultado.ok)
      throw new ErrorApi("Revisa los campos marcados.", 422, { errores: resultado.errores });
    const estado = await guardarBorrador(c.entorno, s.archivo, { texto: aJson(resultado.datos) });
    await anotar(c.db, "contenido.guardado", s.titulo, c.ip);
    return json({ ok: true, estado, datos: resultado.datos });
  }),

  ruta("DELETE", /^contenido\/([a-z]+)\/borrador$/, async (c) => {
    const s = seccion(c);
    await descartarBorrador(c.db, s.archivo);
    await anotar(c.db, "contenido.descartado", s.titulo, c.ip);
    return json({ ok: true });
  }),

  // ——— Blog ———
  ruta("GET", /^blog$/, async (c) => {
    const actual = (await leerJsonActual<IndiceBlog>(c.entorno, INDICE_BLOG)) ?? { articulos: [] };
    const publicado = (await leerJsonPublicado<IndiceBlog>(c.entorno, INDICE_BLOG)) ?? {
      articulos: [],
    };
    const borradores = new Set((await listarBorradores(c.db)).map((b) => b.ruta));
    const articulos = actual.articulos
      .map((a) => {
        const antes = publicado.articulos.find((p) => p.slug === a.slug);
        return {
          ...a,
          estado: !a.publicado ? "borrador" : a.fecha > hoy() ? "programado" : "publicado",
          enLaWeb: enLaWeb(antes),
          sinPublicar:
            borradores.has(cuerpoDe(a.slug)) || JSON.stringify(antes) !== JSON.stringify(a),
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    return json({ articulos });
  }),

  ruta("GET", /^blog\/([a-z0-9-]{1,80})$/, async (c) => {
    const indice = (await leerJsonActual<IndiceBlog>(c.entorno, INDICE_BLOG)) ?? { articulos: [] };
    const articulo = indice.articulos.find((a) => a.slug === c.params[0]);
    if (!articulo) throw new ErrorApi("Ese artículo no existe.", 404);
    const publicado = await leerJsonPublicado<IndiceBlog>(c.entorno, INDICE_BLOG);
    return json({
      articulo,
      cuerpo: (await leerTextoActual(c.entorno, cuerpoDe(articulo.slug))) ?? "",
      enLaWeb: enLaWeb(publicado?.articulos.find((a) => a.slug === articulo.slug)),
    });
  }),

  ruta("PUT", /^blog\/([a-z0-9-]{1,80})$/, async (c) => {
    const slug = c.params[0];
    const cuerpoPeticion = await leerJson<{ articulo: Record<string, unknown>; cuerpo: unknown; original?: unknown }>(
      c.request,
    );
    const original = typeof cuerpoPeticion.original === "string" ? cuerpoPeticion.original : "";
    const indice = (await leerJsonActual<IndiceBlog>(c.entorno, INDICE_BLOG)) ?? { articulos: [] };
    const previo = indice.articulos.find((a) => a.slug === (original || slug));
    if (original && !previo) throw new ErrorApi("El artículo que editabas ya no existe.", 404);
    if (slug !== original && indice.articulos.some((a) => a.slug === slug))
      throw new ErrorApi("Ya hay otro artículo con esa dirección.", 409, {
        errores: { slug: "Ya existe." },
      });
    const resultado = validarDocumento(
      esquemaArticulo,
      { ...cuerpoPeticion.articulo, slug },
      previo ? { ...previo, slug } : undefined,
    );
    if (!resultado.ok)
      throw new ErrorApi("Revisa los campos marcados.", 422, { errores: resultado.errores });
    if (typeof cuerpoPeticion.cuerpo !== "string" || cuerpoPeticion.cuerpo.length > 150_000)
      throw new ErrorApi("El texto del artículo no es válido o es demasiado largo.", 422);
    const articulo = resultado.datos as Articulo;
    const cuerpo = `${cuerpoPeticion.cuerpo.replace(/\r\n?/g, "\n").trim()}\n`;

    const articulos = previo
      ? indice.articulos.map((a) => (a.slug === previo.slug ? articulo : a))
      : [...indice.articulos, articulo];
    await guardarBorrador(c.entorno, INDICE_BLOG, { texto: aJson({ ...indice, articulos }) });
    await guardarBorrador(c.entorno, cuerpoDe(slug), { texto: cuerpo });
    if (original && original !== slug) {
      await guardarBorrador(c.entorno, cuerpoDe(original), { borrar: true });
      // Si la dirección antigua ya estaba en la web, se redirige a la nueva.
      const publicado = await leerJsonPublicado<IndiceBlog>(c.entorno, INDICE_BLOG);
      if (enLaWeb(publicado?.articulos.find((a) => a.slug === original)))
        await redirigir(c, `/blog/${original}`, `/blog/${slug}`);
    }
    await anotar(c.db, previo ? "blog.guardado" : "blog.creado", articulo.titulo, c.ip);
    return json({ ok: true, articulo });
  }),

  ruta("DELETE", /^blog\/([a-z0-9-]{1,80})$/, async (c) => {
    const slug = c.params[0];
    const indice = (await leerJsonActual<IndiceBlog>(c.entorno, INDICE_BLOG)) ?? { articulos: [] };
    const articulo = indice.articulos.find((a) => a.slug === slug);
    if (!articulo) throw new ErrorApi("Ese artículo no existe.", 404);
    await guardarBorrador(c.entorno, INDICE_BLOG, {
      texto: aJson({ ...indice, articulos: indice.articulos.filter((a) => a.slug !== slug) }),
    });
    await guardarBorrador(c.entorno, cuerpoDe(slug), { borrar: true });
    const publicado = await leerJsonPublicado<IndiceBlog>(c.entorno, INDICE_BLOG);
    if (enLaWeb(publicado?.articulos.find((a) => a.slug === slug)))
      await redirigir(c, `/blog/${slug}`, "/blog");
    await anotar(c.db, "blog.borrado", articulo.titulo, c.ip);
    return json({ ok: true });
  }),

  // ——— Medios ———
  ruta("GET", /^medios$/, async (c) => {
    const { repo } = necesita(c.entorno);
    const publicados = await repo.listar(RUTA_MEDIOS);
    const borradores = (await listarBorradores(c.db)).filter((b) =>
      b.ruta.startsWith(`${RUTA_MEDIOS}/`),
    );
    const mapa = new Map(
      publicados.map((p) => [
        p.ruta,
        { ruta: p.ruta, nombre: p.nombre, tamano: p.tamano, estado: "publicado", fecha: "" },
      ]),
    );
    for (const b of borradores) {
      const nombre = b.ruta.slice(RUTA_MEDIOS.length + 1);
      const previo = mapa.get(b.ruta);
      mapa.set(b.ruta, {
        ruta: b.ruta,
        nombre,
        tamano: b.borrar ? (previo?.tamano ?? 0) : Math.round(((b.longitud ?? 0) * 3) / 4),
        estado: b.borrar ? "borrar" : previo ? "reemplazado" : "nuevo",
        fecha: b.actualizado,
      });
    }
    const archivos = [...mapa.values()]
      .filter((a) => !a.nombre.startsWith("."))
      .map((a) => {
        const extension = a.nombre.split(".").pop() || "";
        return { ...a, url: `/media/${a.nombre}`, tipo: TIPOS[extension] || "" };
      })
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || a.nombre.localeCompare(b.nombre));
    return json({ archivos });
  }),

  ruta("POST", /^medios$/, async (c) => {
    const { repo } = necesita(c.entorno);
    const cuerpo = await leerJson<{ nombre?: unknown; datos?: unknown }>(c.request);
    if (typeof cuerpo.datos !== "string") throw new ErrorApi("Falta el archivo.", 422);
    const bytes = deBase64(cuerpo.datos);
    if (bytes.length > 1_400_000)
      throw new ErrorApi("El archivo pesa más de 1,4 MB. Redúcelo antes de subirlo.", 413);
    const extension = tipoPorFirma(bytes);
    if (!extension)
      throw new ErrorApi("Formato no admitido. Usa JPG, PNG, WebP, AVIF, GIF o PDF.", 415);
    const base = nombreSeguro(typeof cuerpo.nombre === "string" ? cuerpo.nombre : "");
    const ocupados = new Set([
      ...(await repo.listar(RUTA_MEDIOS)).map((a) => a.ruta),
      ...(await listarBorradores(c.db)).map((b) => b.ruta),
    ]);
    let nombre = `${base}.${extension}`;
    for (let n = 2; ocupados.has(`${RUTA_MEDIOS}/${nombre}`); n++) nombre = `${base}-${n}.${extension}`;
    const rutaArchivo = `${RUTA_MEDIOS}/${nombre}`;
    await guardarBorrador(c.entorno, rutaArchivo, { bytes });
    await anotar(c.db, "medio.subido", nombre, c.ip);
    return json({
      ok: true,
      archivo: { ruta: rutaArchivo, nombre, url: `/media/${nombre}`, tamano: bytes.length, tipo: TIPOS[extension] },
    });
  }),

  ruta("DELETE", /^medios$/, async (c) => {
    const r = rutaMedio(c);
    await guardarBorrador(c.entorno, r, { borrar: true });
    await anotar(c.db, "medio.borrado", r.slice(RUTA_MEDIOS.length + 1), c.ip);
    return json({ ok: true });
  }),

  ruta("GET", /^medios\/archivo$/, async (c) => {
    const r = rutaMedio(c);
    const actual =
      (await leerActual(c.entorno, r)) ?? (await necesita(c.entorno).repo.leer(r));
    if (!actual) throw new ErrorApi("No existe ese archivo.", 404);
    return new Response(actual.bytes, {
      headers: {
        "Content-Type": TIPOS[r.split(".").pop() || ""] || "application/octet-stream",
        "Cache-Control": "private, max-age=120",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }),

  ruta("GET", /^medios\/uso$/, async (c) => {
    const r = rutaMedio(c);
    const url = `/media/${r.slice(RUTA_MEDIOS.length + 1)}`;
    // Contenido publicado más los borradores, para avisar antes de borrar
    // una imagen que todavía se usa en alguna parte.
    const textos = await necesita(c.entorno).repo.leerTextos(RUTA_CONTENIDO);
    for (const b of await listarBorradores(c.db))
      if (b.ruta.startsWith(`${RUTA_CONTENIDO}/`)) {
        if (b.borrar) delete textos[b.ruta];
        else textos[b.ruta] = (await leerTextoActual(c.entorno, b.ruta)) ?? "";
      }
    const usos = Object.entries(textos)
      .filter(([, contenido]) => contenido.includes(url))
      .map(([archivo]) => {
        const s = secciones.find((x) => x.archivo === archivo);
        if (s) return s.titulo;
        if (archivo === INDICE_BLOG) return "Portada de un artículo del blog";
        return `Artículo ${archivo.slice(RUTA_BLOG.length + 1).replace(/\.md$/, "")}`;
      });
    return json({ usos });
  }),
];
