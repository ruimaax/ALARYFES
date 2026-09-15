import { json } from "../respuestas";
import { ruta } from "./contexto";

const API = "https://api.cloudflare.com/client/v4/graphql";
const PERIODOS = new Set([7, 30, 90, 180]);

type FilaCarga = {
  count?: number;
  sum?: { visits?: number };
  dimensions?: Record<string, string>;
};
type FilaWorker = {
  sum?: { requests?: number; errors?: number; subrequests?: number };
  quantiles?: {
    cpuTimeP50?: number;
    cpuTimeP99?: number;
    wallTimeP50?: number;
    wallTimeP99?: number;
  };
  dimensions?: Record<string, string>;
};

type RespuestaGraphql<T> = {
  data?: T;
  errors?: { message?: string }[];
};

function iso(diasAtras: number) {
  return new Date(Date.now() - diasAtras * 86_400_000).toISOString();
}

function numero(valor: unknown) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function variacion(actual: number, anterior: number) {
  if (!anterior) return actual ? null : 0;
  return ((actual - anterior) / anterior) * 100;
}

function mensajeCloudflare(errores: { message?: string }[] | undefined) {
  const mensaje = errores?.map((e) => e.message).filter(Boolean).join(" · ") || "Respuesta sin datos.";
  if (/auth|permission|access|authori[sz]ed|token/i.test(mensaje))
    return "El token no puede leer la analítica. Dale el permiso Account Analytics: Read.";
  if (/requestHost|host/i.test(mensaje))
    return "El dominio CLOUDFLARE_SITE_HOST no corresponde a un sitio de Web Analytics.";
  return `Cloudflare no ha podido entregar esta métrica: ${mensaje.slice(0, 300)}`;
}

async function consultar<T>(token: string, query: string, variables: Record<string, unknown>) {
  let respuesta: Response;
  try {
    respuesta = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error("No se ha podido conectar con Cloudflare.");
  }
  if (!respuesta.ok) {
    if (respuesta.status === 401 || respuesta.status === 403)
      throw new Error("El token de Cloudflare no es válido o no tiene Account Analytics: Read.");
    throw new Error(`Cloudflare ha respondido con el estado ${respuesta.status}.`);
  }
  const datos = (await respuesta.json()) as RespuestaGraphql<T>;
  if (datos.errors?.length) throw new Error(mensajeCloudflare(datos.errors));
  if (!datos.data) throw new Error("Cloudflare ha respondido sin datos.");
  return datos.data;
}

const QUERY_WEB = `
query AnaliticaWeb(
  $accountTag: string, $siteHost: string, $inicio: Time, $anterior: Time, $fin: Time
) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      actual: rumPageloadEventsAdaptiveGroups(
        limit: 1
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } }
      previo: rumPageloadEventsAdaptiveGroups(
        limit: 1
        filter: { requestHost: $siteHost, datetime_geq: $anterior, datetime_lt: $inicio }
      ) { count sum { visits } }
      serie: rumPageloadEventsAdaptiveGroups(
        limit: 400
        orderBy: [date_ASC]
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } dimensions { date } }
      paginas: rumPageloadEventsAdaptiveGroups(
        limit: 12
        orderBy: [count_DESC]
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } dimensions { requestPath } }
      paises: rumPageloadEventsAdaptiveGroups(
        limit: 10
        orderBy: [count_DESC]
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } dimensions { countryName } }
      dispositivos: rumPageloadEventsAdaptiveGroups(
        limit: 10
        orderBy: [count_DESC]
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } dimensions { deviceType } }
      navegadores: rumPageloadEventsAdaptiveGroups(
        limit: 10
        orderBy: [count_DESC]
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } dimensions { userAgentBrowser } }
      origenes: rumPageloadEventsAdaptiveGroups(
        limit: 10
        orderBy: [count_DESC]
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) { count sum { visits } dimensions { refererHost } }
    }
  }
}`;

const QUERY_VITALES = `
query VitalesWeb($accountTag: string, $siteHost: string, $inicio: Time, $fin: Time) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      vitales: rumWebVitalsEventsAdaptiveGroups(
        limit: 1
        filter: { requestHost: $siteHost, datetime_geq: $inicio, datetime_lt: $fin }
      ) {
        count
        quantiles {
          largestContentfulPaintP75
          interactionToNextPaintP75
          cumulativeLayoutShiftP75
          firstContentfulPaintP75
          timeToFirstByteP75
        }
      }
    }
  }
}`;

const QUERY_WORKERS = (filtrarWorker: boolean) => `
query Infraestructura($accountTag: string, $inicio: string, $fin: string${filtrarWorker ? ", $scriptName: string" : ""}) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      total: workersInvocationsAdaptive(
        limit: 1
        filter: { datetime_geq: $inicio, datetime_lt: $fin${filtrarWorker ? ", scriptName: $scriptName" : ""} }
      ) {
        sum { requests errors subrequests }
        quantiles { cpuTimeP50 cpuTimeP99 wallTimeP50 wallTimeP99 }
      }
      serie: workersInvocationsAdaptive(
        limit: 1000
        orderBy: [datetimeHour_ASC]
        filter: { datetime_geq: $inicio, datetime_lt: $fin${filtrarWorker ? ", scriptName: $scriptName" : ""} }
      ) {
        sum { requests errors subrequests }
        dimensions { datetimeHour }
      }
    }
  }
}`;

function primerTotal(filas: FilaCarga[] | undefined) {
  const fila = filas?.[0];
  return { vistas: numero(fila?.count), visitas: numero(fila?.sum?.visits) };
}

function clasificacion(filas: FilaCarga[] | undefined, campo: string, vacio: string) {
  return (filas || []).map((fila) => ({
    nombre: fila.dimensions?.[campo] || vacio,
    vistas: numero(fila.count),
    visitas: numero(fila.sum?.visits),
  }));
}

async function obtenerWeb(token: string, cuenta: string, sitio: string, dias: number) {
  type Cuenta = {
    actual: FilaCarga[];
    previo: FilaCarga[];
    serie: FilaCarga[];
    paginas: FilaCarga[];
    paises: FilaCarga[];
    dispositivos: FilaCarga[];
    navegadores: FilaCarga[];
    origenes: FilaCarga[];
  };
  const variables = {
    accountTag: cuenta,
    siteHost: sitio,
    inicio: iso(dias),
    anterior: iso(dias * 2),
    fin: new Date().toISOString(),
  };
  const datos = await consultar<{ viewer: { accounts: Cuenta[] } }>(token, QUERY_WEB, variables);
  const c = datos.viewer.accounts[0];
  if (!c) throw new Error("La cuenta de Cloudflare no existe o el token no puede verla.");
  const actual = primerTotal(c.actual);
  const previo = primerTotal(c.previo);
  return {
    resumen: {
      visitas: actual.visitas,
      vistas: actual.vistas,
      paginasPorVisita: actual.visitas ? actual.vistas / actual.visitas : 0,
      cambioVisitas: variacion(actual.visitas, previo.visitas),
      cambioVistas: variacion(actual.vistas, previo.vistas),
    },
    serie: c.serie.map((fila) => ({
      fecha: fila.dimensions?.date || "",
      visitas: numero(fila.sum?.visits),
      vistas: numero(fila.count),
    })),
    paginas: clasificacion(c.paginas, "requestPath", "/"),
    paises: clasificacion(c.paises, "countryName", "Sin identificar"),
    dispositivos: clasificacion(c.dispositivos, "deviceType", "Sin identificar"),
    navegadores: clasificacion(c.navegadores, "userAgentBrowser", "Sin identificar"),
    origenes: clasificacion(c.origenes, "refererHost", "Acceso directo"),
  };
}

async function obtenerVitales(token: string, cuenta: string, sitio: string, dias: number) {
  type Fila = {
    count?: number;
    quantiles?: Record<string, number>;
  };
  const datos = await consultar<{ viewer: { accounts: { vitales: Fila[] }[] } }>(
    token,
    QUERY_VITALES,
    { accountTag: cuenta, siteHost: sitio, inicio: iso(dias), fin: new Date().toISOString() },
  );
  const fila = datos.viewer.accounts[0]?.vitales?.[0];
  if (!fila) return null;
  const q = fila.quantiles || {};
  // Cloudflare entrega los tiempos RUM en microsegundos; CLS no tiene unidad.
  const ms = (clave: string) => {
    const valor = numero(q[clave]);
    return valor < 0 ? null : valor / 1000;
  };
  const cls = numero(q.cumulativeLayoutShiftP75);
  return {
    muestras: numero(fila.count),
    lcpMs: ms("largestContentfulPaintP75"),
    inpMs: ms("interactionToNextPaintP75"),
    cls: cls < 0 ? null : cls,
    fcpMs: ms("firstContentfulPaintP75"),
    ttfbMs: ms("timeToFirstByteP75"),
  };
}

async function obtenerInfraestructura(
  token: string,
  cuenta: string,
  worker: string | undefined,
  diasSolicitados: number,
) {
  const dias = Math.min(30, diasSolicitados);
  const variables: Record<string, string> = {
    accountTag: cuenta,
    inicio: iso(dias),
    fin: new Date().toISOString(),
  };
  if (worker) variables.scriptName = worker;
  const datos = await consultar<{
    viewer: { accounts: { total: FilaWorker[]; serie: FilaWorker[] }[] };
  }>(token, QUERY_WORKERS(!!worker), variables);
  const c = datos.viewer.accounts[0];
  if (!c) throw new Error("La cuenta de Cloudflare no existe o el token no puede verla.");
  const total = c.total?.[0];
  const solicitudes = numero(total?.sum?.requests);
  const errores = numero(total?.sum?.errors);
  const porDia = new Map<string, { fecha: string; invocaciones: number; errores: number }>();
  for (const fila of c.serie || []) {
    const fecha = (fila.dimensions?.datetimeHour || "").slice(0, 10);
    if (!fecha) continue;
    const actual = porDia.get(fecha) || { fecha, invocaciones: 0, errores: 0 };
    actual.invocaciones += numero(fila.sum?.requests);
    actual.errores += numero(fila.sum?.errors);
    porDia.set(fecha, actual);
  }
  return {
    dias,
    alcance: worker || "Todos los Workers de la cuenta",
    invocaciones: solicitudes,
    errores,
    tasaError: solicitudes ? (errores / solicitudes) * 100 : 0,
    subsolicitudes: numero(total?.sum?.subrequests),
    cpuP50Ms: numero(total?.quantiles?.cpuTimeP50) / 1000,
    cpuP99Ms: numero(total?.quantiles?.cpuTimeP99) / 1000,
    duracionP50Ms: numero(total?.quantiles?.wallTimeP50) / 1000,
    duracionP99Ms: numero(total?.quantiles?.wallTimeP99) / 1000,
    serie: [...porDia.values()],
    ramDisponible: false,
  };
}

export const rutasAnalitica = [
  ruta("GET", /^analitica$/, async (c) => {
    const diasPedido = Number(c.url.searchParams.get("dias"));
    const dias = PERIODOS.has(diasPedido) ? diasPedido : 30;
    const {
      CLOUDFLARE_API_TOKEN: token,
      CLOUDFLARE_ACCOUNT_ID: cuenta,
      CLOUDFLARE_SITE_HOST: sitio,
      CLOUDFLARE_WORKER_NAME: worker,
    } = c.entorno.secretos;
    const faltanWeb = [
      !token && "CLOUDFLARE_API_TOKEN",
      !cuenta && "CLOUDFLARE_ACCOUNT_ID",
      !sitio && "CLOUDFLARE_SITE_HOST",
    ].filter(Boolean) as string[];
    const faltanInfra = [!token && "CLOUDFLARE_API_TOKEN", !cuenta && "CLOUDFLARE_ACCOUNT_ID"].filter(
      Boolean,
    ) as string[];
    const [web, vitales, infraestructura, solicitudes] = await Promise.allSettled([
      faltanWeb.length ? Promise.resolve(null) : obtenerWeb(token!, cuenta!, sitio!, dias),
      faltanWeb.length ? Promise.resolve(null) : obtenerVitales(token!, cuenta!, sitio!, dias),
      faltanInfra.length
        ? Promise.resolve(null)
        : obtenerInfraestructura(token!, cuenta!, worker || undefined, dias),
      c.db
        .prepare("SELECT count(*) AS n FROM solicitudes WHERE creada >= ?")
        .bind(iso(dias))
        .first<{ n: number }>(),
    ]);
    const valor = <T>(resultado: PromiseSettledResult<T>) =>
      resultado.status === "fulfilled" ? resultado.value : null;
    const error = (resultado: PromiseSettledResult<unknown>) =>
      resultado.status === "rejected"
        ? resultado.reason instanceof Error
          ? resultado.reason.message
          : "No se ha podido cargar esta métrica."
        : null;
    const webValor = valor(web);
    const solicitudesValor = valor(solicitudes);
    const visitas = webValor?.resumen.visitas || 0;
    const totalSolicitudes = solicitudesValor?.n ?? 0;
    return json({
      periodo: { dias, desde: iso(dias), hasta: new Date().toISOString() },
      configuracion: {
        web: faltanWeb.length === 0,
        infraestructura: faltanInfra.length === 0,
        faltanWeb,
        faltanInfra,
        worker: worker || null,
      },
      web: webValor,
      vitales: valor(vitales),
      infraestructura: valor(infraestructura),
      negocio: {
        solicitudes: totalSolicitudes,
        conversion: visitas ? (totalSolicitudes / visitas) * 100 : 0,
      },
      errores: { web: error(web), vitales: error(vitales), infraestructura: error(infraestructura) },
    });
  }),
];
