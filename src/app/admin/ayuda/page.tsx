"use client";

import { useState } from "react";
import Link from "next/link";
import { api, mensajeDe } from "../_lib/api";
import { useAviso } from "../_componentes/avisos";
import { Cabecera, Cargando, Chip, ErrorCarga, Giro, useCarga, useTitulo } from "../_componentes/comunes";
import { Icono } from "../_componentes/icono";

type Comprobacion = {
  id: string;
  titulo: string;
  estado: "ok" | "aviso" | "error" | "info";
  detalle: string;
  prueba?: "hoja" | "aviso";
};
type Sistema = { comprobaciones: Comprobacion[]; modo: string };

const etiqueta = { ok: "Correcto", aviso: "Revisar", error: "Error", info: "Opcional" };

export default function Ayuda() {
  useTitulo("Ayuda y estado");
  const avisar = useAviso();
  const { datos, error, cargando, recargar } = useCarga(() => api<Sistema>("sistema"));
  const [probando, setProbando] = useState<string | null>(null);
  const probar = async (tipo: "hoja" | "aviso") => {
    setProbando(tipo);
    try {
      const r = await api<{ ok: true; mensaje: string }>(`sistema/probar-${tipo}`, { metodo: "POST" });
      avisar(r.mensaje);
    } catch (e) {
      avisar(mensajeDe(e), "error");
    } finally {
      setProbando(null);
    }
  };
  return (
    <div className="a-contenedor">
      <Cabecera titulo="Ayuda y estado" descripcion="Comprobaciones de la instalación y guía rápida para gestionar la web." />
      <section className="a-tarjeta">
        <div className="a-tarjeta-cabecera"><div><h2>Estado del sistema</h2>{datos && <p className="a-suave a-pequeno">Modo {datos.modo === "local" ? "local" : "Cloudflare"}</p>}</div><button type="button" className="a-boton secundario pequeno" onClick={recargar}><Icono nombre="recargar" /> Comprobar de nuevo</button></div>
        {cargando && !datos ? <Cargando /> : error ? <ErrorCarga error={error} reintentar={recargar} /> : (
          <ul className="a-filas">
            {datos?.comprobaciones.map((c) => (
              <li key={c.id}>
                <div className="texto"><strong>{c.titulo}</strong><span>{c.detalle}</span></div>
                <Chip tono={c.estado}>{etiqueta[c.estado]}</Chip>
                {c.prueba && <button type="button" className="a-boton secundario pequeno" onClick={() => probar(c.prueba!)} disabled={probando === c.prueba}>{probando === c.prueba ? <Giro /> : <Icono nombre="check" />} Probar</button>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="a-dos a-separado">
        <section className="a-tarjeta a-texto">
          <h2>Cómo publicar un cambio</h2>
          <ol className="a-pasos" style={{ marginTop: 16 }}>
            <li><div><strong>Edita y guarda.</strong><p className="a-suave">Los cambios quedan como borrador privado en la base de datos.</p></div></li>
            <li><div><strong>Abre Publicar.</strong><p className="a-suave">Revisa la lista y las diferencias antes de continuar.</p></div></li>
            <li><div><strong>Pulsa «Publicar».</strong><p className="a-suave">Se crea un único commit en GitHub con todos los cambios.</p></div></li>
            <li><div><strong>Espera 1–3 minutos.</strong><p className="a-suave">Cloudflare compila la nueva web. La anterior sigue visible hasta que termine.</p></div></li>
          </ol>
        </section>
        <section className="a-tarjeta a-texto">
          <h2>Qué se edita en cada sitio</h2>
          <ul>
            <li><strong>Contenido:</strong> páginas, planes, textos legales, navegación y ajustes generales.</li>
            <li><strong>Blog:</strong> artículos, fechas, portada y estado de publicación.</li>
            <li><strong>Medios:</strong> imágenes y PDF usados por el contenido.</li>
            <li><strong>Solicitudes:</strong> contactos y recomendaciones recibidos.</li>
            <li><strong>Historial:</strong> consulta y recuperación de versiones ya publicadas.</li>
          </ul>
        </section>
      </div>

      <div className="a-rejilla a-separado">
        <section className="a-tarjeta a-texto">
          <h2>Blog y artículos programados</h2>
          <p>Un artículo sin la opción «Publicado» es un borrador. Si está publicado con una fecha futura, queda programado y aparecerá en la primera recompilación de ese día.</p>
          <p>La tarea diaria recompila la web alrededor de las 00:10 de Madrid. También puedes usar «Recompilar la web» en <Link className="a-enlace" href="/admin/publicar">Publicar</Link>.</p>
        </section>
        <section className="a-tarjeta a-texto">
          <h2>Imágenes</h2>
          <p>El panel reduce las fotos grandes y las convierte a WebP automáticamente en el navegador. Cada archivo puede pesar como máximo 1,4 MB.</p>
          <p>Escribe siempre un texto alternativo que explique la información de la imagen. No empieces por «Imagen de…».</p>
        </section>
        <section className="a-tarjeta a-texto">
          <h2>Solicitudes y RGPD</h2>
          <p>Las solicitudes se guardan en Cloudflare D1 y, si está conectado, también se copian en Google Sheets. Puedes exportarlas para trabajar con ellas.</p>
          <p>Borra los datos cuando la persona lo solicite y aplica el plazo de conservación indicado en la política de privacidad.</p>
        </section>
        <section className="a-tarjeta a-texto">
          <h2>Cambio de tarifas</h2>
          <p>Las tarifas cambian automáticamente a las 00:00 del 1 de enero de 2027, hora peninsular. La recompilación diaria actualiza también el HTML que ve Google.</p>
        </section>
        <section className="a-tarjeta a-texto">
          <h2>Seguridad</h2>
          <p>Activa la verificación en dos pasos desde <Link className="a-enlace" href="/admin/cuenta">Mi cuenta</Link> y usa una contraseña única.</p>
          <p>Guarda <code>ADMIN_SETUP_TOKEN</code> en un gestor de contraseñas: permite recuperar el acceso si pierdes la contraseña o el segundo factor.</p>
        </section>
        <section className="a-tarjeta a-texto">
          <h2>Si falla una compilación</h2>
          <p>La web pública continúa mostrando la versión anterior; un fallo no deja la página vacía.</p>
          <p>Abre los detalles desde Publicar. Si el contenido era incorrecto, usa <Link className="a-enlace" href="/admin/historial">Historial</Link> para recuperar una versión y vuelve a publicarla.</p>
        </section>
      </div>

      <section className="a-tarjeta a-separado">
        <h2>Variables de Cloudflare</h2>
        <div className="a-tabla-envoltorio" style={{ marginTop: 14, boxShadow: "none" }}>
          <table className="a-tabla adaptable">
            <thead><tr><th>Variable</th><th>Uso</th><th>Necesaria</th></tr></thead>
            <tbody>
              {[
                ["ADMIN_SETUP_TOKEN", "Primer acceso y recuperación de la cuenta", "Sí"],
                ["GITHUB_TOKEN", "Leer y publicar en el repositorio", "Sí en producción"],
                ["GITHUB_REPO", "Repositorio owner/nombre", "Sí en producción"],
                ["GITHUB_BRANCH", "Rama que publica Cloudflare (normalmente main)", "Sí en producción"],
                ["CONTACT_WEBHOOK_URL", "Copia de solicitudes en Google Sheets", "No"],
                ["CONTACT_WEBHOOK_TOKEN", "Autenticación opcional del webhook", "No"],
                ["RESEND_API_KEY", "Avisos por email de nuevas solicitudes", "No"],
                ["AVISO_EMAIL_PARA", "Destinatario de los avisos", "No"],
                ["AVISO_EMAIL_DESDE", "Remitente verificado en Resend", "No"],
                ["CLOUDFLARE_DEPLOY_HOOK", "Recompilación manual y diaria", "Recomendada"],
                ["CLOUDFLARE_API_TOKEN", "Lectura de Web Analytics y métricas de Functions", "Para Analítica"],
                ["CLOUDFLARE_ACCOUNT_ID", "Cuenta propietaria del proyecto", "Para Analítica"],
                ["CLOUDFLARE_SITE_HOST", "Dominio medido por Web Analytics, p. ej. alaryfes.com", "Para Analítica web"],
                ["CLOUDFLARE_WORKER_NAME", "Limita CPU y errores a las Functions de este proyecto", "Recomendada"],
                ["NEXT_PUBLIC_GA_ID", "Google Analytics con consentimiento", "No"],
                ["NEXT_PUBLIC_META_PIXEL_ID", "Meta Pixel con consentimiento", "No"],
              ].map(([nombre, uso, necesaria]) => <tr key={nombre}><td className="a-mono fuerte">{nombre}</td><td>{uso}</td><td>{necesaria}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
