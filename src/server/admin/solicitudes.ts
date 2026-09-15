import { ahora, anotar, cambios } from "../bd";
import { enviarAHoja } from "../contacto";
import { ErrorApi, json, leerJson, texto } from "../respuestas";
import type { ContactPayload } from "../../lib/contact-validation";
import { ruta, type Contexto } from "./contexto";

export const ESTADOS = ["nueva", "contactada", "propuesta", "cliente", "descartada"] as const;
export type Solicitud = {
  id: string;
  creada: string;
  actualizada: string;
  tipo: "contacto" | "recomendacion";
  estado: (typeof ESTADOS)[number];
  nombre: string;
  negocio: string;
  telefono: string | null;
  sector: string | null;
  plan: string | null;
  mensaje: string | null;
  referido_negocio: string | null;
  referido_contacto: string | null;
  notas: string;
  sheets: "no" | "ok" | "error";
};
const POR_PAGINA = 25;

function filtros(url: URL) {
  const partes: string[] = [];
  const valores: unknown[] = [];
  const estado = url.searchParams.get("estado");
  if (estado && (ESTADOS as readonly string[]).includes(estado)) {
    partes.push("estado = ?");
    valores.push(estado);
  }
  const tipo = url.searchParams.get("tipo");
  if (tipo === "contacto" || tipo === "recomendacion") {
    partes.push("tipo = ?");
    valores.push(tipo);
  }
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (q) {
    const columnas = [
      "nombre",
      "negocio",
      "telefono",
      "sector",
      "mensaje",
      "referido_negocio",
      "referido_contacto",
      "notas",
    ];
    partes.push(`(${columnas.map((col) => `${col} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    valores.push(...columnas.map(() => patron));
  }
  return { where: partes.length ? `WHERE ${partes.join(" AND ")}` : "", valores };
}

async function leerSolicitud(c: Contexto) {
  const fila = await c.db
    .prepare("SELECT * FROM solicitudes WHERE id = ?")
    .bind(c.params[0])
    .first<Solicitud>();
  if (!fila) throw new ErrorApi("Esa solicitud no existe o se ha borrado.", 404);
  return fila;
}

// Excel en español abre bien los CSV separados por punto y coma y con BOM.
const celda = (valor: unknown) => {
  let s = valor == null ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const rutasSolicitudes = [
  ruta("GET", /^solicitudes$/, async (c) => {
    const { where, valores } = filtros(c.url);
    const pagina = Math.max(1, Number(c.url.searchParams.get("pagina")) || 1);
    const total = await c.db
      .prepare(`SELECT count(*) AS n FROM solicitudes ${where}`)
      .bind(...valores)
      .first<{ n: number }>();
    const { results } = await c.db
      .prepare(`SELECT * FROM solicitudes ${where} ORDER BY creada DESC LIMIT ? OFFSET ?`)
      .bind(...valores, POR_PAGINA, (pagina - 1) * POR_PAGINA)
      .all<Solicitud>();
    const { results: porEstado } = await c.db
      .prepare("SELECT estado, count(*) AS n FROM solicitudes GROUP BY estado")
      .all<{ estado: string; n: number }>();
    return json({
      solicitudes: results,
      total: total?.n ?? 0,
      pagina,
      porPagina: POR_PAGINA,
      cuentas: Object.fromEntries(porEstado.map((e) => [e.estado, e.n])),
    });
  }),

  ruta("GET", /^solicitudes\/exportar$/, async (c) => {
    const { where, valores } = filtros(c.url);
    const { results } = await c.db
      .prepare(`SELECT * FROM solicitudes ${where} ORDER BY creada DESC`)
      .bind(...valores)
      .all<Solicitud>();
    const cabecera = [
      "Fecha",
      "Tipo",
      "Estado",
      "Nombre",
      "Negocio",
      "Teléfono",
      "Tipo de empresa",
      "Plan",
      "Mensaje",
      "Negocio recomendado",
      "Contacto recomendado",
      "Notas",
      "ID",
    ];
    const filas = results.map((s) =>
      [
        s.creada,
        s.tipo,
        s.estado,
        s.nombre,
        s.negocio,
        s.telefono,
        s.sector,
        s.plan,
        s.mensaje,
        s.referido_negocio,
        s.referido_contacto,
        s.notas,
        s.id,
      ]
        .map(celda)
        .join(";"),
    );
    await anotar(c.db, "solicitudes.exportadas", `${results.length} filas`, c.ip);
    return new Response(`﻿${[cabecera.map(celda).join(";"), ...filas].join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="solicitudes-${ahora().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }),

  ruta("GET", /^solicitudes\/([\w-]{1,64})$/, async (c) =>
    json({ solicitud: await leerSolicitud(c) }),
  ),

  ruta("PATCH", /^solicitudes\/([\w-]{1,64})$/, async (c) => {
    const actual = await leerSolicitud(c);
    const cuerpo = await leerJson(c.request);
    const estado =
      typeof cuerpo.estado === "string" && (ESTADOS as readonly string[]).includes(cuerpo.estado)
        ? cuerpo.estado
        : actual.estado;
    const notas = typeof cuerpo.notas === "string" ? texto(cuerpo.notas, 5000) : actual.notas;
    await c.db
      .prepare("UPDATE solicitudes SET estado = ?, notas = ?, actualizada = ? WHERE id = ?")
      .bind(estado, notas, ahora(), actual.id)
      .run();
    if (estado !== actual.estado)
      await anotar(c.db, "solicitud.estado", `${actual.id.slice(0, 8)}: ${actual.estado} → ${estado}`, c.ip);
    return json({ ok: true, solicitud: { ...actual, estado, notas } });
  }),

  ruta("DELETE", /^solicitudes\/([\w-]{1,64})$/, async (c) => {
    const resultado = await c.db
      .prepare("DELETE FROM solicitudes WHERE id = ?")
      .bind(c.params[0])
      .run();
    if (!cambios(resultado)) throw new ErrorApi("Esa solicitud ya no existe.", 404);
    // En el registro no se guardan datos personales, solo el identificador.
    await anotar(c.db, "solicitud.borrada", c.params[0].slice(0, 8), c.ip);
    return json({ ok: true });
  }),

  ruta("POST", /^solicitudes\/([\w-]{1,64})\/reenviar$/, async (c) => {
    const { CONTACT_WEBHOOK_URL: webhook, CONTACT_WEBHOOK_TOKEN: webhookToken } =
      c.entorno.secretos;
    if (!webhook) throw new ErrorApi("No hay ninguna hoja conectada (CONTACT_WEBHOOK_URL).", 409);
    const s = await leerSolicitud(c);
    const datos: ContactPayload = {
      tipo: s.tipo,
      nombre: s.nombre,
      negocio: s.negocio,
      consentimiento: true,
      ...(s.tipo === "contacto"
        ? {
            telefono: s.telefono ?? "",
            sector: s.sector ?? "",
            plan: s.plan ?? "",
            mensaje: s.mensaje ?? "",
          }
        : {
            referidoNegocio: s.referido_negocio ?? "",
            referidoContacto: s.referido_contacto ?? "",
          }),
    };
    const ok = await enviarAHoja({ webhook, webhookToken }, s.id, s.creada, datos);
    await c.db
      .prepare("UPDATE solicitudes SET sheets = ? WHERE id = ?")
      .bind(ok ? "ok" : "error", s.id)
      .run();
    if (!ok) throw new ErrorApi("La hoja no ha aceptado la solicitud. Revisa el endpoint.", 502);
    return json({ ok: true });
  }),
];
