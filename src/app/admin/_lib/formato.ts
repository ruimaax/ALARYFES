const ZONA = "Europe/Madrid";

const aFecha = (valor: string) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T12:00:00Z` : valor);

export const fecha = (valor: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: ZONA }).format(aFecha(valor));

export const fechaHora = (valor: string) =>
  new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONA,
  }).format(new Date(valor));

export function haceTiempo(valor: string) {
  const segundos = (Date.now() - Date.parse(valor)) / 1000;
  if (segundos < 60) return "ahora mismo";
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`;
  const dias = Math.floor(segundos / 86400);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return fecha(valor);
}

export const hoyMadrid = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(new Date());

export const tamano = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1_048_576
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1_048_576).toFixed(1).replace(".", ",")} MB`;

/** Las imágenes de /media se ven en el panel aunque aún no estén publicadas. */
export const urlVista = (valor: string) =>
  valor.startsWith("/media/")
    ? `/api/admin/medios/archivo?ruta=${encodeURIComponent(`public${valor}`)}`
    : valor;

export function enlaceWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${digitos.length === 9 ? `34${digitos}` : digitos}`;
}

export const ESTADOS_SOLICITUD: Record<string, { etiqueta: string; tono: string }> = {
  nueva: { etiqueta: "Nueva", tono: "marca" },
  contactada: { etiqueta: "Contactada", tono: "info" },
  propuesta: { etiqueta: "Propuesta enviada", tono: "aviso" },
  cliente: { etiqueta: "Cliente", tono: "ok" },
  descartada: { etiqueta: "Descartada", tono: "" },
};

export const slugDe = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");

export const plural = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;
