// API del panel en `npm run dev`. En producción la sirve la función de
// Cloudflare functions/api/admin/[[ruta]].ts con el mismo código.
import { manejarAdmin } from "@/server/admin";
import { entornoLocal } from "@/server/local";
export const runtime = "nodejs";
async function manejar(request: Request) {
  return manejarAdmin(request, await entornoLocal());
}
export {
  manejar as GET,
  manejar as POST,
  manejar as PUT,
  manejar as PATCH,
  manejar as DELETE,
};
