"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../_lib/api";
import { Cabecera, Cargando, ErrorCarga, useCarga, useTitulo, Vacio } from "../_componentes/comunes";
import { Icono } from "../_componentes/icono";

type Clasificacion = { nombre: string; vistas: number; visitas: number };
type PuntoWeb = { fecha: string; visitas: number; vistas: number };
type Analitica = {
  periodo: { dias: number; desde: string; hasta: string };
  configuracion: {
    web: boolean;
    infraestructura: boolean;
    faltanWeb: string[];
    faltanInfra: string[];
    worker: string | null;
  };
  web: null | {
    resumen: {
      visitas: number;
      vistas: number;
      paginasPorVisita: number;
      cambioVisitas: number | null;
      cambioVistas: number | null;
    };
    serie: PuntoWeb[];
    paginas: Clasificacion[];
    paises: Clasificacion[];
    dispositivos: Clasificacion[];
    navegadores: Clasificacion[];
    origenes: Clasificacion[];
  };
  vitales: null | {
    muestras: number;
    lcpMs: number | null;
    inpMs: number | null;
    cls: number | null;
    fcpMs: number | null;
    ttfbMs: number | null;
  };
  infraestructura: null | {
    dias: number;
    alcance: string;
    invocaciones: number;
    errores: number;
    tasaError: number;
    subsolicitudes: number;
    cpuP50Ms: number;
    cpuP99Ms: number;
    duracionP50Ms: number;
    duracionP99Ms: number;
    serie: { fecha: string; invocaciones: number; errores: number }[];
    ramDisponible: false;
  };
  negocio: { solicitudes: number; conversion: number };
  errores: { web: string | null; vitales: string | null; infraestructura: string | null };
};

const PERIODOS = [
  { dias: 7, texto: "7 días" },
  { dias: 30, texto: "30 días" },
  { dias: 90, texto: "3 meses" },
  { dias: 180, texto: "6 meses" },
];

const entero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const fechaCorta = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

function cambio(valor: number | null) {
  if (valor === null) return "Sin periodo anterior comparable";
  const signo = valor > 0 ? "+" : "";
  return `${signo}${decimal.format(valor)} % frente al periodo anterior`;
}

function nombrePais(valor: string) {
  if (!/^[A-Z]{2}$/i.test(valor)) return valor;
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(valor.toUpperCase()) || valor;
  } catch {
    return valor;
  }
}

function nombreDispositivo(valor: string) {
  const nombres: Record<string, string> = {
    desktop: "Ordenador",
    mobile: "Móvil",
    tablet: "Tableta",
  };
  return nombres[valor.toLowerCase()] || valor;
}

function completarSerie(serie: PuntoWeb[], dias: number) {
  const porFecha = new Map(serie.map((p) => [p.fecha, p]));
  return Array.from({ length: dias }, (_, indice) => {
    const fecha = new Date();
    fecha.setUTCHours(0, 0, 0, 0);
    fecha.setUTCDate(fecha.getUTCDate() - (dias - 1 - indice));
    const clave = fecha.toISOString().slice(0, 10);
    return porFecha.get(clave) || { fecha: clave, visitas: 0, vistas: 0 };
  });
}

function agruparMeses(serie: PuntoWeb[]) {
  const meses = new Map<string, PuntoWeb>();
  for (const punto of serie) {
    const clave = punto.fecha.slice(0, 7);
    const actual = meses.get(clave) || { fecha: `${clave}-01`, visitas: 0, vistas: 0 };
    actual.visitas += punto.visitas;
    actual.vistas += punto.vistas;
    meses.set(clave, actual);
  }
  return [...meses.values()];
}

function Grafica({ serie, campo, etiqueta, mensual }: { serie: PuntoWeb[]; campo: "visitas" | "vistas"; etiqueta: string; mensual: boolean }) {
  const ancho = 760;
  const alto = 220;
  const margen = 18;
  const maximo = Math.max(1, ...serie.map((p) => p[campo]));
  const puntos = serie.map((p, i) => {
    const x = margen + (i / Math.max(1, serie.length - 1)) * (ancho - margen * 2);
    const y = alto - margen - (p[campo] / maximo) * (alto - margen * 2);
    return { ...p, x, y };
  });
  const linea = puntos.map((p) => `${p.x},${p.y}`).join(" ");
  const area = puntos.length
    ? `${margen},${alto - margen} ${linea} ${ancho - margen},${alto - margen}`
    : "";
  return (
    <div className="a-grafica">
      <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`${etiqueta} por día`}>
        <line x1={margen} y1={alto - margen} x2={ancho - margen} y2={alto - margen} className="eje" />
        <line x1={margen} y1={alto / 2} x2={ancho - margen} y2={alto / 2} className="guia" />
        <polygon points={area} className="area" />
        <polyline points={linea} className="linea" />
        {puntos.map((p) => (
          <circle key={p.fecha} cx={p.x} cy={p.y} r="3.5" className="punto">
            <title>{`${mensual ? new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(`${p.fecha}T12:00:00Z`)) : fechaCorta.format(new Date(`${p.fecha}T12:00:00Z`))}: ${entero.format(p[campo])} ${etiqueta.toLowerCase()}`}</title>
          </circle>
        ))}
      </svg>
      {serie.length > 1 && (
        <div className="a-grafica-eje" aria-hidden="true">
          <span>{fechaCorta.format(new Date(`${serie[0].fecha}T12:00:00Z`))}</span>
          <strong>Máx. {entero.format(maximo)}</strong>
          <span>{fechaCorta.format(new Date(`${serie.at(-1)!.fecha}T12:00:00Z`))}</span>
        </div>
      )}
    </div>
  );
}

function ListaBarras({
  filas,
  transformar = (v) => v,
}: {
  filas: Clasificacion[];
  transformar?: (valor: string) => string;
}) {
  const maximo = Math.max(1, ...filas.map((f) => f.vistas));
  if (!filas.length) return <p className="a-suave">No hay datos en este periodo.</p>;
  return (
    <ol className="a-barras">
      {filas.map((fila) => (
        <li key={fila.nombre}>
          <div className="a-barra-texto">
            <span title={fila.nombre}>{transformar(fila.nombre)}</span>
            <strong>{entero.format(fila.vistas)}</strong>
          </div>
          <span className="a-barra-pista" aria-hidden="true">
            <span style={{ width: `${Math.max(2, (fila.vistas / maximo) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function SemaforoVital({
  nombre,
  valor,
  unidad,
  bueno,
  necesitaMejora,
  ayuda,
}: {
  nombre: string;
  valor: number | null;
  unidad: string;
  bueno: number;
  necesitaMejora: number;
  ayuda: string;
}) {
  const tono = valor === null ? "sin-datos" : valor <= bueno ? "bueno" : valor <= necesitaMejora ? "mejorable" : "malo";
  const estado = tono === "bueno" ? "Bueno" : tono === "mejorable" ? "Mejorable" : tono === "malo" ? "Malo" : "Sin datos";
  return (
    <div className={`a-vital ${tono}`} title={ayuda}>
      <div><strong>{nombre}</strong><span>{estado}</span></div>
      <p>{valor === null ? "—" : `${decimal.format(valor)}${unidad}`}</p>
    </div>
  );
}

function SinConfigurar({ variables, tipo }: { variables: string[]; tipo: string }) {
  return (
    <Vacio
      titulo={`${tipo} sin conectar`}
      texto={
        <>
          Añade {variables.map((v, i) => <span key={v}>{i ? ", " : ""}<code>{v}</code></span>)} en Cloudflare y vuelve a desplegar.
        </>
      }
    >
      <Link href="/admin/ayuda" className="a-boton secundario">Ver instrucciones</Link>
    </Vacio>
  );
}

export default function PaginaAnalitica() {
  useTitulo("Analítica");
  const [dias, setDias] = useState(30);
  const [metrica, setMetrica] = useState<"visitas" | "vistas">("visitas");
  const { datos, error, cargando, recargar } = useCarga(
    () => api<Analitica>(`analitica?dias=${dias}`),
    [dias],
  );
  const serie = useMemo(
    () => {
      const diaria = completarSerie(datos?.web?.serie || [], datos?.periodo.dias || dias);
      return dias > 30 ? agruparMeses(diaria) : diaria;
    },
    [datos, dias],
  );

  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Analítica"
        descripcion="Tráfico, audiencia, rendimiento real y consumo de las funciones de la web."
        acciones={
          <button type="button" className="a-boton secundario" onClick={recargar} disabled={cargando}>
            <Icono nombre="recargar" /> Actualizar
          </button>
        }
      />
      <div className="a-filtros">
        <div className="a-pestanas" aria-label="Periodo de analítica">
          {PERIODOS.map((periodo) => (
            <button
              type="button"
              key={periodo.dias}
              aria-pressed={dias === periodo.dias}
              onClick={() => setDias(periodo.dias)}
            >
              {periodo.texto}
            </button>
          ))}
        </div>
        {datos && <p className="a-suave a-pequeno">Datos agregados y privados de Cloudflare · UTC</p>}
      </div>

      {cargando && !datos ? <Cargando texto="Consultando Cloudflare…" /> : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : datos ? (
        <div className="a-apilado">
          <section aria-labelledby="trafico">
            <div className="a-seccion-titulo">
              <div><h2 id="trafico">Audiencia y tráfico</h2><p>Cloudflare Web Analytics, sin cookies ni identificación personal.</p></div>
            </div>
            {!datos.configuracion.web ? <div className="a-tarjeta"><SinConfigurar variables={datos.configuracion.faltanWeb} tipo="Analítica web" /></div> : datos.errores.web ? (
              <ErrorCarga error={datos.errores.web} reintentar={recargar} />
            ) : datos.web ? (
              <>
                <div className="a-rejilla a-metricas">
                  <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.web.resumen.visitas)}</p><p className="a-cifra-etiqueta">Visitas</p><span className="a-tendencia">{cambio(datos.web.resumen.cambioVisitas)}</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.web.resumen.vistas)}</p><p className="a-cifra-etiqueta">Páginas vistas</p><span className="a-tendencia">{cambio(datos.web.resumen.cambioVistas)}</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{decimal.format(datos.web.resumen.paginasPorVisita)}</p><p className="a-cifra-etiqueta">Páginas por visita</p><span className="a-tendencia">Media del periodo</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{decimal.format(datos.web.resumen.visitas / datos.periodo.dias)}</p><p className="a-cifra-etiqueta">Visitas al día</p><span className="a-tendencia">Media diaria</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.negocio.solicitudes)}</p><p className="a-cifra-etiqueta">Solicitudes recibidas</p><span className="a-tendencia">{decimal.format(datos.negocio.conversion)} % de conversión</span></article>
                </div>
                <section className="a-tarjeta a-separado">
                  <div className="a-tarjeta-cabecera">
                    <div><h2>Evolución {dias > 30 ? "mensual" : "diaria"}</h2><p className="a-suave a-pequeno">Pasa el cursor o toca un punto para ver el dato exacto.</p></div>
                    <div className="a-pestanas">
                      <button type="button" aria-pressed={metrica === "visitas"} onClick={() => setMetrica("visitas")}>Visitas</button>
                      <button type="button" aria-pressed={metrica === "vistas"} onClick={() => setMetrica("vistas")}>Páginas vistas</button>
                    </div>
                  </div>
                  <Grafica serie={serie} campo={metrica} etiqueta={metrica === "visitas" ? "Visitas" : "Páginas vistas"} mensual={dias > 30} />
                </section>
                <div className="a-dos a-separado">
                  <section className="a-tarjeta"><h2>Páginas más vistas</h2><ListaBarras filas={datos.web.paginas} /></section>
                  <section className="a-tarjeta"><h2>Origen de las visitas</h2><ListaBarras filas={datos.web.origenes} /></section>
                </div>
                <div className="a-rejilla a-separado">
                  <section className="a-tarjeta"><h2>Países</h2><ListaBarras filas={datos.web.paises} transformar={nombrePais} /></section>
                  <section className="a-tarjeta"><h2>Dispositivos</h2><ListaBarras filas={datos.web.dispositivos} transformar={nombreDispositivo} /></section>
                  <section className="a-tarjeta"><h2>Navegadores</h2><ListaBarras filas={datos.web.navegadores} /></section>
                </div>
              </>
            ) : null}
          </section>

          <section aria-labelledby="rendimiento" className="a-separado">
            <div className="a-seccion-titulo">
              <div><h2 id="rendimiento">Experiencia y velocidad</h2><p>Percentil 75 de visitas reales; el 75 % tuvo ese resultado o uno mejor.</p></div>
            </div>
            {!datos.configuracion.web ? <div className="a-tarjeta"><SinConfigurar variables={datos.configuracion.faltanWeb} tipo="Métricas de rendimiento" /></div> : datos.errores.vitales ? (
              <ErrorCarga error={datos.errores.vitales} reintentar={recargar} />
            ) : datos.vitales ? (
              <div className="a-rejilla a-vitales">
                <SemaforoVital nombre="LCP" valor={datos.vitales.lcpMs} unidad=" ms" bueno={2500} necesitaMejora={4000} ayuda="Tiempo hasta que aparece el contenido principal." />
                <SemaforoVital nombre="INP" valor={datos.vitales.inpMs} unidad=" ms" bueno={200} necesitaMejora={500} ayuda="Rapidez con la que responde la página al interactuar." />
                <SemaforoVital nombre="CLS" valor={datos.vitales.cls} unidad="" bueno={0.1} necesitaMejora={0.25} ayuda="Estabilidad visual mientras carga la página." />
                <SemaforoVital nombre="FCP" valor={datos.vitales.fcpMs} unidad=" ms" bueno={1800} necesitaMejora={3000} ayuda="Tiempo hasta que aparece el primer contenido." />
                <SemaforoVital nombre="TTFB" valor={datos.vitales.ttfbMs} unidad=" ms" bueno={800} necesitaMejora={1800} ayuda="Tiempo hasta el primer byte de respuesta." />
                <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.vitales.muestras)}</p><p className="a-cifra-etiqueta">Muestras de rendimiento</p></article>
              </div>
            ) : <div className="a-tarjeta"><Vacio titulo="Todavía no hay muestras" texto="Cloudflare empezará a mostrarlas cuando Web Analytics reciba tráfico real." /></div>}
          </section>

          <section aria-labelledby="infraestructura" className="a-separado">
            <div className="a-seccion-titulo">
              <div><h2 id="infraestructura">Funciones e infraestructura</h2><p>Consumo de las rutas dinámicas del CMS y los formularios.</p></div>
            </div>
            {!datos.configuracion.infraestructura ? <div className="a-tarjeta"><SinConfigurar variables={datos.configuracion.faltanInfra} tipo="Métricas de Functions" /></div> : datos.errores.infraestructura ? (
              <ErrorCarga error={datos.errores.infraestructura} reintentar={recargar} />
            ) : datos.infraestructura ? (
              <>
                {dias > datos.infraestructura.dias && <div className="a-alerta"><Icono nombre="info" /><div>Cloudflare limita las métricas de Workers a ventanas de un mes. Esta sección muestra los últimos {datos.infraestructura.dias} días.</div></div>}
                {!datos.configuracion.worker && <div className="a-alerta aviso"><Icono nombre="alerta" /><div>Falta <code>CLOUDFLARE_WORKER_NAME</code>: estas cifras suman todos los Workers de la cuenta, no solo esta web.</div></div>}
                <div className="a-rejilla a-metricas">
                  <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.infraestructura.invocaciones)}</p><p className="a-cifra-etiqueta">Invocaciones</p></article>
                  <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.infraestructura.errores)}</p><p className="a-cifra-etiqueta">Errores de ejecución</p><span className="a-tendencia">{decimal.format(datos.infraestructura.tasaError)} % del total</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{decimal.format(datos.infraestructura.cpuP50Ms)} ms</p><p className="a-cifra-etiqueta">CPU habitual (p50)</p><span className="a-tendencia">p99: {decimal.format(datos.infraestructura.cpuP99Ms)} ms</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{decimal.format(datos.infraestructura.duracionP50Ms)} ms</p><p className="a-cifra-etiqueta">Duración habitual (p50)</p><span className="a-tendencia">p99: {decimal.format(datos.infraestructura.duracionP99Ms)} ms</span></article>
                  <article className="a-tarjeta"><p className="a-cifra">{entero.format(datos.infraestructura.subsolicitudes)}</p><p className="a-cifra-etiqueta">Subsolicitudes a otros servicios</p></article>
                  <article className="a-tarjeta a-ram"><p className="a-cifra">Gestionada</p><p className="a-cifra-etiqueta">Memoria RAM</p><span className="a-tendencia">Cloudflare no expone consumo de RAM por Function</span></article>
                </div>
                <p className="a-suave a-pequeno a-separado">Alcance: {datos.infraestructura.alcance}. Las peticiones a archivos estáticos no ejecutan Functions y no consumen CPU.</p>
              </>
            ) : null}
          </section>

          <div className="a-alerta a-separado"><Icono nombre="info" /><div><strong>Cómo leer «visitas».</strong> Cloudflare agrupa sesiones sin identificar personas ni usar cookies. Por privacidad, no equivale a usuarios únicos persistentes.</div></div>
        </div>
      ) : null}
    </div>
  );
}
