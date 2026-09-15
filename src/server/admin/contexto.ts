import type { BaseDatos, Entorno } from "../tipos";

export type Contexto = {
  request: Request;
  entorno: Entorno;
  db: BaseDatos;
  url: URL;
  ip: string;
  /** Grupos capturados por el patrón de la ruta. */
  params: string[];
  /** Solo en rutas privadas: la sesión que hace la petición. */
  sesion?: { id: string };
};
export type Ruta = {
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  patron: RegExp;
  manejar: (c: Contexto) => Promise<Response>;
};
export const ruta = (
  metodo: Ruta["metodo"],
  patron: RegExp,
  manejar: Ruta["manejar"],
): Ruta => ({ metodo, patron, manejar });

export type Admin = {
  email: string;
  clave: string;
  totp: string | null;
  totp_pendiente: string | null;
  totp_ultimo: number;
};
export const leerAdmin = (db: BaseDatos) =>
  db.prepare("SELECT * FROM administrador WHERE id = 1").first<Admin>();
