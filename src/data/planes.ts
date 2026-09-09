export type PlanSlug = "cimiento" | "torre" | "alcazaba" | "medina";
export type Precios = { alta3: number; alta12: number; mensual: number };
export type Plan = {
  slug: PlanSlug;
  nombre: string;
  descriptor: string;
  bajada: string;
  lanzamiento: Precios;
  normal: Precios;
  incluye: string[];
  noIncluye: string;
  hereda: PlanSlug | null;
  plazo: string;
  avisos: string[];
};
export const FECHA_FIN_LANZAMIENTO = "2026-12-31";
export const ZONA_HORARIA = "Europe/Madrid";
export function enLanzamiento(fecha: Date = new Date()): boolean {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
  return local <= FECHA_FIN_LANZAMIENTO;
}
export function preciosDe(plan: Plan, fecha: Date = new Date()): Precios {
  return enLanzamiento(fecha) ? plan.lanzamiento : plan.normal;
}
export function euros(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(valor);
}
export const planes: Plan[] = [
  {
    slug: "cimiento",
    plazo: "5-7 días laborables",
    nombre: "Cimiento",
    descriptor: "Web one-page + ficha de Google",
    bajada: "La base bien puesta: tu web y tu Google.",
    lanzamiento: {
      alta3: 590,
      alta12: 390,
      mensual: 99,
    },
    normal: {
      alta3: 790,
      alta12: 590,
      mensual: 99,
    },
    incluye: [
      "Web one-page profesional adaptada a su marca",
      "Diseño responsive, pensado primero para móvil",
      "Botón de WhatsApp y de llamada",
      "Enlace a su sistema de reservas externo, si ya usa uno",
      "Ficha de Google Business creada y optimizada: fotos, servicios, horarios y categorías",
      "Hosting, dominio, base de datos y certificado SSL",
      "Copias de seguridad semanales y actualizaciones de seguridad",
      "2 cambios de contenido al mes: precios, horarios, fotos o textos",
      "Soporte por email y WhatsApp, respuesta en 48h laborables",
      "Reporte trimestral",
    ],
    noIncluye:
      "gestión de redes sociales, creación de contenido, anuncios, fotografía, rediseños de la web.",
    hereda: null,
    avisos: [],
  },
  {
    slug: "torre",
    plazo: "7-10 días laborables",
    nombre: "Torre",
    descriptor: "Web + Google + redes sociales",
    bajada: "Ya se te ve desde la calle.",
    lanzamiento: {
      alta3: 699,
      alta12: 499,
      mensual: 199,
    },
    normal: {
      alta3: 999,
      alta12: 699,
      mensual: 199,
    },
    incluye: [
      "6 publicaciones al mes",
      "4 stories al mes",
      "Diseño y redacción de cada publicación",
      "Calendario de contenido mensual, aprobado por el cliente por adelantado",
      "Gestión de reseñas de Google: respuesta a todas las reseñas y sistema para pedirlas a clientes mediante QR o enlace",
      "1 ronda de revisión de contenido al mes",
      "Reporte mensual con datos reales: clics a WhatsApp, llamadas desde Google, visitas web, reseñas nuevas y búsquedas en las que aparece",
    ],
    noIncluye:
      "reels o vídeo, anuncios, fotografía profesional, respuesta a mensajes directos, branding.",
    hereda: "cimiento",
    avisos: [
      "El material gráfico lo aporta el cliente o se usa banco de imágenes. La sesión de fotos propia va como servicio adicional.",
    ],
  },
  {
    slug: "alcazaba",
    plazo: "15-20 días laborables",
    nombre: "Alcazaba",
    descriptor: "Web de 4 páginas + SEO local + redes con reels",
    bajada: "Visible, defendido y creciendo.",
    lanzamiento: {
      alta3: 1190,
      alta12: 790,
      mensual: 399,
    },
    normal: {
      alta3: 1590,
      alta12: 1190,
      mensual: 399,
    },
    incluye: [
      "Web de hasta 4 páginas: inicio, servicios, quiénes somos y contacto",
      "Página de servicios con precios y descripciones",
      "SEO local básico: optimización de ficha de Google, palabras clave por zona y alta en directorios relevantes",
      "12 publicaciones al mes, que sustituyen a las 6 anteriores",
      "8 stories al mes",
      "2 reels al mes",
      "1 sesión de contenido mensual en su local, de 1 hora, para grabar el material de reels y stories",
      "Gestión de comunidad básica: comentarios y mensajes directos respondidos en 24-48h, de lunes a viernes",
      "Chatbox en la web con preguntas frecuentes y derivación a WhatsApp",
      "4 cambios de contenido web al mes",
      "Reporte mensual y llamada de 30 minutos",
    ],
    noIncluye:
      "inversión publicitaria, producción de vídeo avanzada (guion, actores, motion graphics), fotografía de estudio, gestión de crisis o reputación.",
    hereda: "torre",
    avisos: [],
  },
  {
    slug: "medina",
    plazo: "20-30 días laborables",
    nombre: "Medina",
    descriptor: "Web de 8 páginas + redes + captación en Meta",
    bajada: "Todo dentro de las murallas.",
    lanzamiento: {
      alta3: 1790,
      alta12: 1190,
      mensual: 849,
    },
    normal: {
      alta3: 2390,
      alta12: 1790,
      mensual: 849,
    },
    incluye: [
      "Web de hasta 8 páginas, con página propia por categoría de servicio",
      "Integración real del sistema de reservas (Booksy, Treatwell, Calendly o el que use), no solo un enlace",
      "16 publicaciones al mes",
      "12 stories al mes",
      "4 reels al mes",
      "2 sesiones de contenido al mes, de 1 hora cada una",
      "Gestión de campañas de captación: hasta 2 campañas activas simultáneas en Meta (Instagram y Facebook), creatividades incluidas, configuración de públicos, seguimiento semanal y optimización",
      "1 landing de campaña por trimestre, orientada a una oferta concreta, con formulario, seguimiento de conversiones y enlace a WhatsApp",
      "Captación y seguimiento de leads: formulario conectado a hoja de leads en tiempo real, aviso instantáneo de cada contacto nuevo y secuencia automática de hasta 3 emails de seguimiento",
      "Reporte quincenal y reunión mensual de 45 minutos",
      "Soporte prioritario, respuesta en 24h",
    ],
    noIncluye:
      "inversión publicitaria, producción audiovisual avanzada, gestión de varias sedes, garantía de un volumen concreto de ventas.",
    hereda: "alcazaba",
    avisos: [
      "La inversión publicitaria va aparte. Recomendamos entre 200€ y 400€ al mes según el sector. Por debajo de 5€ al día las plataformas no tienen datos suficientes para funcionar.",
      "Los recordatorios de cita se configuran en el sistema de reservas del cliente.",
      "Sedes adicionales: +40% sobre la cuota por cada sede extra.",
    ],
  },
];
