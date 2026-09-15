/**
 * Recepción de los formularios de la web, compartida por la función de
 * Cloudflare (functions/api/contacto.ts) y la ruta de Next (src/app/api).
 *
 * Cada solicitud se guarda en D1 (bandeja de /admin → Solicitudes) y, si hay
 * endpoint configurado, se reenvía también a la hoja de Google Sheets. Solo se
 * confirma al visitante si al menos uno de los dos la ha guardado.
 */
import {
  validateContact,
  forSpreadsheet,
  type ContactPayload,
} from "../lib/contact-validation";
import { sitio } from "../data/sitio";
import { ahora, asegurarEsquema } from "./bd";
import { avisarNuevaSolicitud, type ConfigAviso } from "./aviso";
import { origenPermitido } from "./origen";
import type { BaseDatos } from "./tipos";

export type EntornoContacto = {
  db: BaseDatos | null;
  webhook?: string;
  webhookToken?: string;
  aviso?: ConfigAviso | null;
};

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });

// Limitador por instancia y en memoria; para abusos serios, el firewall de
// Cloudflare.
const intentos = new Map<string, { count: number; until: number }>();

async function leerCuerpo(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16000) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16000) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

/** Reenvía una solicitud a la hoja. Devuelve si el endpoint respondió 2xx. */
export async function enviarAHoja(
  cfg: { webhook: string; webhookToken?: string },
  id: string,
  fecha: string,
  datos: ContactPayload,
) {
  try {
    const respuesta = await fetch(cfg.webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.webhookToken ? { Authorization: `Bearer ${cfg.webhookToken}` } : {}),
      },
      body: JSON.stringify({ id, fecha, ...forSpreadsheet(datos) }),
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

export async function guardarSolicitud(
  db: BaseDatos,
  id: string,
  fecha: string,
  d: ContactPayload,
) {
  await asegurarEsquema(db);
  await db
    .prepare(
      `INSERT INTO solicitudes (id, creada, actualizada, tipo, estado, nombre, negocio,
        telefono, sector, plan, mensaje, referido_negocio, referido_contacto)
       VALUES (?, ?, ?, ?, 'nueva', ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      fecha,
      fecha,
      d.tipo,
      d.nombre,
      d.negocio,
      d.telefono ?? null,
      d.sector ?? null,
      d.plan ?? null,
      d.mensaje ?? null,
      d.referidoNegocio ?? null,
      d.referidoContacto ?? null,
    )
    .run();
}

export async function recibirContacto(
  request: Request,
  entorno: EntornoContacto,
): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && !origenPermitido(request, [sitio.url]))
    return json({ ok: false, message: "Origen no permitido." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ ok: false, message: "Formato no admitido." }, 415);

  const clave =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const now = Date.now();
  for (const [ip, record] of intentos) if (record.until <= now) intentos.delete(ip);
  const intento = intentos.get(clave) || { count: 0, until: now + 60000 };
  intento.count++;
  intentos.set(clave, intento);
  if (intento.count > 10)
    return json({ ok: false, message: sitio.contacto.limite }, 429, {
      "Retry-After": "60",
    });

  let raw: unknown;
  try {
    const cuerpo = await leerCuerpo(request);
    if (cuerpo === null) return json({ ok: false }, 413);
    raw = JSON.parse(cuerpo);
  } catch {
    return json({ ok: false, message: sitio.contacto.validacion }, 400);
  }
  const result = validateContact(raw);
  if (!result.ok)
    return json(
      { ok: false, errors: result.errors, message: sitio.contacto.validacion },
      422,
    );
  // El honeypot se traga en silencio: el robot cree que ha enviado.
  if (result.spam) return json({ ok: true, status: "received" });

  const id = crypto.randomUUID();
  const fecha = ahora();
  const { db, webhook } = entorno;

  let guardada = false;
  if (db)
    try {
      await guardarSolicitud(db, id, fecha, result.data);
      guardada = true;
    } catch (error) {
      console.error(JSON.stringify({ event: "contact.store_failed", id, error: String(error) }));
    }

  let entregada = false;
  if (webhook) {
    entregada = await enviarAHoja({ webhook, webhookToken: entorno.webhookToken }, id, fecha, result.data);
    if (!entregada) console.error(JSON.stringify({ event: "contact.delivery_failed", id }));
    if (guardada && db)
      await db
        .prepare("UPDATE solicitudes SET sheets = ? WHERE id = ?")
        .bind(entregada ? "ok" : "error", id)
        .run()
        .catch(() => undefined);
  }

  if (guardada || entregada) {
    if (entorno.aviso)
      await avisarNuevaSolicitud(entorno.aviso, sitio.url, id, result.data).catch((error) =>
        console.error(JSON.stringify({ event: "contact.notify_failed", id, error: String(error) })),
      );
    return json({
      ok: true,
      status: "received",
      id,
      message:
        result.data.tipo === "recomendacion"
          ? sitio.contacto.referidoExito
          : sitio.contacto.enviado,
    });
  }
  if (!db && !webhook) {
    // Modo de preparación explícito: sin base de datos ni hoja, la solicitud
    // solo queda en los registros del servidor y así se le dice al visitante.
    console.info(
      JSON.stringify({ event: "contact.pending_configuration", id, at: fecha, ...result.data }),
    );
    return json(
      { ok: true, status: "pending_configuration", id, message: sitio.contacto.registrado },
      202,
    );
  }
  return json({ ok: false, message: sitio.contacto.error }, 502);
}
