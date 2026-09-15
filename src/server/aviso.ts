import type { ContactPayload } from "../lib/contact-validation";
import type { Secretos } from "./tipos";

export type ConfigAviso = { clave: string; para: string; desde: string };

// Aviso por email de cada solicitud nueva, a través de Resend. Es opcional:
// sin RESEND_API_KEY y AVISO_EMAIL_PARA no se envía nada.
export const configAviso = (s: Secretos): ConfigAviso | null =>
  s.RESEND_API_KEY && s.AVISO_EMAIL_PARA
    ? {
        clave: s.RESEND_API_KEY,
        para: s.AVISO_EMAIL_PARA,
        desde: s.AVISO_EMAIL_DESDE || "ALARYFES <avisos@alaryfes.com>",
      }
    : null;

export async function enviarEmail(
  cfg: ConfigAviso,
  asunto: string,
  texto: string,
) {
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.clave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: cfg.desde, to: [cfg.para], subject: asunto, text: texto }),
    signal: AbortSignal.timeout(6000),
  });
  if (!respuesta.ok)
    throw new Error(`Resend respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);
}

export async function avisarNuevaSolicitud(
  cfg: ConfigAviso,
  urlSitio: string,
  id: string,
  datos: ContactPayload,
) {
  const recomendacion = datos.tipo === "recomendacion";
  const lineas = recomendacion
    ? [
        `Recomienda: ${datos.nombre} (${datos.negocio})`,
        `Negocio recomendado: ${datos.referidoNegocio}`,
        `Contacto del recomendado: ${datos.referidoContacto}`,
      ]
    : [
        `Nombre: ${datos.nombre}`,
        `Negocio: ${datos.negocio}`,
        `Teléfono: ${datos.telefono}`,
        `Tipo de empresa: ${datos.sector}`,
        `Plan de interés: ${datos.plan || "sin indicar"}`,
        "",
        datos.mensaje || "",
      ];
  await enviarEmail(
    cfg,
    recomendacion
      ? `Nueva recomendación: ${datos.referidoNegocio}`
      : `Nueva consulta: ${datos.negocio}`,
    [...lineas, "", `Gestionarla: ${urlSitio}/admin/solicitudes?id=${id}`].join("\n"),
  );
}
