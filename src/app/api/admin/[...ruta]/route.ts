// API del panel en Next. En Cloudflare usa los bindings del Worker (D1 y
// secretos); en `npm run dev` usa el entorno SQLite local.
import { manejarAdmin } from "@/server/admin";
import { entornoNext } from "@/server/entorno-next";
export const runtime = "nodejs";
async function manejar(request: Request) {
  return manejarAdmin(request, await entornoNext());
}
export {
  manejar as GET,
  manejar as POST,
  manejar as PUT,
  manejar as PATCH,
  manejar as DELETE,
};
