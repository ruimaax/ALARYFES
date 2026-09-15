"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ErrorPanel, mensajeDe } from "../../_lib/api";
import { hoyMadrid, slugDe } from "../../_lib/formato";
import { useAviso } from "../../_componentes/avisos";
import {
  Cabecera,
  Cargando,
  ErrorCarga,
  Giro,
  useAtajoGuardar,
  useAvisoSalida,
  useTitulo,
} from "../../_componentes/comunes";
import { useConfirmar } from "../../_componentes/dialogo";
import { EditorMarkdown } from "../../_componentes/editor-markdown";
import { CampoImagen } from "../../_componentes/medios";
import { useMarco } from "../../_componentes/marco";

type Articulo = {
  titulo: string;
  slug: string;
  descripcion: string;
  fecha: string;
  actualizado?: string;
  publicado: boolean;
  imagen?: string;
  imagenAlt?: string;
};

const nuevo = (): Articulo => ({
  titulo: "",
  slug: "",
  descripcion: "",
  fecha: hoyMadrid(),
  actualizado: "",
  publicado: false,
  imagen: "",
  imagenAlt: "",
});

export default function Pagina() {
  return (
    <Suspense fallback={<Cargando />}>
      <EditorArticulo />
    </Suspense>
  );
}

function EditorArticulo() {
  const slugConsulta = useSearchParams().get("slug") || "";
  const esNuevo = !slugConsulta;
  useTitulo(esNuevo ? "Nuevo artículo" : "Editar artículo");
  const router = useRouter();
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const [articulo, setArticulo] = useState<Articulo | null>(esNuevo ? nuevo() : null);
  const [cuerpo, setCuerpo] = useState("");
  const [original, setOriginal] = useState("");
  const [slugOriginal, setSlugOriginal] = useState(slugConsulta);
  const [enLaWeb, setEnLaWeb] = useState(false);
  const [slugTocado, setSlugTocado] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const instantanea = useCallback(
    (a: Articulo, texto: string) => JSON.stringify({ articulo: a, cuerpo: texto }),
    [],
  );
  const cargar = useCallback(async () => {
    setError(null);
    setErrores({});
    setSlugTocado(false);
    if (!slugConsulta) {
      const a = nuevo();
      setArticulo(a);
      setCuerpo("");
      setOriginal(instantanea(a, ""));
      setSlugOriginal("");
      setEnLaWeb(false);
      return;
    }
    setArticulo(null);
    try {
      const r = await api<{ articulo: Articulo; cuerpo: string; enLaWeb: boolean }>(
        `blog/${encodeURIComponent(slugConsulta)}`,
      );
      setArticulo(r.articulo);
      setCuerpo(r.cuerpo);
      setOriginal(instantanea(r.articulo, r.cuerpo));
      setSlugOriginal(r.articulo.slug);
      setEnLaWeb(r.enLaWeb);
    } catch (e) {
      setError(mensajeDe(e));
    }
  }, [instantanea, slugConsulta]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const sucio = !!articulo && instantanea(articulo, cuerpo) !== original;
  useAvisoSalida(sucio);
  const cambiar = <K extends keyof Articulo>(clave: K, valor: Articulo[K]) =>
    setArticulo((a) => (a ? { ...a, [clave]: valor } : a));

  const guardar = async (irAPublicar = false) => {
    if (!articulo || guardando) return;
    const slug = articulo.slug.trim();
    if (!slug) {
      setErrores((e) => ({ ...e, slug: "Escribe una dirección para el artículo." }));
      avisar("Revisa los campos marcados.", "error");
      return;
    }
    setGuardando(true);
    try {
      const r = await api<{ ok: true; articulo: Articulo }>(`blog/${encodeURIComponent(slug)}`, {
        metodo: "PUT",
        cuerpo: { articulo, cuerpo, original: slugOriginal },
      });
      const textoGuardado = cuerpo.trim() ? `${cuerpo.trim()}\n` : "\n";
      setArticulo(r.articulo);
      setCuerpo(textoGuardado);
      setOriginal(instantanea(r.articulo, textoGuardado));
      setSlugOriginal(r.articulo.slug);
      setErrores({});
      refrescar();
      if (esNuevo || slugConsulta !== r.articulo.slug)
        router.replace(`/admin/blog/editar?slug=${encodeURIComponent(r.articulo.slug)}`);
      if (irAPublicar) router.push("/admin/publicar");
      else
        avisar(
          <>
            Borrador guardado. <Link href="/admin/publicar">Publicar ahora</Link>
          </>,
        );
    } catch (e) {
      if (e instanceof ErrorPanel && e.datos.errores)
        setErrores(e.datos.errores as Record<string, string>);
      avisar(mensajeDe(e), "error");
    } finally {
      setGuardando(false);
    }
  };
  useAtajoGuardar(() => guardar());

  const borrar = async () => {
    if (!articulo || !slugOriginal) return;
    if (
      !(await confirmar({
        titulo: `¿Borrar «${articulo.titulo}»?`,
        texto: enLaWeb
          ? "Al publicar desaparecerá de la web y su dirección redirigirá al blog."
          : "Se eliminará este borrador.",
        boton: "Borrar artículo",
        peligro: true,
      }))
    )
      return;
    try {
      await api(`blog/${encodeURIComponent(slugOriginal)}`, { metodo: "DELETE" });
      refrescar();
      avisar("Artículo borrado. Publica para aplicar el cambio.");
      router.push("/admin/blog");
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  const estado = useMemo(() => {
    if (!articulo?.publicado) return "Borrador";
    return articulo.fecha > hoyMadrid() ? "Programado" : "Se publicará al pulsar «Publicar»";
  }, [articulo]);

  return (
    <div className="a-contenedor estrecho">
      <Cabecera
        migas={[{ texto: "Blog", href: "/admin/blog" }]}
        titulo={esNuevo ? "Nuevo artículo" : articulo?.titulo || "Editar artículo"}
        descripcion="Escribe en Markdown y comprueba el resultado en la vista previa."
        acciones={
          enLaWeb && articulo ? (
            <a className="a-boton secundario" href={`/blog/${slugOriginal}`} target="_blank" rel="noopener">
              Ver la versión publicada
            </a>
          ) : undefined
        }
      />
      {error ? (
        <ErrorCarga error={error} reintentar={cargar} />
      ) : !articulo ? (
        <Cargando />
      ) : (
        <>
          {enLaWeb && articulo.slug !== slugOriginal && (
            <div className="a-alerta aviso" style={{ marginBottom: 16 }}>
              Al publicar se creará una redirección 301 desde <code>/blog/{slugOriginal}</code> a la
              nueva dirección.
            </div>
          )}
          <div className="a-apilado">
            <section className="a-tarjeta a-form">
              <div className="a-campo">
                <label htmlFor="art-titulo">Título</label>
                <input
                  id="art-titulo"
                  className="a-entrada"
                  value={articulo.titulo}
                  maxLength={120}
                  aria-invalid={!!errores.titulo || undefined}
                  onChange={(e) => {
                    const titulo = e.target.value;
                    setArticulo((a) =>
                      a ? { ...a, titulo, slug: esNuevo && !slugTocado ? slugDe(titulo) : a.slug } : a,
                    );
                  }}
                />
                {errores.titulo && <span className="a-error-campo">{errores.titulo}</span>}
              </div>
              <div className="a-campo">
                <label htmlFor="art-slug">Dirección</label>
                <div className="a-sufijo">
                  <span>/blog/</span>
                  <input
                    id="art-slug"
                    className="a-entrada"
                    value={articulo.slug}
                    maxLength={80}
                    aria-invalid={!!errores.slug || undefined}
                    onChange={(e) => {
                      setSlugTocado(true);
                      cambiar("slug", slugDe(e.target.value));
                    }}
                  />
                </div>
                {errores.slug && <span className="a-error-campo">{errores.slug}</span>}
              </div>
              <div className="a-campo">
                <div className="a-etiqueta-fila">
                  <label htmlFor="art-descripcion">Descripción</label>
                  <span className={`a-contador ${articulo.descripcion.length > 160 ? "pasado" : ""}`}>
                    {articulo.descripcion.length}/160 recomendado
                  </span>
                </div>
                <textarea
                  id="art-descripcion"
                  className="a-entrada"
                  value={articulo.descripcion}
                  maxLength={220}
                  aria-invalid={!!errores.descripcion || undefined}
                  onChange={(e) => cambiar("descripcion", e.target.value)}
                />
                <span className="a-ayuda">Lo ideal para Google son entre 120 y 160 caracteres.</span>
                {errores.descripcion && <span className="a-error-campo">{errores.descripcion}</span>}
                <div className="a-snippet" aria-label="Vista previa del resultado en Google">
                  <div className="url">alaryfes.com › blog › {articulo.slug || "direccion"}</div>
                  <div className="titulo">{articulo.titulo || "Título del artículo"} | ALARYFES</div>
                  <div className="desc">{articulo.descripcion || "La descripción aparecerá aquí."}</div>
                </div>
              </div>
              <div className="a-dos-campos">
                <div className="a-campo">
                  <label htmlFor="art-fecha">Fecha de publicación</label>
                  <input
                    id="art-fecha"
                    type="date"
                    className="a-entrada"
                    value={articulo.fecha}
                    aria-invalid={!!errores.fecha || undefined}
                    onChange={(e) => cambiar("fecha", e.target.value)}
                  />
                  {errores.fecha && <span className="a-error-campo">{errores.fecha}</span>}
                </div>
                <div className="a-campo">
                  <label htmlFor="art-actualizado">Última actualización (opcional)</label>
                  <input
                    id="art-actualizado"
                    type="date"
                    className="a-entrada"
                    value={articulo.actualizado || ""}
                    aria-invalid={!!errores.actualizado || undefined}
                    onChange={(e) => cambiar("actualizado", e.target.value)}
                  />
                  {errores.actualizado && <span className="a-error-campo">{errores.actualizado}</span>}
                </div>
              </div>
              <label className="a-interruptor">
                <input
                  type="checkbox"
                  checked={articulo.publicado}
                  onChange={(e) => cambiar("publicado", e.target.checked)}
                />
                Publicado
              </label>
              <p className="a-ayuda">Estado: {estado}.</p>
              <div className="a-campo">
                <span className="a-etiqueta">Imagen de portada</span>
                <CampoImagen
                  id="art-imagen"
                  valor={articulo.imagen || ""}
                  onChange={(valor) => cambiar("imagen", valor)}
                  invalido={!!errores.imagen}
                />
                {errores.imagen && <span className="a-error-campo">{errores.imagen}</span>}
              </div>
              <div className="a-campo">
                <label htmlFor="art-alt">Texto alternativo de la portada</label>
                <input
                  id="art-alt"
                  className="a-entrada"
                  value={articulo.imagenAlt || ""}
                  maxLength={200}
                  aria-invalid={!!errores.imagenAlt || undefined}
                  onChange={(e) => cambiar("imagenAlt", e.target.value)}
                />
                <span className="a-ayuda">Describe lo que aporta la imagen para quien no pueda verla.</span>
                {errores.imagenAlt && <span className="a-error-campo">{errores.imagenAlt}</span>}
              </div>
            </section>
            <section>
              <h2 style={{ marginBottom: 10 }}>Texto del artículo</h2>
              <EditorMarkdown id="art-cuerpo" valor={cuerpo} onChange={setCuerpo} />
            </section>
          </div>
          <div className="a-barra-guardar">
            <span className="a-estado-guardado">
              <span className={`a-punto ${!sucio ? "ok" : ""}`} />
              {sucio ? "Cambios sin guardar" : slugOriginal ? "Borrador guardado" : "Artículo nuevo sin guardar"}
            </span>
            <div className="a-acciones">
              {slugOriginal && (
                <button type="button" className="a-boton peligro" onClick={borrar} disabled={guardando}>
                  Borrar
                </button>
              )}
              <button
                type="button"
                className="a-boton secundario"
                onClick={() => guardar(true)}
                disabled={guardando || !sucio}
              >
                Guardar e ir a publicar
              </button>
              <button type="button" className="a-boton" onClick={() => guardar()} disabled={guardando || !sucio}>
                {guardando && <Giro />} Guardar borrador
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
