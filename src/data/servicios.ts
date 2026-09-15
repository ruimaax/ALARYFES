import datos from "../content/servicios.json";
import textos from "../content/textos.json";
import type { PlanSlug } from "./planes";
export const servicios = {
  titulo: datos.titulo,
  descripcion: datos.descripcion,
  disciplinas: datos.disciplinas as {
    nombre: string;
    texto: string;
    desde: string;
    slug: PlanSlug;
  }[],
};
export const comparativa = datos.comparativa as {
  disciplina: string;
  valores: [string, string, string, string];
}[];
export const tablaTextos = textos.tablas;
