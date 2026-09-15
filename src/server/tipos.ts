import type { Repositorio } from "./repositorio";

// Lo mínimo de D1 que usa el CMS. En local lo implementa node:sqlite.
export interface Sentencia {
  bind(...valores: unknown[]): Sentencia;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
export interface BaseDatos {
  prepare(sql: string): Sentencia;
  batch(sentencias: Sentencia[]): Promise<unknown>;
}

export type Secretos = {
  /** Clave para crear la cuenta de administrador o recuperar el acceso. */
  ADMIN_SETUP_TOKEN?: string;
  GITHUB_TOKEN?: string;
  /** usuario/repositorio, p. ej. ruimaax/ALARYFES */
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  CONTACT_WEBHOOK_URL?: string;
  CONTACT_WEBHOOK_TOKEN?: string;
  RESEND_API_KEY?: string;
  AVISO_EMAIL_PARA?: string;
  AVISO_EMAIL_DESDE?: string;
  CLOUDFLARE_DEPLOY_HOOK?: string;
  /** Token limitado a Account Analytics: Read para el panel de analítica. */
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** Dominio medido por Cloudflare Web Analytics, p. ej. alaryfes.com. */
  CLOUDFLARE_SITE_HOST?: string;
  /** Nombre del Worker de Pages; si falta se agregan todos los Workers de la cuenta. */
  CLOUDFLARE_WORKER_NAME?: string;
};

export type Entorno = {
  db: BaseDatos | null;
  repo: Repositorio | null;
  secretos: Secretos;
  /** cloudflare: producción. local: `npm run dev`, escribe en el disco. */
  modo: "cloudflare" | "local";
};
