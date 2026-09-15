"use client";
import Link from "next/link";
import { api } from "./_lib/api";
import { ESTADOS_SOLICITUD, fechaHora, haceTiempo } from "./_lib/formato";
import { Cabecera, Cargando, Chip, ErrorCarga, useCarga, useTitulo } from "./_componentes/comunes";
import { Icono, type NombreIcono } from "./_componentes/icono";
import { EstadoPublicacion } from "./_componentes/despliegue";
import { useMarco } from "./_componentes/marco";

type Panel = {
  solicitudes: {
    porEstado: Record<string, number>;
    semana: number;
    ultimas: {
      id: string;
      creada: string;
      tipo: string;
      estado: string;
      nombre: string;
      negocio: string;
      referido_negocio: string | null;
    }[];
  };
  borradores: number;
  ultimaPublicacion: { sha: string; fecha: string; mensaje: string; archivos: number; url?: string } | null;
  avisos: { nivel: "error" | "aviso" | "info"; texto: string; enlace?: string }[];
};

const accesos: { href: string; texto: string; icono: NombreIcono }[] = [
  { href: "/admin/contenido/editar?s=planes", texto: "Cambiar precios y planes", icono: "contenido" },
  { href: "/admin/blog/editar", texto: "Escribir un artículo", icono: "blog" },
  { href: "/admin/medios", texto: "Subir imágenes", icono: "medios" },
  { href: "/admin/contenido/editar?s=faq", texto: "Preguntas frecuentes", icono: "ayuda" },
  { href: "/admin/contenido/editar?s=ajustes", texto: "Datos de la empresa y SEO", icono: "escudo" },
];

export default function Inicio() {
  useTitulo("Panel");
  const { email } = useMarco();
  const { datos, error, cargando, recargar } = useCarga(() => api<Panel>("panel"));
  const hora = new Date().getHours();
  const saludo = hora < 7 || hora >= 21 ? "Buenas noches" : hora < 14 ? "Buenos días" : "Buenas tardes";

  return (
    <div className="a-contenedor">
      <Cabecera
        titulo={saludo}
        descripcion={`Resumen de la web y de lo que tienes pendiente${email ? ` · ${email}` : ""}.`}
        acciones={
          <a className="a-boton secundario" href="/" target="_blank" rel="noopener">
            <Icono nombre="web" /> Ver la web
          </a>
        }
      />
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : datos ? (
        <>
          {datos.avisos.length > 0 && (
            <div className="a-alertas">
              {datos.avisos.map((a) => (
                <div key={a.texto} className={`a-alerta ${a.nivel === "info" ? "" : a.nivel}`}>
                  <Icono nombre={a.nivel === "info" ? "info" : "alerta"} />
                  <div>
                    {a.texto}{" "}
                    {a.enlace && (
                      <Link href={a.enlace} className="a-enlace">
                        Revisar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="a-rejilla" style={{ marginBottom: 16 }}>
            <Link href="/admin/solicitudes?estado=nueva" className="a-tarjeta enlace">
              <p className="a-cifra">{datos.solicitudes.porEstado.nueva ?? 0}</p>
              <p className="a-cifra-etiqueta">Solicitudes nuevas sin atender</p>
            </Link>
            <Link href="/admin/solicitudes" className="a-tarjeta enlace">
              <p className="a-cifra">{datos.solicitudes.semana}</p>
              <p className="a-cifra-etiqueta">Solicitudes en los últimos 7 días</p>
            </Link>
            <Link href="/admin/solicitudes?estado=cliente" className="a-tarjeta enlace">
              <p className="a-cifra">{datos.solicitudes.porEstado.cliente ?? 0}</p>
              <p className="a-cifra-etiqueta">Convertidas en clientes</p>
            </Link>
            <Link href="/admin/publicar" className="a-tarjeta enlace">
              <p className="a-cifra" style={{ color: datos.borradores ? "var(--a-marca)" : undefined }}>
                {datos.borradores}
              </p>
              <p className="a-cifra-etiqueta">Cambios guardados sin publicar</p>
            </Link>
          </div>
          <div className="a-dos">
            <section className="a-tarjeta">
              <div className="a-tarjeta-cabecera">
                <h2>Últimas solicitudes</h2>
                <Link href="/admin/solicitudes" className="a-enlace a-pequeno">
                  Ver todas
                </Link>
              </div>
              {datos.solicitudes.ultimas.length === 0 ? (
                <p className="a-suave">
                  Aún no ha llegado ninguna. Cuando alguien rellene un formulario de la web, aparecerá
                  aquí.
                </p>
              ) : (
                <ul className="a-filas">
                  {datos.solicitudes.ultimas.map((s) => (
                    <li key={s.id}>
                      <div className="texto">
                        <Link href={`/admin/solicitudes?id=${s.id}`}>
                          {s.tipo === "recomendacion" ? s.referido_negocio : s.negocio}
                        </Link>
                        <span>
                          {s.tipo === "recomendacion" ? `Recomendado por ${s.nombre}` : s.nombre} ·{" "}
                          {haceTiempo(s.creada)}
                        </span>
                      </div>
                      <Chip tono={ESTADOS_SOLICITUD[s.estado]?.tono}>
                        {ESTADOS_SOLICITUD[s.estado]?.etiqueta ?? s.estado}
                      </Chip>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="a-apilado">
              <section className="a-tarjeta">
                <h2>Accesos rápidos</h2>
                <nav className="a-nav" style={{ margin: "0 -10px" }}>
                  {accesos.map((a) => (
                    <Link key={a.href} href={a.href} style={{ color: "var(--a-tinta)" }}>
                      <Icono nombre={a.icono} />
                      {a.texto}
                    </Link>
                  ))}
                </nav>
              </section>
              <section className="a-tarjeta">
                <h2>Última publicación</h2>
                {datos.ultimaPublicacion ? (
                  <div className="a-apilado" style={{ gap: 8 }}>
                    <p>
                      <strong>{datos.ultimaPublicacion.mensaje}</strong>
                    </p>
                    <p className="a-pequeno a-suave">
                      {fechaHora(datos.ultimaPublicacion.fecha)} · {datos.ultimaPublicacion.archivos}{" "}
                      {datos.ultimaPublicacion.archivos === 1 ? "archivo" : "archivos"}
                    </p>
                    <EstadoPublicacion sha={datos.ultimaPublicacion.sha} vigilar={false} />
                  </div>
                ) : (
                  <p className="a-suave">Todavía no has publicado nada desde el panel.</p>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
