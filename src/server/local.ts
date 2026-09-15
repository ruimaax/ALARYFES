// Entorno del panel en `npm run dev`: base de datos SQLite en .cms-local/ y
// publicación escribiendo directamente en los archivos del proyecto.
// Con CMS_LOCAL_GITHUB=1 (y GITHUB_TOKEN/GITHUB_REPO) publica en GitHub, como
// en producción.
import path from "node:path";
import type { Entorno, Secretos } from "./tipos";

let entorno: Promise<Entorno> | null = null;

export function entornoLocal(): Promise<Entorno> {
  return (entorno ??= (async () => {
    const { abrirBaseLocal } = await import("./bd-local");
    const { RepositorioLocal } = await import("./repositorio-local");
    const { RepositorioGitHub } = await import("./repositorio");
    const raiz = process.cwd();
    const e = process.env;
    return {
      db: abrirBaseLocal(path.join(raiz, ".cms-local", "cms.sqlite")),
      repo:
        e.CMS_LOCAL_GITHUB === "1" && e.GITHUB_TOKEN && e.GITHUB_REPO
          ? new RepositorioGitHub(e.GITHUB_TOKEN, e.GITHUB_REPO, e.GITHUB_BRANCH || "main")
          : new RepositorioLocal(raiz),
      secretos: e as Secretos,
      modo: "local" as const,
    };
  })());
}
