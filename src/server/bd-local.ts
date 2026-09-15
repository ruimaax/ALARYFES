// Solo para `npm run dev`: imita D1 con el SQLite que trae Node.
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { BaseDatos, Sentencia } from "./tipos";

type SentenciaLocal = Sentencia & { ejecutar(): void };

export function abrirBaseLocal(archivo: string): BaseDatos {
  mkdirSync(path.dirname(archivo), { recursive: true });
  const db = new DatabaseSync(archivo);
  const crear = (sql: string, valores: SQLInputValue[] = []): SentenciaLocal => ({
    bind: (...nuevos: unknown[]) =>
      crear(
        sql,
        nuevos.map((v) =>
          v === undefined ? null : typeof v === "boolean" ? Number(v) : (v as SQLInputValue),
        ),
      ),
    first: async <T,>() => (db.prepare(sql).get(...valores) as T | undefined) ?? null,
    all: async <T,>() => ({ results: db.prepare(sql).all(...valores) as T[] }),
    run: async () => ({
      meta: { changes: Number(db.prepare(sql).run(...valores).changes) },
    }),
    ejecutar: () => {
      db.prepare(sql).run(...valores);
    },
  });
  return {
    prepare: (sql) => crear(sql),
    batch: async (sentencias) => {
      db.exec("BEGIN");
      try {
        for (const s of sentencias) (s as SentenciaLocal).ejecutar();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
