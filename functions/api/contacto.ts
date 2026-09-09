/**
 * Recepción de formularios en Cloudflare, servida en /api/contacto.
 *
 * Es el equivalente de src/app/api/contacto/route.ts para el despliegue
 * estático: misma validación, mismos mensajes y el mismo comportamiento
 * honesto cuando no hay endpoint configurado. La diferencia es que las
 * variables llegan en context.env, no en process.env.
 *
 * Este archivo vive en la raíz del repositorio porque es donde Cloudflare
 * Pages busca las funciones: dentro de la carpeta compilada las ignora.
 */
// Rutas relativas a propósito: así la resuelven tanto el empaquetador de
// Cloudflare Pages como el del script de subida manual.
import {
  validateContact,
  forSpreadsheet,
} from "../../src/lib/contact-validation";
import { sitio } from "../../src/data/sitio";

type Entorno = {
  CONTACT_WEBHOOK_URL?: string;
  CONTACT_WEBHOOK_TOKEN?: string;
};
type Contexto = { request: Request; env: Entorno };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const intentos = new Map<string, { count: number; until: number }>();

export async function onRequestPost({ request, env }: Contexto) {
  const origin = request.headers.get("origin");
  if (origin && ![new URL(request.url).origin, sitio.url].includes(origin))
    return json({ ok: false, message: "Origen no permitido." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ ok: false, message: "Formato no admitido." }, 415);

  const clave =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const ahora = Date.now();
  for (const [ip, registro] of intentos)
    if (registro.until <= ahora) intentos.delete(ip);
  const intento = intentos.get(clave) || { count: 0, until: ahora + 60000 };
  intento.count++;
  intentos.set(clave, intento);
  if (intento.count > 10)
    return new Response(
      JSON.stringify({ ok: false, message: sitio.contacto.limite }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": "60",
        },
      },
    );

  let crudo: unknown;
  try {
    const cuerpo = await request.text();
    if (cuerpo.length > 16000) return json({ ok: false }, 413);
    crudo = JSON.parse(cuerpo);
  } catch {
    return json({ ok: false, message: sitio.contacto.validacion }, 400);
  }

  const resultado = validateContact(crudo);
  if (!resultado.ok)
    return json(
      {
        ok: false,
        errors: resultado.errors,
        message: sitio.contacto.validacion,
      },
      422,
    );
  // El honeypot se traga en silencio: el robot cree que ha enviado.
  if (resultado.spam) return json({ ok: true, status: "received" });

  const id = crypto.randomUUID();
  const endpoint = env.CONTACT_WEBHOOK_URL;
  if (!endpoint) {
    console.info(
      JSON.stringify({
        event: "contact.pending_configuration",
        id,
        at: new Date().toISOString(),
        ...resultado.data,
      }),
    );
    return json(
      {
        ok: true,
        status: "pending_configuration",
        id,
        message: sitio.contacto.registrado,
      },
      202,
    );
  }

  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.CONTACT_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${env.CONTACT_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        id,
        fecha: new Date().toISOString(),
        ...forSpreadsheet(resultado.data),
      }),
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!respuesta.ok) throw new Error("Webhook delivery failed");
    return json({
      ok: true,
      status: "received",
      id,
      message:
        resultado.data.tipo === "recomendacion"
          ? sitio.contacto.referidoExito
          : sitio.contacto.enviado,
    });
  } catch {
    console.error(JSON.stringify({ event: "contact.delivery_failed", id }));
    return json({ ok: false, message: sitio.contacto.error }, 502);
  }
}
