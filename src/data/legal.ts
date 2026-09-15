import datos from "../content/legal.json";
import { sitio } from "./sitio";
export type LegalPage = {
  titulo: string;
  descripcion: string;
  bloques: { titulo: string; texto: string }[];
};
// Los textos legales llevan marcadores como {titular} o {email}: se rellenan
// con los datos de la empresa, así un cambio en Ajustes llega a todas partes.
const marcadores: Record<string, string> = {
  titular: sitio.titular,
  nif: sitio.nif,
  direccion: sitio.direccion,
  email: sitio.email,
  telefono: sitio.telefonoVisible,
  dominio: new URL(sitio.url).hostname,
};
export const rellenar = (texto: string) =>
  texto.replace(/\{(\w+)\}/g, (marca, clave: string) =>
    clave in marcadores ? marcadores[clave] : marca,
  );
function rellenarTodo<T>(valor: T): T {
  if (typeof valor === "string") return rellenar(valor) as T;
  if (Array.isArray(valor)) return valor.map(rellenarTodo) as T;
  if (valor && typeof valor === "object")
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, rellenarTodo(v)]),
    ) as T;
  return valor;
}
export const privacidadBasica = rellenarTodo(datos.privacidadBasica);
export const legales: Record<string, LegalPage> = rellenarTodo(datos.paginas);
export const cookiesTextos = datos.cookies;
