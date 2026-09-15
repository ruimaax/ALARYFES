import datos from "../content/blog.json";
export type Articulo = {
  slug: string;
  titulo: string;
  descripcion: string;
  /** Fecha de publicación, AAAA-MM-DD. Si es futura, el artículo queda programado. */
  fecha: string;
  actualizado?: string;
  publicado: boolean;
  imagen?: string;
  imagenAlt?: string;
};
// Solo se leen los cuerpos de src/content/blog/<slug>.md de los artículos
// registrados aquí. Se escriben desde /admin y se compilan como Markdown puro,
// sin JavaScript ni HTML incrustado.
export const articulos = datos.articulos as Articulo[];
const hoyEnMadrid = (fecha: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
// Un artículo programado aparece en la primera compilación a partir de su
// fecha: la recompilación diaria (.github/workflows) lo publica solo.
export const articulosPublicados = (ahora: Date = new Date()) =>
  articulos
    .filter((a) => a.publicado && a.fecha <= hoyEnMadrid(ahora))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
