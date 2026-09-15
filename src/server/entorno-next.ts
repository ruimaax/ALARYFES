import { getCloudflareContext } from "@opennextjs/cloudflare";
import { entornoCloudflare, type EnvCloudflare } from "./cloudflare";
import type { Entorno, Secretos } from "./tipos";

/**
 * Entorno de las Route Handlers de Next.
 *
 * En Cloudflare, OpenNext expone D1 y los secretos mediante su contexto. En
 * `next dev` ese contexto no existe y se conserva el entorno SQLite local.
 */
export async function entornoNext(): Promise<Entorno> {
  if (process.env.NODE_ENV === "development") {
    const { entornoLocal } = await import("./local");
    return entornoLocal();
  }
  // Los tests de las Route Handlers se ejecutan sin servidor ni binding D1.
  if (process.env.NODE_ENV !== "production")
    return { db: null, repo: null, secretos: process.env as Secretos, modo: "local" };
  try {
    const { env } = getCloudflareContext();
    return entornoCloudflare(env as unknown as EnvCloudflare);
  } catch {
    const { entornoLocal } = await import("./local");
    return entornoLocal();
  }
}
