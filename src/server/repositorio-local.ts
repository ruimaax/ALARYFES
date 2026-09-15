// Solo para `npm run dev`: publica escribiendo directamente en los archivos
// del proyecto. Nunca se incluye en las funciones de Cloudflare.
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { shaGit } from "./cripto";
import type { CambioRepo, CommitResumen, Repositorio } from "./repositorio";

const ejecutar = promisify(execFile);
const SEPARADOR = "\x1f";
const FIN = "\x1e";

export class RepositorioLocal implements Repositorio {
  tipo = "local" as const;
  descripcion = "Archivos locales del proyecto (npm run dev)";
  constructor(private raiz: string) {}

  private absoluta(ruta: string) {
    const absoluta = path.resolve(this.raiz, ruta);
    if (!absoluta.startsWith(this.raiz + path.sep))
      throw new Error("Ruta fuera del proyecto");
    return absoluta;
  }
  private git(argumentos: string[], buffer = false) {
    return ejecutar("git", argumentos, {
      cwd: this.raiz,
      maxBuffer: 20 * 1024 * 1024,
      encoding: buffer ? "buffer" : "utf8",
    });
  }

  async leer(ruta: string) {
    try {
      const bytes = new Uint8Array(await readFile(this.absoluta(ruta)));
      return { bytes, sha: await shaGit(bytes) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async listar(carpeta: string) {
    try {
      const entradas = await readdir(this.absoluta(carpeta), { withFileTypes: true });
      return await Promise.all(
        entradas
          .filter((e) => e.isFile() && !e.name.startsWith("."))
          .map(async (e) => {
            const ruta = `${carpeta}/${e.name}`;
            const bytes = new Uint8Array(await readFile(this.absoluta(ruta)));
            return {
              ruta,
              nombre: e.name,
              sha: await shaGit(bytes),
              tamano: (await stat(this.absoluta(ruta))).size,
            };
          }),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async shasDe(rutas: string[]) {
    return Object.fromEntries(
      await Promise.all(rutas.map(async (r) => [r, (await this.leer(r))?.sha ?? null])),
    );
  }

  async leerTextos(carpeta: string) {
    const salida: Record<string, string> = {};
    const recorrer = async (relativa: string, nivel: number) => {
      const entradas = await readdir(this.absoluta(relativa), { withFileTypes: true }).catch(
        () => [],
      );
      for (const e of entradas) {
        const ruta = `${relativa}/${e.name}`;
        if (e.isFile() && /\.(json|md)$/.test(e.name))
          salida[ruta] = await readFile(this.absoluta(ruta), "utf8");
        else if (e.isDirectory() && nivel < 1) await recorrer(ruta, nivel + 1);
      }
    };
    await recorrer(carpeta, 0);
    return salida;
  }

  async publicar(cambios: CambioRepo[]) {
    for (const cambio of cambios) {
      const destino = this.absoluta(cambio.ruta);
      if (cambio.borrar) await rm(destino, { force: true });
      else {
        await mkdir(path.dirname(destino), { recursive: true });
        await writeFile(destino, cambio.texto ?? cambio.bytes ?? "");
      }
    }
    return { sha: null };
  }

  private leerCommits(salida: string): CommitResumen[] {
    return salida
      .split(FIN)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((registro) => {
        const [sha, mensaje, fecha, autor] = registro.split(SEPARADOR);
        return { sha, mensaje, fecha, autor };
      });
  }

  async historial(ruta: string, limite: number) {
    try {
      const { stdout } = await this.git([
        "log",
        `-n${limite}`,
        `--format=%H${SEPARADOR}%s${SEPARADOR}%aI${SEPARADOR}%an${FIN}`,
        "--",
        ruta,
      ]);
      return this.leerCommits(String(stdout));
    } catch {
      return [];
    }
  }

  async detalleCommit(sha: string) {
    if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new Error("Commit no válido");
    const { stdout } = await this.git([
      "show",
      "--name-status",
      `--format=%H${SEPARADOR}%s${SEPARADOR}%aI${SEPARADOR}%an${FIN}`,
      sha,
    ]);
    const [cabecera, cuerpo = ""] = String(stdout).split(FIN);
    const [commit] = this.leerCommits(cabecera + FIN);
    const estados: Record<string, string> = { A: "added", M: "modified", D: "removed" };
    const archivos = cuerpo
      .split("\n")
      .map((l) => l.trim().split(/\t/))
      .filter((p) => p.length >= 2)
      .map(([estado, ruta]) => ({ ruta, estado: estados[estado[0]] || "modified" }));
    return { commit, archivos };
  }

  async leerEnVersion(ruta: string, sha: string) {
    if (!/^[0-9a-f]{7,40}$/.test(sha)) return null;
    try {
      const { stdout } = await this.git(["show", `${sha}:${ruta}`], true);
      return new Uint8Array(stdout as unknown as Buffer);
    } catch {
      return null;
    }
  }

  async estadoDespliegue() {
    return {
      estado: "desconocido" as const,
      detalle: "En local no hay despliegue: los cambios ya están en los archivos del proyecto.",
    };
  }

  async comprobar() {
    return {
      ok: true,
      detalle: "Modo local: al publicar se escriben los archivos del proyecto.",
    };
  }
}
