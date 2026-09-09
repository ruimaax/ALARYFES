export type Extra = {
  concepto: string;
  precio: number | null;
  detalle?: string;
};
export const extras: Extra[] = [
  { concepto: "Sesión de fotos o vídeo adicional (2h)", precio: 250 },
  { concepto: "Reel adicional", precio: 90 },
  { concepto: "Publicación adicional", precio: 35 },
  { concepto: "Landing page extra", precio: 350 },
  { concepto: "Página adicional en web existente", precio: 200 },
  { concepto: "Artículo de blog optimizado (800 palabras)", precio: 90 },
  { concepto: "Diseño de logo e identidad básica", precio: 450 },
  {
    concepto: "Campaña puntual para evento o promoción",
    precio: 200,
    detalle: "+ presupuesto publicitario",
  },
  { concepto: "Cambio de contenido fuera del límite del plan", precio: 40 },
  { concepto: "Sede adicional", precio: null, detalle: "+40% sobre la cuota" },
  { concepto: "Migración de la web en caso de baja", precio: 250 },
];
