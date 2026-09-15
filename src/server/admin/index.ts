/**
 * API del panel de gestión, servida en /api/admin/*. La usan tanto la función
 * de Cloudflare (functions/api/admin) como Next en `npm run dev`.
 */
import { asegurarEsquema } from "../bd";
import { ErrorApi, json } from "../respuestas";
import { ErrorRepositorio } from "../repositorio";
import { ipDe, sesionActual } from "../sesion";
import { origenPermitido } from "../origen";
import type { Entorno } from "../tipos";
import type { Ruta } from "./contexto";
import { rutasCuenta, rutasSesion } from "./cuenta";
import { rutasSolicitudes } from "./solicitudes";
import { rutasContenido } from "./contenido";
import { rutasPublicacion } from "./publicacion";
import { rutasPanel } from "./panel";
import { rutasAnalitica } from "./analitica";

const privadas: Ruta[] = [
  ...rutasCuenta,
  ...rutasSolicitudes,
  ...rutasContenido,
  ...rutasPublicacion,
  ...rutasPanel,
  ...rutasAnalitica,
];

function encontrar(lista: Ruta[], metodo: string, camino: string) {
  for (const r of lista)
    if (r.metodo === metodo) {
      const encaje = r.patron.exec(camino);
      if (encaje) return { r, params: encaje.slice(1).map(decodeURIComponent) };
    }
  return null;
}

export async function manejarAdmin(request: Request, entorno: Entorno): Promise<Response> {
  const url = new URL(request.url);
  const camino = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/+$/, "");
  const metodo = request.method.toUpperCase();
  try {
    // Protección CSRF: toda operación que cambia algo debe venir del propio
    // panel. Los navegadores envían siempre Origin en estas peticiones.
    if (metodo !== "GET" && !origenPermitido(request))
      throw new ErrorApi("Origen no permitido.", 403);
    if (!entorno.db)
      throw new ErrorApi(
        "Falta la base de datos. Crea una base D1 en Cloudflare y vincúlala al proyecto de Pages con el nombre DB.",
        503,
        { codigo: "sin-bd" },
      );
    await asegurarEsquema(entorno.db);
    const base = { request, entorno, db: entorno.db, url, ip: ipDe(request) };

    const publica = encontrar(rutasSesion, metodo, camino);
    if (publica) return await publica.r.manejar({ ...base, params: publica.params });

    const sesion = await sesionActual(entorno.db, request);
    if (!sesion)
      throw new ErrorApi("Tu sesión ha caducado. Vuelve a entrar.", 401, {
        codigo: "sin-sesion",
      });
    const privada = encontrar(privadas, metodo, camino);
    if (!privada) throw new ErrorApi("Esa operación no existe.", 404);
    const respuesta = await privada.r.manejar({ ...base, params: privada.params, sesion });
    if (sesion.cookie) respuesta.headers.append("Set-Cookie", sesion.cookie);
    return respuesta;
  } catch (error) {
    if (error instanceof ErrorApi)
      return json({ ok: false, mensaje: error.message, ...error.extra }, error.estado);
    if (error instanceof ErrorRepositorio)
      return json({ ok: false, mensaje: error.message }, error.estado === 409 ? 409 : 502);
    console.error(JSON.stringify({ event: "admin.error", camino, error: String(error) }));
    return json({ ok: false, mensaje: "Error inesperado del servidor." }, 500);
  }
}
