export type Articulo = {
  slug: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  archivo: string;
  publicado: boolean;
};
// Only trusted, local MDX files listed here can be rendered. Never accept MDX from visitors.
export const articulos: Articulo[] = [];
export const articulosPublicados = () => articulos.filter((a) => a.publicado);
