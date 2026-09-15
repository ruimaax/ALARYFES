import { sha256Hex, tokenAleatorio } from "./cripto";
import type { BaseDatos } from "./tipos";

// Sesión de 12 horas que se renueva con el uso, con un máximo de 7 días.
const DURACION = 12 * 3600_000;
const MAXIMA = 7 * 24 * 3600_000;
const COOKIE = "alaryfes_admin";
const iso = (ms: number) => new Date(ms).toISOString();

const segura = (request: Request) => new URL(request.url).protocol === "https:";
// En HTTPS el prefijo __Host- impide que otro subdominio pise la cookie.
const nombreCookie = (request: Request) =>
  segura(request) ? `__Host-${COOKIE}` : COOKIE;

export const ipDe = (request: Request) =>
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "local";

function leerToken(request: Request) {
  const nombre = nombreCookie(request);
  for (const parte of (request.headers.get("cookie") || "").split(";")) {
    const [clave, ...valor] = parte.trim().split("=");
    if (clave === nombre) return decodeURIComponent(valor.join("="));
  }
  return null;
}

const cookie = (request: Request, valor: string, segundos: number) =>
  [
    `${nombreCookie(request)}=${valor}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(segundos))}`,
    ...(segura(request) ? ["Secure"] : []),
  ].join("; ");

/** Crea la sesión y devuelve la cabecera Set-Cookie. */
export async function crearSesion(db: BaseDatos, request: Request) {
  const token = tokenAleatorio(32);
  const t = Date.now();
  // En la base de datos solo se guarda el hash: una copia de D1 no da acceso.
  await db
    .prepare(
      "INSERT INTO sesiones (id, creada, expira, limite, visto, ip, agente) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      await sha256Hex(token),
      iso(t),
      iso(t + DURACION),
      iso(t + MAXIMA),
      iso(t),
      ipDe(request),
      (request.headers.get("user-agent") || "").slice(0, 200),
    )
    .run();
  await db
    .prepare("DELETE FROM sesiones WHERE expira < ? OR limite < ?")
    .bind(iso(t), iso(t))
    .run();
  return cookie(request, token, DURACION / 1000);
}

export async function sesionActual(
  db: BaseDatos,
  request: Request,
  renovar = true,
): Promise<{ id: string; cookie?: string } | null> {
  const token = leerToken(request);
  if (!token || token.length > 100) return null;
  const id = await sha256Hex(token);
  const fila = await db
    .prepare("SELECT expira, limite FROM sesiones WHERE id = ?")
    .bind(id)
    .first<{ expira: string; limite: string }>();
  const t = Date.now();
  if (!fila || fila.expira <= iso(t) || fila.limite <= iso(t)) return null;
  // Se renueva como mucho cada cinco minutos para no escribir en cada petición.
  if (renovar && Date.parse(fila.expira) - t < DURACION - 5 * 60_000) {
    const expira = Math.min(t + DURACION, Date.parse(fila.limite));
    await db
      .prepare("UPDATE sesiones SET expira = ?, visto = ? WHERE id = ?")
      .bind(iso(expira), iso(t), id)
      .run();
    return { id, cookie: cookie(request, token, (expira - t) / 1000) };
  }
  return { id };
}

export async function cerrarSesion(db: BaseDatos, request: Request) {
  const token = leerToken(request);
  if (token)
    await db.prepare("DELETE FROM sesiones WHERE id = ?").bind(await sha256Hex(token)).run();
  return cookie(request, "", 0);
}

/**
 * Bloqueo por intentos fallidos: 5 por dirección IP y 20 en total, cada uno
 * durante 15 minutos. El límite global frena ataques desde muchas IP sin
 * dejarte fuera por culpa de un único atacante.
 */
const BLOQUEO = 15 * 60_000;
export const limitesAcceso = (request: Request): [string, number][] => [
  [`ip:${ipDe(request)}`, 5],
  ["global", 20],
];

export async function segundosBloqueado(db: BaseDatos, limites: [string, number][]) {
  const t = iso(Date.now());
  for (const [clave] of limites) {
    const fila = await db
      .prepare("SELECT hasta FROM intentos WHERE clave = ?")
      .bind(clave)
      .first<{ hasta: string | null }>();
    if (fila?.hasta && fila.hasta > t)
      return Math.ceil((Date.parse(fila.hasta) - Date.now()) / 1000);
  }
  return 0;
}

export async function anotarFallo(db: BaseDatos, limites: [string, number][]) {
  for (const [clave, maximo] of limites) {
    await db
      .prepare(
        `INSERT INTO intentos (clave, fallos, hasta) VALUES (?, 1, NULL)
         ON CONFLICT(clave) DO UPDATE SET fallos = fallos + 1`,
      )
      .bind(clave)
      .run();
    const fila = await db
      .prepare("SELECT fallos FROM intentos WHERE clave = ?")
      .bind(clave)
      .first<{ fallos: number }>();
    if ((fila?.fallos ?? 0) >= maximo)
      await db
        .prepare("UPDATE intentos SET fallos = 0, hasta = ? WHERE clave = ?")
        .bind(iso(Date.now() + BLOQUEO), clave)
        .run();
  }
}

export async function limpiarFallos(db: BaseDatos, request: Request) {
  await db
    .prepare("DELETE FROM intentos WHERE clave = ?")
    .bind(`ip:${ipDe(request)}`)
    .run();
}
