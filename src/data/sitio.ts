// El contenido se edita desde /admin y vive en src/content/*.json. Este módulo
// solo lo compone con la forma que ya usan los componentes.
// Rutas relativas a propósito: las funciones de Cloudflare también lo importan.
import ajustes from "../content/ajustes.json";
import navegacion from "../content/navegacion.json";
import inicio from "../content/inicio.json";
import planes from "../content/planes.json";
import contacto from "../content/contacto.json";
import faq from "../content/faq.json";
import sobre from "../content/sobre.json";
import casos from "../content/casos.json";
import textos from "../content/textos.json";

const { empresa } = ajustes;

export const sitio = {
  nombre: empresa.nombre,
  telefonoVisible: empresa.telefonoVisible,
  localidad: empresa.localidad,
  area: empresa.area,
  url: empresa.url.replace(/\/+$/, ""),
  whatsapp: empresa.whatsapp.replace(/\D/g, ""),
  email: empresa.email,
  titular: empresa.titular,
  nif: empresa.nif,
  direccion: empresa.direccion,
  descripcion: empresa.descripcion,
  navegacion: navegacion.principal,
  legales: navegacion.legales,
  adicionales: navegacion.adicionales,
  hero: inicio.hero,
  acciones: textos.acciones,
  problema: inicio.problema,
  planes: planes.textos,
  proceso: inicio.proceso,
  lanzamiento: inicio.lanzamiento,
  contacto,
  footer: navegacion.footer,
  faq: { titulo: faq.titulo, texto: faq.texto },
  sobre,
  casos: { titulo: casos.titulo, texto: casos.texto, cta: casos.cta },
  blog: textos.blog,
  notFound: textos.notFound,
};

export const seo = ajustes.seo;
export const analitica = ajustes.analitica;
export const mantenimiento = ajustes.mantenimiento;
