"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ErrorPanel, mensajeDe } from "../_lib/api";
import { fechaHora, plural } from "../_lib/formato";
import { useAviso } from "../_componentes/avisos";
import { Cabecera, Cargando, Chip, ErrorCarga, Giro, useCarga, useTitulo, Vacio } from "../_componentes/comunes";
import { Dialogo, useConfirmar } from "../_componentes/dialogo";
import { Diff } from "../_componentes/diff";
import { EstadoPublicacion } from "../_componentes/despliegue";
import { Icono } from "../_componentes/icono";
import { useMarco } from "../_componentes/marco";

type Cambio = {
  ruta: string;
  accion: "crear" | "modificar" | "borrar";
  actualizado: string;
  tipo: string;
  titulo: string;
  enlace: string;
};
type Publicacion = { sha: string; fecha: string; mensaje: string; archivos: number; url?: string };
type Datos = {
  cambios: Cambio[];
  ultimas: Publicacion[];
  recompilar: boolean;
  repositorio: { tipo: string; descripcion: string } | null;
};
type VistaDiff = { ruta: string; titulo: string; cargando: boolean; error?: string; binario?: boolean; antes?: string | null; despues?: string | null };
type Resultado = { sha: string; url?: string; archivos: number; local: boolean };

const accion = {
  crear: { texto: "Nuevo", tono: "marca" },
  modificar: { texto: "Modificado", tono: "aviso" },
  borrar: { texto: "Borrar", tono: "error" },
};

export default function Publicar() {
  useTitulo("Publicar");
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const { datos, error, cargando, recargar } = useCarga(() => api<Datos>("publicacion"));
  const [mensaje, setMensaje] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [recompilando, setRecompilando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [vista, setVista] = useState<VistaDiff | null>(null);

  const verDiff = async (c: Cambio) => {
    setVista({ ruta: c.ruta, titulo: c.titulo, cargando: true });
    try {
      const r = await api<{ binario: boolean; antes?: string | null; despues?: string | null }>(
        `publicacion/diff?ruta=${encodeURIComponent(c.ruta)}`,
      );
      setVista({ ruta: c.ruta, titulo: c.titulo, cargando: false, ...r });
    } catch (e) {
      setVista({ ruta: c.ruta, titulo: c.titulo, cargando: false, error: mensajeDe(e) });
    }
  };

  const descartar = async (c?: Cambio) => {
    const ok = await confirmar({
      titulo: c ? `¿Descartar «${c.titulo}»?` : "¿Descartar todos los cambios?",
      texto: c
        ? "Se perderá este borrador y volverá a usarse la versión publicada."
        : "Se perderán todos los borradores pendientes. Esta acción no se puede deshacer desde el panel.",
      boton: c ? "Descartar" : "Descartar todo",
      peligro: true,
    });
    if (!ok) return;
    try {
      await api(`publicacion${c ? `?ruta=${encodeURIComponent(c.ruta)}` : ""}`, { metodo: "DELETE" });
      avisar(c ? "Cambio descartado." : "Todos los cambios se han descartado.");
      refrescar();
      recargar();
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  const enviar = async (forzar = false) => {
    setPublicando(true);
    try {
      const r = await api<{ ok: true } & Resultado>("publicacion", {
        metodo: "POST",
        cuerpo: { mensaje: mensaje.trim(), ...(forzar ? { forzar: true } : {}) },
      });
      setResultado(r);
      setMensaje("");
      refrescar();
      recargar();
      avisar(
        r.local
          ? `${plural(r.archivos, "archivo escrito", "archivos escritos")} en el proyecto local.`
          : "Publicación enviada a GitHub. Cloudflare empezará a compilarla.",
      );
    } catch (e) {
      if (e instanceof ErrorPanel && e.estado === 409 && Array.isArray(e.datos.conflictos)) {
        const conflictos = e.datos.conflictos as { ruta: string; titulo: string }[];
        const ok = await confirmar({
          titulo: "Hay cambios más recientes en GitHub",
          texto: (
            <div className="a-texto">
              <p>Publicar forzará tu versión para estos archivos:</p>
              <ul>{conflictos.map((c) => <li key={c.ruta}>{c.titulo}</li>)}</ul>
              <p>Comprueba que no vas a sobrescribir el trabajo de otra persona.</p>
            </div>
          ),
          boton: "Publicar mi versión",
          peligro: true,
        });
        if (ok) {
          setPublicando(false);
          return enviar(true);
        }
      } else avisar(mensajeDe(e), "error");
    } finally {
      setPublicando(false);
    }
  };

  const recompilar = async () => {
    setRecompilando(true);
    try {
      await api("publicacion/recompilar", { metodo: "POST" });
      avisar("Cloudflare ha recibido la orden de recompilar.");
    } catch (e) {
      avisar(mensajeDe(e), "error");
    } finally {
      setRecompilando(false);
    }
  };

  const n = datos?.cambios.length || 0;
  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Publicar"
        descripcion="Revisa los borradores y envía todos los cambios juntos a la web."
        acciones={datos?.recompilar ? (
          <button type="button" className="a-boton secundario" onClick={recompilar} disabled={recompilando}>
            {recompilando ? <Giro /> : <Icono nombre="recargar" />} Recompilar la web
          </button>
        ) : undefined}
      />
      {resultado && (
        <div className="a-alerta ok" style={{ marginBottom: 20 }}>
          <Icono nombre="check" />
          <div>
            <strong>{resultado.local ? "Archivos actualizados en local" : "Publicación enviada"}</strong>
            {!resultado.local && resultado.sha && <EstadoPublicacion sha={resultado.sha} />}
            {resultado.url && <a href={resultado.url} target="_blank" rel="noopener">Ver el commit en GitHub</a>}
          </div>
        </div>
      )}
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : !datos?.repositorio ? (
        <ErrorCarga error="No hay un repositorio configurado. Revisa Ayuda y estado." />
      ) : (
        <div className="a-apilado">
          <section className="a-tarjeta">
            <div className="a-tarjeta-cabecera">
              <div>
                <h2>Cambios pendientes</h2>
                <p className="a-suave a-pequeno">{datos.repositorio.descripcion}</p>
              </div>
              {n > 0 && <button type="button" className="a-boton peligro pequeno" onClick={() => descartar()}>Descartar todo</button>}
            </div>
            {n === 0 ? (
              <Vacio titulo="Todo está publicado" texto="No hay borradores ni archivos pendientes." />
            ) : (
              <ul className="a-filas">
                {datos.cambios.map((c) => (
                  <li key={c.ruta}>
                    <div className="texto">
                      {c.enlace ? <Link href={c.enlace}>{c.titulo}</Link> : <strong>{c.titulo}</strong>}
                      <span>{c.ruta} · {fechaHora(c.actualizado)}</span>
                    </div>
                    <Chip tono={accion[c.accion].tono}>{accion[c.accion].texto}</Chip>
                    <div className="a-acciones">
                      <button type="button" className="a-boton secundario pequeno" onClick={() => verDiff(c)}>
                        <Icono nombre="ojo" /> Ver cambios
                      </button>
                      <button type="button" className="a-boton peligro pequeno" onClick={() => descartar(c)}>Descartar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {n > 0 && (
            <section className="a-tarjeta a-form">
              <div className="a-campo">
                <label htmlFor="mensaje-publicacion">Mensaje de la publicación (opcional)</label>
                <input
                  id="mensaje-publicacion"
                  className="a-entrada"
                  value={mensaje}
                  maxLength={200}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Ej.: Actualiza los precios y la página de inicio"
                />
                <span className="a-ayuda">Si lo dejas vacío, el panel describirá los cambios automáticamente.</span>
              </div>
              <div className="a-acciones">
                <button type="button" className="a-boton" onClick={() => enviar()} disabled={publicando}>
                  {publicando ? <Giro /> : <Icono nombre="publicar" />} Publicar {n} {n === 1 ? "cambio" : "cambios"}
                </button>
              </div>
            </section>
          )}
          <section className="a-tarjeta">
            <h2>Últimas publicaciones</h2>
            <p className="a-suave a-pequeno" style={{ marginBottom: 12 }}>
              Cada publicación crea un commit. Cloudflare lo detecta y recompila la web normalmente en 1–3 minutos; la versión anterior sigue visible mientras tanto.
            </p>
            {datos.ultimas.length === 0 ? (
              <p className="a-suave">Todavía no hay publicaciones hechas desde el panel.</p>
            ) : (
              <ul className="a-filas">
                {datos.ultimas.map((p) => (
                  <li key={p.sha}>
                    <div className="texto">
                      {p.url ? <a href={p.url} target="_blank" rel="noopener">{p.mensaje}</a> : <strong>{p.mensaje}</strong>}
                      <span>{fechaHora(p.fecha)} · {plural(p.archivos, "archivo", "archivos")} · {p.sha.slice(0, 7)}</span>
                    </div>
                    <EstadoPublicacion sha={p.sha} vigilar={false} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      <Dialogo abierto={!!vista} onCerrar={() => setVista(null)} titulo={vista?.titulo || "Cambios"} variante="ancho">
        {vista?.cargando ? <Cargando /> : vista?.error ? <ErrorCarga error={vista.error} /> : vista?.binario ? (
          <p className="a-suave">Es un archivo binario. Puedes revisar su vista previa desde Medios.</p>
        ) : vista ? <Diff antes={vista.antes ?? null} despues={vista.despues ?? null} /> : null}
      </Dialogo>
    </div>
  );
}
