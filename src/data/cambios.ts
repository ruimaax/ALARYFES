import datos from "../content/condiciones.json";
// La tabla de subidas ya no se publica, pero se conserva como referencia.
export const cambios: { cambio: string; alta: number; compromiso: number }[] =
  datos.cambios;
export const politicaCambios = datos.politicaCambios;
export const condiciones: string[] = datos.condiciones;
