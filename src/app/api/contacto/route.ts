import { recibirContacto } from "@/server/contacto";
import { configAviso } from "@/server/aviso";
import type { Secretos } from "@/server/tipos";
export const runtime = "nodejs";
export async function POST(request: Request) {
  // En `npm run dev` las solicitudes se guardan en la base local del panel
  // (.cms-local/) para poder probar /admin → Solicitudes.
  const db =
    process.env.NODE_ENV === "development"
      ? (await (await import("@/server/local")).entornoLocal()).db
      : null;
  return recibirContacto(request, {
    db,
    webhook: process.env.CONTACT_WEBHOOK_URL,
    webhookToken: process.env.CONTACT_WEBHOOK_TOKEN,
    aviso: configAviso(process.env as Secretos),
  });
}
