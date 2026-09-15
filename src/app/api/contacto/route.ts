import { recibirContacto } from "@/server/contacto";
import { configAviso } from "@/server/aviso";
import { entornoNext } from "@/server/entorno-next";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const entorno = await entornoNext();
  return recibirContacto(request, {
    db: entorno.db,
    webhook: entorno.secretos.CONTACT_WEBHOOK_URL,
    webhookToken: entorno.secretos.CONTACT_WEBHOOK_TOKEN,
    aviso: configAviso(entorno.secretos),
  });
}
