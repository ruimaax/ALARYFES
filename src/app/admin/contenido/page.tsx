"use client";
import Link from "next/link";
import { api } from "../_lib/api";
import { haceTiempo } from "../_lib/formato";
import { Cabecera, Cargando, Chip, ErrorCarga, useCarga, useTitulo } from "../_componentes/comunes";
import { Icono } from "../_componentes/icono";

type Seccion = {
  id: string;
  titulo: string;
  descripcion: string;
  grupo: string;
  ver: string;
  borrador: string | null;
};

export default function Contenido() {
  useTitulo("Contenido");
  const { datos, error, cargando, recargar } = useCarga(() => api<{ secciones: Seccion[] }>("contenido"));
  const grupos = [...new Set((datos?.secciones || []).map((s) => s.grupo))];
  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Contenido"
        descripcion="Todos los textos, precios y datos de la web. Los cambios se guardan como borrador y llegan a la web cuando pulsas «Publicar»."
        acciones={
          <>
            <Link className="a-boton secundario" href="/admin/blog">
              <Icono nombre="blog" /> Blog
            </Link>
            <Link className="a-boton secundario" href="/admin/medios">
              <Icono nombre="medios" /> Medios
            </Link>
          </>
        }
      />
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : (
        grupos.map((grupo) => (
          <section key={grupo} style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>{grupo}</h2>
            <div className="a-rejilla">
              {datos!.secciones
                .filter((s) => s.grupo === grupo)
                .map((s) => (
                  <Link key={s.id} href={`/admin/contenido/editar?s=${s.id}`} className="a-tarjeta enlace">
                    <div className="a-tarjeta-cabecera" style={{ marginBottom: 6 }}>
                      <h3>{s.titulo}</h3>
                      {s.borrador && <Chip tono="aviso">Sin publicar</Chip>}
                    </div>
                    <p className="a-suave a-pequeno">{s.descripcion}</p>
                    {s.borrador && (
                      <p className="a-pequeno a-suave" style={{ marginTop: 8 }}>
                        Borrador guardado {haceTiempo(s.borrador)}
                      </p>
                    )}
                  </Link>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
