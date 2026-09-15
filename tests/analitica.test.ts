import test from "node:test";
import assert from "node:assert/strict";
import { rutasAnalitica } from "../src/server/admin/analitica";
import type { BaseDatos, Entorno } from "../src/server/tipos";
import type { Contexto } from "../src/server/admin/contexto";

const db = {
  prepare() {
    return {
      bind() { return this; },
      async first() { return { n: 3 }; },
      async all() { return { results: [] }; },
      async run() { return {}; },
    };
  },
  async batch() { return []; },
} as BaseDatos;

function contexto(secretos: Entorno["secretos"], dias = 30): Contexto {
  const request = new Request(`http://localhost/api/admin/analitica?dias=${dias}`);
  return {
    request,
    entorno: { db, repo: null, secretos, modo: "local" },
    db,
    url: new URL(request.url),
    ip: "test",
    params: [],
    sesion: { id: "test" },
  };
}

test("analítica explica qué variables faltan sin consultar servicios externos", async () => {
  const original = global.fetch;
  global.fetch = async () => { throw new Error("No debería consultar Cloudflare"); };
  try {
    const respuesta = await rutasAnalitica[0].manejar(contexto({}));
    const datos = await respuesta.json();
    assert.equal(datos.configuracion.web, false);
    assert.deepEqual(datos.configuracion.faltanWeb, [
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_SITE_HOST",
    ]);
    assert.equal(datos.negocio.solicitudes, 3);
  } finally {
    global.fetch = original;
  }
});

test("analítica agrega tráfico, conversión, vitales y consumo de Workers", async () => {
  const original = global.fetch;
  global.fetch = async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    if (query.includes("AnaliticaWeb"))
      return Response.json({ data: { viewer: { accounts: [{
        actual: [{ count: 40, sum: { visits: 20 } }],
        previo: [{ count: 20, sum: { visits: 10 } }],
        serie: [{ count: 40, sum: { visits: 20 }, dimensions: { date: "2026-09-10" } }],
        paginas: [{ count: 30, sum: { visits: 15 }, dimensions: { requestPath: "/" } }],
        paises: [], dispositivos: [], navegadores: [], origenes: [],
      }] } } });
    if (query.includes("VitalesWeb"))
      return Response.json({ data: { viewer: { accounts: [{ vitales: [{
        count: 12,
        quantiles: {
          largestContentfulPaintP75: 1_200_000,
          interactionToNextPaintP75: 90_000,
          cumulativeLayoutShiftP75: 0.04,
          firstContentfulPaintP75: 700_000,
          timeToFirstByteP75: 200_000,
        },
      }] }] } } });
    return Response.json({ data: { viewer: { accounts: [{
      total: [{
        sum: { requests: 100, errors: 2, subrequests: 25 },
        quantiles: { cpuTimeP50: 2_000, cpuTimeP99: 8_000, wallTimeP50: 10_000, wallTimeP99: 30_000 },
      }],
      serie: [{ sum: { requests: 100, errors: 2 }, dimensions: { datetimeHour: "2026-09-10T10:00:00Z" } }],
    }] } } });
  };
  try {
    const respuesta = await rutasAnalitica[0].manejar(contexto({
      CLOUDFLARE_API_TOKEN: "test",
      CLOUDFLARE_ACCOUNT_ID: "cuenta",
      CLOUDFLARE_SITE_HOST: "alaryfes.com",
      CLOUDFLARE_WORKER_NAME: "worker",
    }));
    const datos = await respuesta.json();
    assert.equal(datos.web.resumen.visitas, 20);
    assert.equal(datos.web.resumen.cambioVisitas, 100);
    assert.equal(datos.negocio.conversion, 15);
    assert.equal(datos.vitales.lcpMs, 1200);
    assert.equal(datos.infraestructura.cpuP50Ms, 2);
    assert.equal(datos.infraestructura.tasaError, 2);
  } finally {
    global.fetch = original;
  }
});
