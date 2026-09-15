"use client";
import Link from "next/link";
import { api, mensajeDe } from "../_lib/api";
import { fecha } from "../_lib/formato";
import { Cabecera, Cargando, Chip, ErrorCarga, useCarga, useTitulo, Vacio } from "../_componentes/comunes";
import { Icono } from "../_componentes/icono";
import { useAviso } from "../_componentes/avisos";
import { useConfirmar } from "../_componentes/dialogo";
import { useMarco } from "../_componentes/marco";

type Articulo = {
  slug: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  publicado: boolean;
  estado: "borrador" | "programado" | "publicado";
  enLaWeb: boolean;
  sinPublicar: boolean;
};

export default function Blog() {
  useTitulo("Blog");
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const { datos, error, cargando, recargar } = useCarga(() => api<{ articulos: Articulo[] }>("blog"));

  const borrar = async (a: Articulo) => {
    if (
      !(await confirmar({
        titulo: `¿Borrar «${a.titulo}»?`,
        texto: a.enLaWeb
          ? "Desaparecerá de la web al publicar. Su dirección se redirigirá al blog para que nadie llegue a una página rota."
          : "Se borrará el artículo. Puedes recuperarlo desde Historial si ya estaba publicado alguna vez.",
        boton: "Borrar",
        peligro: true,
      }))
    )
      return;
    try {
      await api(`blog/${a.slug}`, { metodo: "DELETE" });
      avisar("Artículo borrado. Publica para que desaparezca de la web.");
      refrescar();
      recargar();
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Blog"
        descripcion="Artículos de /blog. Puedes dejarlos en borrador, programarlos para un día concreto o publicarlos."
        acciones={
          <Link className="a-boton" href="/admin/blog/editar">
            <Icono nombre="mas" /> Nuevo artículo
          </Link>
        }
      />
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : datos!.articulos.length === 0 ? (
        <div className="a-tarjeta">
          <Vacio
            titulo="Aún no hay artículos"
            texto="Escribe sobre las preguntas reales de tus clientes: cómo aparecer en Google, qué publicar en redes, cuánto cuesta una web… Mientras no haya ninguno publicado, el blog muestra un mensaje de «próximamente»."
          >
            <Link className="a-boton" href="/admin/blog/editar">
              <Icono nombre="mas" /> Escribir el primero
            </Link>
          </Vacio>
        </div>
      ) : (
        <div className="a-tabla-envoltorio">
          <table className="a-tabla adaptable">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos!.articulos.map((a) => (
                <tr key={a.slug}>
                  <td>
                    <Link href={`/admin/blog/editar?slug=${a.slug}`} className="fuerte" style={{ textDecoration: "none" }}>
                      {a.titulo}
                    </Link>
                    <div className="flojo">/blog/{a.slug}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {a.estado === "borrador" ? (
                        <Chip>Borrador</Chip>
                      ) : a.estado === "programado" ? (
                        <Chip tono="info">Programado</Chip>
                      ) : (
                        <Chip tono="ok">Publicado</Chip>
                      )}
                      {a.sinPublicar && <Chip tono="aviso">Cambios sin publicar</Chip>}
                    </div>
                  </td>
                  <td className="flojo">{fecha(a.fecha)}</td>
                  <td className="derecha">
                    <div className="a-acciones" style={{ justifyContent: "inherit" }}>
                      {a.enLaWeb && (
                        <a className="a-boton fantasma pequeno" href={`/blog/${a.slug}`} target="_blank" rel="noopener">
                          <Icono nombre="web" /> Ver
                        </a>
                      )}
                      <Link className="a-boton secundario pequeno" href={`/admin/blog/editar?slug=${a.slug}`}>
                        Editar
                      </Link>
                      <button type="button" className="a-boton peligro pequeno icono" onClick={() => borrar(a)} aria-label={`Borrar ${a.titulo}`}>
                        <Icono nombre="borrar" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
