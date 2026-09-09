import type { PlanSlug } from "./planes";
export type Sector = {
  slug: string;
  nombre: string;
  breve: string;
  titulo: string;
  problema: string;
  hacemos: string[];
  recomendado: PlanSlug;
  alternativa?: PlanSlug;
  motivo: string;
  ejemplo: { titulo: string; texto: string; nota: string };
  mensaje: string;
};
export const sectores: Sector[] = [
  {
    slug: "clinicas-esteticas",
    nombre: "Clínicas estéticas",
    breve: "Que cada consulta tenga una oportunidad de convertirse en cliente.",
    titulo: "Más consultas para los tratamientos que mejor haces.",
    problema:
      "Tienes buenos tratamientos, pero tu agenda depende demasiado de las recomendaciones. Las personas que te encuentran comparan, preguntan y a veces desaparecen. Necesitas saber de dónde llega cada consulta y responder a tiempo.",
    hacemos: [
      "Una web que explica cada tratamiento y facilita reservar.",
      "Campañas en Meta (Instagram y Facebook) y una página centrada en tu oferta.",
      "Cada contacto registrado, avisos y seguimiento para no perder consultas.",
      "Contenido y reseñas que ayudan a elegir tu clínica.",
    ],
    recomendado: "medina",
    motivo:
      "Medina reúne la web, el contenido y la captación. Medimos los contactos y su origen para que puedas valorar qué se convierte en una cita y en un cliente. También importa cuánto vuelve a gastar ese cliente a lo largo del tiempo.",
    ejemplo: {
      titulo: "Los números, con los pies en el suelo.",
      texto:
        "Medina son 849€/mes más entre 200€ y 400€ de inversión publicitaria. Para que salga a cuenta hacen falta en torno a 1.200€/mes de facturación nueva atribuible. En una clínica donde un cliente gasta entre 600€ y 1.500€ al año, eso es entre uno y dos clientes nuevos al mes. Es alcanzable, pero no lo garantizamos: depende del sector, de la zona y de lo rápido que se conteste a los mensajes que generamos.",
      nota: "Ejemplo hipotético, no un resultado de clientes. Los 1.200€ son una referencia comercial aproximada: cuota y anuncios suman 1.049–1.249€/mes, sin alta ni impuestos. Facturación no es beneficio; hay que descontar los costes del tratamiento. El gasto anual de un cliente tampoco equivale a un cobro inmediato: con 600€ serían dos clientes para sumar 1.200€ de valor anual; con 1.500€, uno. La rentabilidad mensual depende del margen, del cobro y de la repetición.",
    },
    mensaje:
      "Hola, tengo una clínica estética y me interesa saber cómo podéis ayudarnos.",
  },
  {
    slug: "peluquerias",
    nombre: "Peluquerías",
    breve:
      "Tu trabajo cambia la imagen de tus clientas. El nuestro, la de tu negocio.",
    titulo: "Tu trabajo merece verse cada semana.",
    problema:
      "Terminas el día sin tiempo para publicar. Tienes transformaciones que enseñar, pero las fotos se quedan en el móvil. Tus clientas vuelven; tu presencia en internet también necesita constancia.",
    hacemos: [
      "Una web con tus servicios, precios y forma de reservar.",
      "Contenido regular: antes y después, novedades y cuidados.",
      "Una sesión mensual para grabar material en tu peluquería.",
      "Google y reseñas cuidados para que te encuentren en tu zona.",
    ],
    recomendado: "alcazaba",
    motivo:
      "Alcazaba incluye 12 publicaciones, 8 stories, 2 reels y una sesión de contenido al mes. Aporta la regularidad que necesita tu imagen, con una web de hasta 4 páginas y SEO local.",
    ejemplo: {
      titulo: "La constancia también se puede medir.",
      texto:
        "Imagina un ticket medio de 55€, dentro del intervalo habitual de 40–70€. Ocho visitas adicionales sumarían 440€ de facturación. Si esas clientas repiten, su valor aumenta. Revisamos consultas, reservas y recurrencia para entender qué está funcionando.",
      nota: "Ejemplo hipotético. No prometemos ocho visitas ni que esa facturación cubra tu inversión: faltan costes, alta e impuestos. Alcazaba cuesta 399€/mes sin IVA/IPSI.",
    },
    mensaje: "Hola, tengo una peluquería y me interesa el plan Alcazaba.",
  },
  {
    slug: "barberias",
    nombre: "Barberías",
    breve: "Cuando busquen una barbería cerca, que aparezca la tuya.",
    titulo: "Que te encuentren cerca. Que reserven fácil.",
    problema:
      "Quien necesita un corte suele buscar «barbería cerca de mí». Necesita ver dónde estás, cuándo abres, qué cobras y cómo pedir cita. Tu presencia digital puede ser así de sencilla.",
    hacemos: [
      "Tu web en una página, clara y adaptada al móvil.",
      "Tu ficha de Google con fotos, servicios y horarios correctos.",
      "WhatsApp, llamada y enlace a tu sistema de reservas.",
      "Con Torre, también redes y gestión de reseñas.",
    ],
    recomendado: "cimiento",
    alternativa: "torre",
    motivo:
      "Cimiento pone la base por 99€/mes: web y Google, sin complicaciones. Si además quieres publicaciones y ayuda con las reseñas, Torre amplía ese trabajo por 199€/mes.",
    ejemplo: {
      titulo: "Una base sencilla, un coste claro.",
      texto:
        "Con un ticket de 15€, dentro del intervalo de 12–18€, siete cortes suman 105€ de facturación. Es una forma de poner los 99€/mes de Cimiento en contexto. Lo primero que miraremos será si te encuentran y si te llaman.",
      nota: "Ejemplo hipotético, no una previsión de cortes. Facturación no es beneficio: faltan los costes de tu trabajo, el alta y los impuestos.",
    },
    mensaje:
      "Hola, tengo una barbería y me interesan los planes Cimiento o Torre.",
  },
];
export const sectorTextos = {
  hacemos: "Nos ocupamos de esto.",
  recomendado: "Por dónde empezar",
  alternativa: "Si quieres añadir redes y reseñas",
  consultar: "Consultar este plan",
  ejemplo: "Un ejemplo hipotético",
  plazo: "Plazo de entrega",
};
