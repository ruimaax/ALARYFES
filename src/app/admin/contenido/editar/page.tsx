"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { seccionPorId } from "@/cms/secciones";
import { api, ErrorPanel, mensajeDe } from "../../_lib/api";
import { haceTiempo } from "../../_lib/formato";
import {
  Cabecera,
  Cargando,
  ErrorCarga,
  Giro,
  useAtajoGuardar,
  useAvisoSalida,
  useTitulo,
} from "../../_componentes/comunes";
import { FormularioEsquema } from "../../_componentes/formulario";
import { Icono } from "../../_componentes/icono";
import { useAviso } from "../../_componentes/avisos";
import { useConfirmar } from "../../_componentes/dialogo";
import { useMarco } from "../../_componentes/marco";

export default function Pagina() {
  return (
    <Suspense fallback={<Cargando />}>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const id = useSearchParams().get("s") || "";
  const seccion = seccionPorId(id);
  useTitulo(seccion?.titulo || "Contenido");
  const router = useRouter();
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const [valor, setValor] = useState<unknown>(null);
  const [original, setOriginal] = useState("");
  const [borrador, setBorrador] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    setValor(null);
    try {
      const r = await api<{ datos: unknown; borrador: string | null }>(`contenido/${id}`);
      setValor(r.datos);
      setOriginal(JSON.stringify(r.datos));
      setBorrador(r.borrador);
      setErrores({});
    } catch (e) {
      setError(mensajeDe(e));
    }
  }, [id]);
  useEffect(() => {
    if (seccion) cargar();
  }, [seccion, cargar]);

  const sucio = valor !== null && JSON.stringify(valor) !== original;
  useAvisoSalida(sucio);

  const guardar = async (despues?: "publicar") => {
    if (guardando || valor === null) return;
    setGuardando(true);
    try {
      const r = await api<{ estado: string; datos: unknown }>(`contenido/${id}`, {
        metodo: "PUT",
        cuerpo: { datos: valor },
      });
      setValor(r.datos);
      setOriginal(JSON.stringify(r.datos));
      setErrores({});
      setBorrador(r.estado === "guardado" ? new Date().toISOString() : null);
      refrescar();
      if (despues === "publicar") return router.push("/admin/publicar");
      avisar(
        r.estado === "sin-cambios" ? (
          "Queda igual que lo publicado: no hay nada que publicar."
        ) : (
          <>
            Borrador guardado. <Link href="/admin/publicar">Publicar ahora</Link>
          </>
        ),
      );
    } catch (e) {
      if (e instanceof ErrorPanel && e.datos.errores) {
        setErrores(e.datos.errores as Record<string, string>);
        // Se espera a que se abran los grupos con errores para llevar el foco.
        setTimeout(() => {
          const campo = document.querySelector<HTMLElement>('.a-esquema [aria-invalid="true"]');
          campo?.scrollIntoView({ behavior: "smooth", block: "center" });
          campo?.focus({ preventScroll: true });
        }, 60);
      }
      avisar(mensajeDe(e), "error");
    } finally {
      setGuardando(false);
    }
  };
  useAtajoGuardar(() => guardar());

  const descartar = async () => {
    if (
      !(await confirmar({
        titulo: "¿Descartar el borrador?",
        texto: "Se perderán los cambios guardados de esta sección y volverá a la versión publicada.",
        boton: "Descartar",
        peligro: true,
      }))
    )
      return;
    try {
      await api(`contenido/${id}/borrador`, { metodo: "DELETE" });
      avisar("Borrador descartado.");
      refrescar();
      cargar();
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  if (!seccion)
    return (
      <div className="a-contenedor estrecho">
        <ErrorCarga error="Esa sección no existe." />
        <p className="a-separado">
          <Link href="/admin/contenido" className="a-enlace">
            Volver a Contenido
          </Link>
        </p>
      </div>
    );

  const numErrores = Object.keys(errores).length;
  return (
    <div className="a-contenedor estrecho">
      <Cabecera
        migas={[{ texto: "Contenido", href: "/admin/contenido" }]}
        titulo={seccion.titulo}
        descripcion={seccion.descripcion}
        acciones={
          <a className="a-boton secundario" href={seccion.ver} target="_blank" rel="noopener">
            <Icono nombre="web" /> Ver la versión publicada
          </a>
        }
      />
      {error ? (
        <ErrorCarga error={error} reintentar={cargar} />
      ) : valor === null ? (
        <Cargando />
      ) : (
        <>
          {numErrores > 0 && (
            <div className="a-alerta error" style={{ marginBottom: 16 }} role="alert">
              <Icono nombre="alerta" />
              <div>
                {numErrores === 1 ? "Hay un campo que revisar" : `Hay ${numErrores} campos que revisar`}.
                Están marcados en rojo.
              </div>
            </div>
          )}
          <FormularioEsquema
            esquema={seccion.esquema}
            valor={valor}
            onChange={setValor}
            errores={errores}
          />
          <div className="a-barra-guardar">
            <span className="a-estado-guardado">
              <span className={`a-punto ${!sucio && !borrador ? "ok" : ""}`} />
              {sucio ? (
                "Cambios sin guardar"
              ) : borrador ? (
                <span>
                  Borrador guardado {haceTiempo(borrador)} ·{" "}
                  <Link href="/admin/publicar" className="a-enlace">
                    publicar
                  </Link>
                </span>
              ) : (
                "Igual que la web publicada"
              )}
            </span>
            <div className="a-acciones">
              {sucio && (
                <button
                  type="button"
                  className="a-boton secundario"
                  onClick={() => {
                    setValor(JSON.parse(original));
                    setErrores({});
                  }}
                >
                  Deshacer
                </button>
              )}
              {!sucio && borrador && (
                <button type="button" className="a-boton secundario" onClick={descartar}>
                  Descartar borrador
                </button>
              )}
              {sucio && (
                <button type="button" className="a-boton secundario" onClick={() => guardar("publicar")} disabled={guardando}>
                  Guardar e ir a publicar
                </button>
              )}
              <button type="button" className="a-boton" onClick={() => guardar()} disabled={guardando || !sucio}>
                {guardando && <Giro />}
                Guardar borrador
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
