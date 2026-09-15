"use client";

import { useMemo, useState } from "react";
import { api, mensajeDe } from "../_lib/api";
import { tamano, urlVista } from "../_lib/formato";
import { useAviso } from "../_componentes/avisos";
import { Cabecera, Cargando, Chip, ErrorCarga, useCarga, useTitulo, Vacio } from "../_componentes/comunes";
import { useConfirmar } from "../_componentes/dialogo";
import { Icono } from "../_componentes/icono";
import { type Archivo, VistaMedio, ZonaSubida } from "../_componentes/medios";
import { useMarco } from "../_componentes/marco";

type EstadoMedio = "publicado" | "nuevo" | "reemplazado" | "borrar";
type Medio = Archivo & { estado: EstadoMedio; fecha: string };
type Filtro = "todos" | "imagenes" | "pdf";

const etiquetaEstado: Record<EstadoMedio, { texto: string; tono: string }> = {
  publicado: { texto: "Publicado", tono: "ok" },
  nuevo: { texto: "Nuevo", tono: "marca" },
  reemplazado: { texto: "Reemplazado", tono: "aviso" },
  borrar: { texto: "Pendiente de borrar", tono: "error" },
};

export default function Medios() {
  useTitulo("Medios");
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [buscar, setBuscar] = useState("");
  const { datos, error, cargando, recargar } = useCarga(() => api<{ archivos: Medio[] }>("medios"));

  const archivos = useMemo(() => {
    const texto = buscar.trim().toLowerCase();
    return (datos?.archivos || []).filter(
      (a) =>
        (!texto || a.nombre.toLowerCase().includes(texto)) &&
        (filtro === "todos" ||
          (filtro === "imagenes" && a.tipo.startsWith("image/")) ||
          (filtro === "pdf" && a.tipo === "application/pdf")),
    );
  }, [buscar, datos, filtro]);

  const copiar = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      avisar("URL copiada.");
    } catch {
      avisar(`Copia esta URL: ${url}`, "info");
    }
  };

  const borrar = async (archivo: Medio) => {
    if (archivo.estado === "borrar") {
      try {
        await api(`publicacion?ruta=${encodeURIComponent(archivo.ruta)}`, { metodo: "DELETE" });
        avisar("Archivo restaurado.");
        refrescar();
        recargar();
      } catch (e) {
        avisar(mensajeDe(e), "error");
      }
      return;
    }
    let usos: string[] = [];
    try {
      usos = (
        await api<{ usos: string[] }>(`medios/uso?ruta=${encodeURIComponent(archivo.ruta)}`)
      ).usos;
    } catch (e) {
      avisar(mensajeDe(e), "error");
      return;
    }
    const descartar = archivo.estado === "nuevo";
    const aceptado = await confirmar({
      titulo: descartar ? `¿Descartar «${archivo.nombre}»?` : `¿Borrar «${archivo.nombre}»?`,
      texto: (
        <div className="a-texto">
          <p>
            {descartar
              ? "El archivo nuevo no llegará a publicarse."
              : "Quedará pendiente de borrar hasta que publiques los cambios."}
          </p>
          {usos.length > 0 && (
            <>
              <p><strong>Se usa en:</strong></p>
              <ul>{usos.map((uso) => <li key={uso}>{uso}</li>)}</ul>
              <p>Quita o cambia esas referencias para no dejar imágenes rotas.</p>
            </>
          )}
        </div>
      ),
      boton: descartar ? "Descartar" : "Borrar",
      peligro: true,
    });
    if (!aceptado) return;
    try {
      await api(`medios?ruta=${encodeURIComponent(archivo.ruta)}`, { metodo: "DELETE" });
      avisar(descartar ? "Archivo descartado." : "Archivo pendiente de borrar.");
      refrescar();
      recargar();
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Medios"
        descripcion="Imágenes y PDF disponibles para el contenido y el blog. Los cambios llegan a la web al publicar."
      />
      <ZonaSubida
        onSubidos={() => {
          refrescar();
          recargar();
        }}
      />
      <div className="a-filtros a-separado">
        <div className="a-pestanas" aria-label="Tipo de archivo">
          {([['todos', 'Todos'], ['imagenes', 'Imágenes'], ['pdf', 'PDF']] as const).map(([valor, texto]) => (
            <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
              {texto}
            </button>
          ))}
        </div>
        <input
          className="a-entrada a-buscar"
          type="search"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar medios por nombre"
        />
      </div>
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : archivos.length === 0 ? (
        <div className="a-tarjeta"><Vacio titulo="No hay archivos que mostrar" texto="Prueba con otro filtro o sube un archivo." /></div>
      ) : (
        <div className="a-medios">
          {archivos.map((a) => {
            const estado = etiquetaEstado[a.estado];
            return (
              <article key={a.ruta} className={`a-medio ${a.estado === "borrar" ? "borrar" : ""}`}>
                <VistaMedio archivo={a} />
                <div className="a-medio-info">
                  <strong className="a-medio-nombre" title={a.nombre}>{a.nombre}</strong>
                  <span>{tamano(a.tamano)}</span>
                  <span><Chip tono={estado.tono}>{estado.texto}</Chip></span>
                </div>
                <div className="a-medio-acciones">
                  <button type="button" className="a-boton fantasma pequeno icono" onClick={() => copiar(a.url)} aria-label={`Copiar URL de ${a.nombre}`} title="Copiar URL">
                    <Icono nombre="copiar" />
                  </button>
                  <a className="a-boton fantasma pequeno icono" href={urlVista(a.url)} target="_blank" rel="noopener" aria-label={`Abrir ${a.nombre}`} title="Abrir">
                    <Icono nombre="ojo" />
                  </a>
                  <button
                    type="button"
                    className={`a-boton pequeno ${a.estado === "borrar" ? "secundario" : "peligro"}`}
                    onClick={() => borrar(a)}
                  >
                    <Icono nombre={a.estado === "borrar" ? "restaurar" : "borrar"} />
                    {a.estado === "borrar" ? "Restaurar" : a.estado === "nuevo" ? "Descartar" : "Borrar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
