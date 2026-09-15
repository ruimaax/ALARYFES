import datos from "../content/casos.json";
export type Caso = {
  cliente: string;
  sector: string;
  plan: string;
  titulo: string;
  resumen: string;
  resultados: string[];
  testimonio: string;
  autorTestimonio: string;
  imagen: string;
  imagenAlt: string;
  enlace: string;
  publicado: boolean;
};
// Solo casos reales y comprobables: /admin los guarda sin publicar por defecto.
export const casosPublicados = () =>
  (datos.casos as Caso[]).filter((c) => c.publicado);
