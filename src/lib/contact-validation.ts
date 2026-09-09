import { planes } from "@/data/planes";
import { sectores } from "@/data/sectores";
export type ContactPayload = {
  tipo: "contacto" | "recomendacion";
  nombre: string;
  negocio: string;
  telefono?: string;
  sector?: string;
  plan?: string;
  mensaje?: string;
  referidoNegocio?: string;
  referidoContacto?: string;
  consentimiento: true;
  website?: string;
};
export type ValidationResult =
  | { ok: true; data: ContactPayload; spam: boolean }
  | { ok: false; errors: Record<string, string> };
const phone = (v: string) =>
  /^[+()\d\s.-]{7,25}$/.test(v) && v.replace(/\D/g, "").length >= 7;
export function validateContact(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { ok: false, errors: { form: "Solicitud inválida." } };
  const raw = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const str = (key: string, required = true, max = 160) => {
    const value =
      typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
    if ((required && !value) || value.length > max)
      errors[key] =
        required && !value
          ? "Completa este campo."
          : `Usa un máximo de ${max} caracteres.`;
    return value;
  };
  const tipo = raw.tipo === "recomendacion" ? "recomendacion" : "contacto";
  if (!["contacto", "recomendacion"].includes(String(raw.tipo)))
    errors.tipo = "Tipo de solicitud inválido.";
  const nombre = str("nombre", true, 100),
    negocio = str("negocio"),
    website = str("website", false, 200);
  if (website)
    return {
      ok: true,
      data: { tipo, nombre, negocio, consentimiento: true },
      spam: true,
    };
  if (raw.consentimiento !== true)
    errors.consentimiento =
      "Necesitamos tu consentimiento para responder a la solicitud.";
  const data: ContactPayload = { tipo, nombre, negocio, consentimiento: true };
  if (tipo === "contacto") {
    data.telefono = str("telefono", true, 25);
    if (!phone(data.telefono))
      errors.telefono = "Introduce un teléfono válido.";
    data.sector = str("sector");
    if (![...sectores.map((s) => s.slug), "otro"].includes(data.sector))
      errors.sector = "Selecciona un tipo de negocio.";
    data.plan = str("plan", false);
    if (data.plan && !planes.some((p) => p.slug === data.plan))
      errors.plan = "Selecciona un plan válido.";
    data.mensaje = str("mensaje", true, 3000);
  } else {
    data.referidoNegocio = str("referidoNegocio");
    data.referidoContacto = str("referidoContacto", true, 160);
    if (
      !phone(data.referidoContacto) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.referidoContacto)
    )
      errors.referidoContacto = "Introduce un teléfono o email válido.";
  }
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, data, spam: false };
}
export function forSpreadsheet(data: ContactPayload) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === "string" && /^[=+\-@\t\r]/.test(value)
        ? `'${value}`
        : value,
    ]),
  );
}
