"use client";

import { useState } from "react";
import Link from "next/link";
import { api, mensajeDe } from "../_lib/api";
import { fechaHora } from "../_lib/formato";
import { useAviso } from "../_componentes/avisos";
import { Cabecera, Cargando, Chip, ErrorCarga, useCarga, useTitulo, Vacio } from "../_componentes/comunes";
import { Dialogo, useConfirmar } from "../_componentes/dialogo";
import { Icono } from "../_componentes/icono";
import { useMarco } from "../_componentes/marco";

type Commit = { sha: string; mensaje: string; fecha: string; autor: string; url?: string };
type Archivo = { ruta: string; estado: string; restaurable: boolean; titulo: string; enlace: string };
type Detalle = { commit: Commit; archivos: Archivo[] };
type Version = { titulo: string; ruta: string; cargando: boolean; error?: string; binario?: boolean; texto?: string | null };

const estadoArchivo: Record<string, string> = {
  added: "Añadido",
  modified: "Modificado",
  removed: "Borrado",
  renamed: "Renombrado",
  changed: "Cambiado",
};

export default function Historial() {
  useTitulo("Historial");
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const [ruta, setRuta] = useState("src/content");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [detalles, setDetalles] = useState<Record<string, Detalle>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<string | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const { datos, error, cargando, recargar } = useCarga(
    () => api<{ commits: Commit[] }>(`historial?ruta=${encodeURIComponent(ruta)}`),
    [ruta],
  );

  const desplegar = async (sha: string) => {
    if (abierto === sha) return setAbierto(null);
    setAbierto(sha);
    if (detalles[sha]) return;
    setCargandoDetalle(sha);
    try {
      const detalle = await api<Detalle>(`historial/commit?sha=${encodeURIComponent(sha)}`);
      setDetalles((d) => ({ ...d, [sha]: detalle }));
    } catch (e) {
      avisar(mensajeDe(e), "error");
      setAbierto(null);
    } finally {
      setCargandoDetalle(null);
    }
  };

  const ver = async (archivo: Archivo, sha: string) => {
    setVersion({ titulo: archivo.titulo, ruta: archivo.ruta, cargando: true });
    try {
      const r = await api<{ binario: boolean; texto?: string | null }>(
        `historial/version?ruta=${encodeURIComponent(archivo.ruta)}&sha=${encodeURIComponent(sha)}`,
      );
      setVersion({ titulo: archivo.titulo, ruta: archivo.ruta, cargando: false, ...r });
    } catch (e) {
      setVersion({ titulo: archivo.titulo, ruta: archivo.ruta, cargando: false, error: mensajeDe(e) });
    }
  };

  const restaurar = async (archivo: Archivo, sha: string) => {
    const ok = await confirmar({
      titulo: `¿Restaurar «${archivo.titulo}»?`,
      texto: "La versión elegida se guardará como borrador. La web no cambiará hasta que la publiques.",
      boton: "Restaurar esta versión",
    });
    if (!ok) return;
    try {
      await api("historial/restaurar", { metodo: "POST", cuerpo: { ruta: archivo.ruta, sha } });
      refrescar();
      avisar(<><span>Versión restaurada como borrador. </span><Link href="/admin/publicar">Ir a Publicar</Link></>);
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Historial"
        descripcion="Consulta versiones anteriores del contenido y recupera un archivo como borrador."
      />
      <div className="a-filtros">
        <div className="a-pestanas" aria-label="Tipo de historial">
          <button type="button" aria-pressed={ruta === "src/content"} onClick={() => { setRuta("src/content"); setAbierto(null); }}>Contenido</button>
          <button type="button" aria-pressed={ruta === "public/media"} onClick={() => { setRuta("public/media"); setAbierto(null); }}>Medios</button>
        </div>
      </div>
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : !datos?.commits.length ? (
        <div className="a-tarjeta"><Vacio titulo="No hay versiones anteriores" texto="El historial aparecerá cuando haya commits que afecten a esta sección." /></div>
      ) : (
        <div className="a-apilado">
          {datos.commits.map((commit) => {
            const detalle = detalles[commit.sha];
            const estaAbierto = abierto === commit.sha;
            return (
              <section className="a-tarjeta" key={commit.sha}>
                <div className="a-tarjeta-cabecera" style={{ marginBottom: estaAbierto ? 14 : 0 }}>
                  <div>
                    <h2 style={{ fontSize: "1.08rem" }}>{commit.mensaje}</h2>
                    <p className="a-suave a-pequeno">{fechaHora(commit.fecha)} · {commit.autor} · {commit.sha.slice(0, 7)}</p>
                  </div>
                  <div className="a-acciones">
                    {commit.url && <a className="a-boton fantasma pequeno" href={commit.url} target="_blank" rel="noopener"><Icono nombre="web" /> GitHub</a>}
                    <button type="button" className="a-boton secundario pequeno" onClick={() => desplegar(commit.sha)} aria-expanded={estaAbierto}>
                      {estaAbierto ? "Ocultar" : "Ver archivos"}
                    </button>
                  </div>
                </div>
                {estaAbierto && (cargandoDetalle === commit.sha ? <Cargando /> : detalle ? (
                  <ul className="a-filas">
                    {detalle.archivos.map((archivo) => (
                      <li key={archivo.ruta}>
                        <div className="texto">
                          {archivo.enlace ? <Link href={archivo.enlace}>{archivo.titulo}</Link> : <strong>{archivo.titulo}</strong>}
                          <span>{archivo.ruta}</span>
                        </div>
                        <Chip>{estadoArchivo[archivo.estado] || archivo.estado}</Chip>
                        <div className="a-acciones">
                          {archivo.estado !== "removed" && <button type="button" className="a-boton secundario pequeno" onClick={() => ver(archivo, commit.sha)}><Icono nombre="ojo" /> Ver</button>}
                          {archivo.restaurable && <button type="button" className="a-boton pequeno" onClick={() => restaurar(archivo, commit.sha)}><Icono nombre="restaurar" /> Restaurar esta versión</button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null)}
              </section>
            );
          })}
        </div>
      )}
      <Dialogo abierto={!!version} onCerrar={() => setVersion(null)} titulo={version?.titulo || "Versión"} variante="ancho">
        {version?.cargando ? <Cargando /> : version?.error ? <ErrorCarga error={version.error} /> : version?.binario ? (
          <p className="a-suave">Esta versión es un archivo binario y no se puede mostrar como texto.</p>
        ) : (
          <pre className="a-diff" style={{ padding: 14, whiteSpace: "pre-wrap" }}>{version?.texto ?? "El archivo no existía en esta versión."}</pre>
        )}
      </Dialogo>
    </div>
  );
}
