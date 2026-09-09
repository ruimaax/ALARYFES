/**
 * Servidor local que imita cómo sirve Cloudflare Pages una carpeta estática:
 * archivo exacto, luego .html, luego /index.html y, si no, 404.html con su
 * código 404. Sirve para comprobar la carpeta antes de subirla.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const raiz = path.resolve(process.argv[2] || "../alaryfes-cloudflare");
const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};
const archivo = async (ruta) => {
  try {
    const info = await stat(ruta);
    return info.isFile() ? ruta : null;
  } catch {
    return null;
  }
};
export const servir = (puerto = 4321) =>
  new Promise((listo) => {
    const servidor = createServer(async (peticion, respuesta) => {
      const url = decodeURIComponent(new URL(peticion.url, "http://x").pathname);
      const base = path.join(raiz, url);
      const encontrado =
        (await archivo(base)) ||
        (await archivo(`${base}.html`)) ||
        (await archivo(path.join(base, "index.html")));
      const destino = encontrado || path.join(raiz, "404.html");
      const tipo = tipos[path.extname(destino)] || "application/octet-stream";
      let cuerpo = await readFile(destino);
      const cabeceras = { "Content-Type": tipo };
      // Cloudflare comprime el texto por su cuenta; sin esto las medidas
      // de rendimiento locales no se parecen a la realidad.
      if (
        /text|javascript|json|xml|svg/.test(tipo) &&
        /gzip/.test(peticion.headers["accept-encoding"] || "")
      ) {
        cuerpo = gzipSync(cuerpo);
        cabeceras["Content-Encoding"] = "gzip";
      }
      respuesta.writeHead(encontrado ? 200 : 404, cabeceras);
      respuesta.end(cuerpo);
    });
    servidor.listen(puerto, "127.0.0.1", () => listo(servidor));
  });

if (import.meta.filename === process.argv[1]) {
  await servir(Number(process.env.PORT) || 4321);
  console.log(`Sirviendo ${raiz} en http://127.0.0.1:${process.env.PORT || 4321}`);
}
