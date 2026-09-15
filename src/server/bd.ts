import type { BaseDatos } from "./tipos";

// La base de datos se prepara sola en la primera petición: no hace falta
// ejecutar migraciones a mano en Cloudflare.
const TABLAS = [
  `CREATE TABLE IF NOT EXISTS administrador (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    email TEXT NOT NULL,
    clave TEXT NOT NULL,
    totp TEXT,
    totp_pendiente TEXT,
    totp_ultimo INTEGER NOT NULL DEFAULT 0,
    creado TEXT NOT NULL,
    actualizado TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sesiones (
    id TEXT PRIMARY KEY,
    creada TEXT NOT NULL,
    expira TEXT NOT NULL,
    limite TEXT NOT NULL,
    visto TEXT NOT NULL,
    ip TEXT,
    agente TEXT)`,
  `CREATE TABLE IF NOT EXISTS intentos (
    clave TEXT PRIMARY KEY,
    fallos INTEGER NOT NULL DEFAULT 0,
    hasta TEXT)`,
  `CREATE TABLE IF NOT EXISTS solicitudes (
    id TEXT PRIMARY KEY,
    creada TEXT NOT NULL,
    actualizada TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'nueva',
    nombre TEXT NOT NULL,
    negocio TEXT NOT NULL,
    telefono TEXT,
    sector TEXT,
    plan TEXT,
    mensaje TEXT,
    referido_negocio TEXT,
    referido_contacto TEXT,
    notas TEXT NOT NULL DEFAULT '',
    sheets TEXT NOT NULL DEFAULT 'no')`,
  `CREATE INDEX IF NOT EXISTS solicitudes_creada ON solicitudes (creada)`,
  `CREATE TABLE IF NOT EXISTS borradores (
    ruta TEXT PRIMARY KEY,
    contenido TEXT,
    binario INTEGER NOT NULL DEFAULT 0,
    borrar INTEGER NOT NULL DEFAULT 0,
    base TEXT,
    actualizado TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS registro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    accion TEXT NOT NULL,
    detalle TEXT,
    ip TEXT)`,
  `CREATE TABLE IF NOT EXISTS publicaciones (
    sha TEXT PRIMARY KEY,
    fecha TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    archivos INTEGER NOT NULL,
    url TEXT)`,
];

const preparadas = new WeakMap<BaseDatos, Promise<void>>();
export function asegurarEsquema(db: BaseDatos) {
  let lista = preparadas.get(db);
  if (!lista) {
    lista = db
      .batch(TABLAS.map((sql) => db.prepare(sql.replace(/\s+/g, " "))))
      .then(() => undefined);
    preparadas.set(db, lista);
    lista.catch(() => preparadas.delete(db));
  }
  return lista;
}

export const ahora = () => new Date().toISOString();
export const cambios = (resultado: { meta?: { changes?: number } }) =>
  resultado.meta?.changes ?? 0;

export async function anotar(
  db: BaseDatos,
  accion: string,
  detalle = "",
  ip = "",
) {
  await db
    .prepare("INSERT INTO registro (fecha, accion, detalle, ip) VALUES (?, ?, ?, ?)")
    .bind(ahora(), accion, detalle.slice(0, 500), ip)
    .run();
}
