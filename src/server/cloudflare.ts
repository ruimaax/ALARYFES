import { RepositorioGitHub } from "./repositorio";
import type { BaseDatos, Entorno, Secretos } from "./tipos";

/** Variables y vínculos del proyecto de Cloudflare Pages. */
export type EnvCloudflare = Secretos & { DB?: BaseDatos };

export function entornoCloudflare(env: EnvCloudflare): Entorno {
  return {
    db: env.DB ?? null,
    repo:
      env.GITHUB_TOKEN && env.GITHUB_REPO
        ? new RepositorioGitHub(env.GITHUB_TOKEN, env.GITHUB_REPO, env.GITHUB_BRANCH || "main")
        : null,
    secretos: env,
    modo: "cloudflare",
  };
}
