import { validateContact, forSpreadsheet } from "@/lib/contact-validation";
import { sitio } from "@/data/sitio";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && ![new URL(request.url).origin, sitio.url].includes(origin))
    return Response.json(
      { ok: false, message: "Origen no permitido." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json(
      { ok: false, message: "Formato no admitido." },
      { status: 415 },
    );
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  for (const [ip, record] of attempts)
    if (record.until <= now) attempts.delete(ip);
  const attempt = attempts.get(key) || { count: 0, until: now + 60000 };
  attempt.count++;
  attempts.set(key, attempt);
  if (attempt.count > 10)
    return Response.json(
      { ok: false, message: sitio.contacto.limite },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  let raw: unknown;
  try {
    if (Number(request.headers.get("content-length") || 0) > 16000)
      return Response.json({ ok: false }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ ok: false }, { status: 400 });
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16000) {
        await reader.cancel();
        return Response.json({ ok: false }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return Response.json(
      { ok: false, message: sitio.contacto.validacion },
      { status: 400 },
    );
  }
  const result = validateContact(raw);
  if (!result.ok)
    return Response.json(
      { ok: false, errors: result.errors, message: sitio.contacto.validacion },
      { status: 422 },
    );
  if (result.spam) return Response.json({ ok: true, status: "received" });
  const id = crypto.randomUUID();
  const endpoint = process.env.CONTACT_WEBHOOK_URL;
  if (!endpoint) {
    // Explicit preparation fallback. Configure log retention before receiving real personal data.
    console.info(
      JSON.stringify({
        event: "contact.pending_configuration",
        id,
        at: new Date().toISOString(),
        ...result.data,
      }),
    );
    return Response.json(
      {
        ok: true,
        status: "pending_configuration",
        id,
        message: sitio.contacto.registrado,
      },
      { status: 202 },
    );
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CONTACT_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.CONTACT_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        id,
        fecha: new Date().toISOString(),
        ...forSpreadsheet(result.data),
      }),
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!response.ok) throw new Error("Webhook delivery failed");
    return Response.json({
      ok: true,
      status: "received",
      id,
      message:
        result.data.tipo === "recomendacion"
          ? sitio.contacto.referidoExito
          : sitio.contacto.enviado,
    });
  } catch {
    console.error(JSON.stringify({ event: "contact.delivery_failed", id }));
    return Response.json(
      { ok: false, message: sitio.contacto.error },
      { status: 502 },
    );
  }
}
