import { aBase64, deBase64, type Bytes } from "./cripto";

export type ArchivoRepo = {
  ruta: string;
  nombre: string;
  sha: string;
  tamano: number;
};
export type CommitResumen = {
  sha: string;
  mensaje: string;
  fecha: string;
  autor: string;
  url?: string;
};
export type EstadoDespliegue = {
  estado: "pendiente" | "ok" | "error" | "desconocido";
  detalle: string;
  url?: string;
};
export type CambioRepo = {
  ruta: string;
  texto?: string;
  bytes?: Bytes;
  borrar?: boolean;
};

/** Dónde vive el contenido publicado: GitHub en producción, el disco en local. */
export interface Repositorio {
  tipo: "github" | "local";
  descripcion: string;
  leer(ruta: string): Promise<{ bytes: Bytes; sha: string } | null>;
  listar(carpeta: string): Promise<ArchivoRepo[]>;
  /** El sha publicado de varias rutas de una vez (null si no existe). */
  shasDe(rutas: string[]): Promise<Record<string, string | null>>;
  /** Todos los archivos de texto de una carpeta y sus subcarpetas directas. */
  leerTextos(carpeta: string): Promise<Record<string, string>>;
  publicar(
    cambios: CambioRepo[],
    mensaje: string,
  ): Promise<{ sha: string | null; url?: string }>;
  historial(ruta: string, limite: number): Promise<CommitResumen[]>;
  detalleCommit(
    sha: string,
  ): Promise<{ commit: CommitResumen; archivos: { ruta: string; estado: string }[] }>;
  leerEnVersion(ruta: string, sha: string): Promise<Bytes | null>;
  estadoDespliegue(sha: string): Promise<EstadoDespliegue>;
  comprobar(): Promise<{ ok: boolean; detalle: string }>;
}

export class ErrorRepositorio extends Error {
  constructor(
    mensaje: string,
    public estado = 502,
  ) {
    super(mensaje);
  }
}

const codificarRuta = (ruta: string) =>
  ruta.split("/").map(encodeURIComponent).join("/");

type RespuestaCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } };
  files?: { filename: string; status: string }[];
};
const resumen = (c: RespuestaCommit): CommitResumen => ({
  sha: c.sha,
  mensaje: c.commit.message,
  fecha: c.commit.author.date,
  autor: c.commit.author.name,
  url: c.html_url,
});

/**
 * Publica escribiendo commits en GitHub con la API de Git. Cloudflare Pages
 * está conectado al repositorio y recompila la web con cada commit.
 */
export class RepositorioGitHub implements Repositorio {
  tipo = "github" as const;
  constructor(
    private token: string,
    private repo: string,
    private rama = "main",
  ) {}
  get descripcion() {
    return `GitHub · ${this.repo} (rama ${this.rama})`;
  }

  private async api<T>(
    ruta: string,
    init: RequestInit = {},
    permitir404 = false,
  ): Promise<T | null> {
    const respuesta = await fetch(`https://api.github.com/repos/${this.repo}${ruta}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        // GitHub rechaza las peticiones sin User-Agent.
        "User-Agent": "alaryfes-cms",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (permitir404 && respuesta.status === 404) return null;
    if (!respuesta.ok) {
      const detalle = (await respuesta.text().catch(() => "")).slice(0, 180);
      const mensajes: Record<number, string> = {
        401: "El token de GitHub no es válido o ha caducado.",
        403: "El token de GitHub no tiene permiso para esta operación (necesita Contents: Read and write).",
        404: "No se encuentra el repositorio o la rama en GitHub. Revisa GITHUB_REPO y GITHUB_BRANCH.",
      };
      throw new ErrorRepositorio(
        mensajes[respuesta.status] || `GitHub respondió ${respuesta.status}. ${detalle}`,
        respuesta.status === 409 || respuesta.status === 422 ? 409 : 502,
      );
    }
    return (respuesta.status === 204 ? null : await respuesta.json()) as T;
  }

  async leer(ruta: string) {
    return this.leerEnRef(ruta, this.rama);
  }
  private async leerEnRef(ruta: string, ref: string) {
    const datos = await this.api<{
      type: string;
      sha: string;
      content?: string;
      encoding?: string;
    }>(`/contents/${codificarRuta(ruta)}?ref=${encodeURIComponent(ref)}`, {}, true);
    if (!datos || Array.isArray(datos) || datos.type !== "file") return null;
    // Por encima de 1 MB la API de contenidos no devuelve el archivo: se pide
    // el blob directamente.
    const bytes =
      datos.encoding === "base64" && datos.content
        ? deBase64(datos.content)
        : deBase64(
            (await this.api<{ content: string }>(`/git/blobs/${datos.sha}`))!.content,
          );
    return { bytes, sha: datos.sha };
  }

  async listar(carpeta: string) {
    const datos = await this.api<
      { type: string; path: string; name: string; sha: string; size: number }[]
    >(`/contents/${codificarRuta(carpeta)}?ref=${encodeURIComponent(this.rama)}`, {}, true);
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((d) => d.type === "file")
      .map((d) => ({ ruta: d.path, nombre: d.name, sha: d.sha, tamano: d.size }));
  }

  async shasDe(rutas: string[]) {
    // Un único árbol recursivo en lugar de una petición por archivo.
    const datos = await this.api<{ tree: { path: string; sha: string; type: string }[] }>(
      `/git/trees/${encodeURIComponent(this.rama)}?recursive=1`,
    );
    const mapa = new Map(
      (datos?.tree || []).filter((e) => e.type === "blob").map((e) => [e.path, e.sha]),
    );
    return Object.fromEntries(rutas.map((r) => [r, mapa.get(r) ?? null]));
  }

  async leerTextos(carpeta: string) {
    // GraphQL permite traer todo el contenido en una sola petición.
    type Entrada = {
      name: string;
      type: string;
      object?: { text?: string | null; isBinary?: boolean; entries?: Entrada[] };
    };
    const [owner, name] = this.repo.split("/");
    const blob = "... on Blob { text isBinary }";
    const query = `query($owner: String!, $name: String!, $expr: String!) {
      repository(owner: $owner, name: $name) { object(expression: $expr) {
        ... on Tree { entries { name type object { ${blob}
          ... on Tree { entries { name type object { ${blob} } } } } } } } } }`;
    const respuesta = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "User-Agent": "alaryfes-cms",
      },
      body: JSON.stringify({
        query,
        variables: { owner, name, expr: `${this.rama}:${carpeta}` },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!respuesta.ok)
      throw new ErrorRepositorio(`GitHub respondió ${respuesta.status} al leer el contenido.`);
    const datos = (await respuesta.json()) as {
      data?: { repository?: { object?: { entries?: Entrada[] } } };
    };
    const salida: Record<string, string> = {};
    const recorrer = (entradas: Entrada[] = [], base: string) => {
      for (const e of entradas) {
        const ruta = `${base}/${e.name}`;
        if (e.type === "blob" && typeof e.object?.text === "string" && !e.object.isBinary)
          salida[ruta] = e.object.text;
        else if (e.type === "tree") recorrer(e.object?.entries, ruta);
      }
    };
    recorrer(datos.data?.repository?.object?.entries, carpeta);
    return salida;
  }

  async publicar(cambios: CambioRepo[], mensaje: string) {
    // Los binarios se suben antes como blobs; el texto va dentro del árbol,
    // así un cambio grande de contenido no multiplica las peticiones.
    const arbol: Record<string, unknown>[] = [];
    for (const cambio of cambios) {
      if (cambio.borrar)
        arbol.push({ path: cambio.ruta, mode: "100644", type: "blob", sha: null });
      else if (cambio.texto !== undefined)
        arbol.push({ path: cambio.ruta, mode: "100644", type: "blob", content: cambio.texto });
      else if (cambio.bytes) {
        const blob = await this.api<{ sha: string }>("/git/blobs", {
          method: "POST",
          body: JSON.stringify({ content: aBase64(cambio.bytes), encoding: "base64" }),
        });
        arbol.push({ path: cambio.ruta, mode: "100644", type: "blob", sha: blob!.sha });
      }
    }
    for (let intento = 0; ; intento++) {
      const ref = await this.api<{ object: { sha: string } }>(
        `/git/ref/heads/${encodeURIComponent(this.rama)}`,
      );
      const padre = ref!.object.sha;
      const base = await this.api<{ tree: { sha: string } }>(`/git/commits/${padre}`);
      const nuevoArbol = await this.api<{ sha: string }>("/git/trees", {
        method: "POST",
        body: JSON.stringify({ base_tree: base!.tree.sha, tree: arbol }),
      });
      const commit = await this.api<{ sha: string; html_url: string }>("/git/commits", {
        method: "POST",
        body: JSON.stringify({ message: mensaje, tree: nuevoArbol!.sha, parents: [padre] }),
      });
      try {
        await this.api(`/git/refs/heads/${encodeURIComponent(this.rama)}`, {
          method: "PATCH",
          body: JSON.stringify({ sha: commit!.sha, force: false }),
        });
        return { sha: commit!.sha, url: commit!.html_url };
      } catch (error) {
        // Alguien ha subido otro commit a la vez: se reintenta sobre el nuevo.
        if (error instanceof ErrorRepositorio && error.estado === 409 && intento < 2)
          continue;
        throw error;
      }
    }
  }

  async historial(ruta: string, limite: number) {
    const datos = await this.api<RespuestaCommit[]>(
      `/commits?sha=${encodeURIComponent(this.rama)}&path=${encodeURIComponent(ruta)}&per_page=${limite}`,
    );
    return (datos || []).map(resumen);
  }

  async detalleCommit(sha: string) {
    const datos = (await this.api<RespuestaCommit>(`/commits/${encodeURIComponent(sha)}`))!;
    return {
      commit: resumen(datos),
      archivos: (datos.files || []).map((f) => ({ ruta: f.filename, estado: f.status })),
    };
  }

  async leerEnVersion(ruta: string, sha: string) {
    return (await this.leerEnRef(ruta, sha))?.bytes ?? null;
  }

  async estadoDespliegue(sha: string): Promise<EstadoDespliegue> {
    // Cloudflare Pages informa en GitHub como «check» o como estado del commit.
    try {
      const datos = await this.api<{
        check_runs: {
          name: string;
          status: string;
          conclusion: string | null;
          details_url?: string;
          html_url?: string;
        }[];
      }>(`/commits/${sha}/check-runs`);
      const run =
        datos?.check_runs.find((r) => /cloudflare/i.test(r.name)) ?? datos?.check_runs[0];
      if (run) {
        const url = run.details_url || run.html_url;
        if (run.status !== "completed")
          return { estado: "pendiente", detalle: "Cloudflare está compilando la web…", url };
        return run.conclusion === "success"
          ? { estado: "ok", detalle: "Publicado en la web.", url }
          : { estado: "error", detalle: `La compilación ha fallado (${run.conclusion}).`, url };
      }
    } catch {
      /* Sin permiso de lectura de checks: se prueba con los estados. */
    }
    try {
      const datos = await this.api<{
        statuses: { state: string; context: string; target_url?: string; description?: string }[];
      }>(`/commits/${sha}/status`);
      const estado =
        datos?.statuses.find((s) => /cloudflare/i.test(s.context)) ?? datos?.statuses[0];
      if (estado) {
        const url = estado.target_url;
        if (estado.state === "pending")
          return { estado: "pendiente", detalle: "Cloudflare está compilando la web…", url };
        return estado.state === "success"
          ? { estado: "ok", detalle: "Publicado en la web.", url }
          : { estado: "error", detalle: estado.description || "La compilación ha fallado.", url };
      }
    } catch {
      /* Se informa como desconocido. */
    }
    return {
      estado: "desconocido",
      detalle:
        "Cloudflare todavía no ha informado. Suele tardar entre 1 y 3 minutos; si no cambia, revisa Cloudflare Pages.",
    };
  }

  async comprobar() {
    try {
      await this.api(`/branches/${encodeURIComponent(this.rama)}`);
      return { ok: true, detalle: this.descripcion };
    } catch (error) {
      return { ok: false, detalle: (error as Error).message };
    }
  }
}
