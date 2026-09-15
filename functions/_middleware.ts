/**
 * Protege las páginas de /admin: sin sesión válida solo se puede ver la
 * pantalla de acceso. La API (/api/admin) comprueba la sesión por su cuenta.
 *
 * public/_routes.json limita las funciones a /api/* y /admin*, así que el
 * resto de la web se sirve estática sin pasar por aquí.
 */
import { asegurarEsquema } from "../src/server/bd";
import { sesionActual } from "../src/server/sesion";
import type { BaseDatos } from "../src/server/tipos";

type Contexto = {
  request: Request;
  env: { DB?: BaseDatos };
  next: () => Promise<Response>;
};

export async function onRequest({ request, env, next }: Contexto) {
  const url = new URL(request.url);
  if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return next();

  const libre = /^\/admin\/login(\/|\.|$)/.test(url.pathname);
  if (!libre) {
    let valida = false;
    if (env.DB)
      try {
        await asegurarEsquema(env.DB);
        valida = !!(await sesionActual(env.DB, request, false));
      } catch {
        valida = false;
      }
    if (!valida) {
      const destino = new URL("/admin/login", url);
      if (url.pathname !== "/admin")
        destino.searchParams.set("volver", url.pathname + url.search);
      return Response.redirect(destino.toString(), 302);
    }
  }
  const respuesta = await next();
  const copia = new Response(respuesta.body, respuesta);
  copia.headers.set("X-Robots-Tag", "noindex, nofollow");
  copia.headers.set("Cache-Control", "no-store");
  copia.headers.set("Referrer-Policy", "same-origin");
  return copia;
}
