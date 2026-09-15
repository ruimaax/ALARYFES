import datos from "../content/faq.json";
export type Pregunta = { pregunta: string; respuesta: string };
export const faq: Pregunta[] = datos.preguntas;
