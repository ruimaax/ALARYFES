/**
 * Recepción de formularios en Cloudflare, servida en /api/contacto.
 *
 * La lógica es la misma que la de src/app/api/contacto/route.ts y vive en
 * src/server/contacto.ts. Cada solicitud se guarda en D1 (bandeja de /admin)
 * y, si está configurado, se reenvía también a Google Sheets.
 *
 * Este archivo vive en la raíz del repositorio porque es donde Cloudflare
 * Pages busca las funciones. Rutas relativas a propósito: el empaquetador de
 * Cloudflare no conoce el alias @/.
 */
import { recibirContacto } from "../../src/server/contacto";
import { configAviso } from "../../src/server/aviso";
import type { EnvCloudflare } from "../../src/server/cloudflare";

export const onRequestPost = ({ request, env }: { request: Request; env: EnvCloudflare }) =>
  recibirContacto(request, {
    db: env.DB ?? null,
    webhook: env.CONTACT_WEBHOOK_URL,
    webhookToken: env.CONTACT_WEBHOOK_TOKEN,
    aviso: configAviso(env),
  });
