import datos from "../content/planes.json";
export type PlanSlug = "cimiento" | "torre" | "alcazaba" | "medina";
export type Precios = { alta3: number; alta12: number; mensual: number };
export type Plan = {
  slug: PlanSlug;
  nombre: string;
  descriptor: string;
  bajada: string;
  lanzamiento: Precios;
  normal: Precios;
  incluye: string[];
  noIncluye: string;
  hereda: PlanSlug | null;
  plazo: string;
  avisos: string[];
};
export const FECHA_FIN_LANZAMIENTO: string = datos.fechaFinLanzamiento;
export const ZONA_HORARIA = "Europe/Madrid";
export function enLanzamiento(fecha: Date = new Date()): boolean {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
  return local <= FECHA_FIN_LANZAMIENTO;
}
export function preciosDe(plan: Plan, fecha: Date = new Date()): Precios {
  return enLanzamiento(fecha) ? plan.lanzamiento : plan.normal;
}
export function euros(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(valor);
}
// Los cuatro planes son fijos: cada uno tiene su diagrama arquitectónico y su
// columna en la comparativa. En /admin se editan, pero no se añaden ni quitan.
export const planes = datos.planes as Plan[];
