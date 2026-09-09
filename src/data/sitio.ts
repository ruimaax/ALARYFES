export const sitio = {
  nombre: "ALARYFES",
  telefonoVisible: "+34 623 173 625",
  localidad: "Ceuta",
  area: "Ceuta y Andalucía",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://alaryfes.com",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "34623173625").replace(
    /\D/g,
    "",
  ),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hola@alaryfes.com",
  titular: process.env.NEXT_PUBLIC_LEGAL_NAME || "Adrian Ruiz Matas",
  nif: process.env.NEXT_PUBLIC_LEGAL_NIF || "77449154N",
  direccion: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "Calle Velarde, Ceuta",
  descripcion:
    "Te montamos la web, te llevamos las redes y nos ocupamos de que aparezcas en Google cuando alguien busque tu servicio en tu barrio.",
  navegacion: [
    { titulo: "Planes", href: "/planes" },
    { titulo: "Servicios", href: "/servicios" },
    { titulo: "Sectores", href: "/sectores" },
    { titulo: "Nosotros", href: "/sobre-nosotros" },
  ],
  legales: [
    { titulo: "Aviso legal", href: "/aviso-legal" },
    { titulo: "Privacidad", href: "/politica-privacidad" },
    { titulo: "Cookies", href: "/politica-cookies" },
  ],
  adicionales: [
    { titulo: "Casos", href: "/casos" },
    { titulo: "Recomienda", href: "/recomienda" },
    { titulo: "Blog", href: "/blog" },
  ],
  hero: {
    contexto: "Desde Ceuta, para los negocios de Andalucía.",
    titulo: "Tu negocio tiene mucho que ofrecer.",
    remate: "Que lo encuentren.",
    pie: "Web · Google · Redes sociales",
    sello: "Construimos tu presencia digital.",
    precio: "Planes desde",
    unidad: "/mes",
    alta: "+ alta inicial",
    impuesto: "Precios sin IVA/IPSI.",
  },
  acciones: {
    whatsapp: "Escribir por WhatsApp",
    planes: "Ver los planes",
    comparar: "Comparar los cuatro planes",
    contacto: "Hablemos",
    formulario: "Ir al formulario",
    enviar: "Enviar mi consulta",
    recomendar: "Registrar recomendación",
    llamar: "Llamar",
    detalle: "Ver qué incluye",
    menu: "Abrir menú",
    cerrar: "Cerrar menú",
  },
  problema: {
    titulo: "Tu próximo cliente ya te está buscando.",
    texto:
      "Pero encuentra una web antigua. Un Instagram que lleva meses parado. Una ficha de Google sin fotos ni horarios. Tu trabajo merece verse tan bien como lo haces.",
    cierre: "Nos ocupamos de esa parte. Tú, de tu negocio.",
  },
  planes: {
    titulo: "Una base. Todo lo que quieras construir.",
    texto:
      "Empieza por lo que necesitas hoy. Amplía cuando tu negocio lo pida.",
    kicker: "Cuatro formas de empezar",
    compromiso: "Elige tu compromiso",
    tres: "3 meses",
    doce: "12 meses",
    alta: "Alta inicial",
    luego: "Luego",
    mensual: "Cuota mensual",
    incluye: "Incluye",
    noIncluye: "No incluye",
    herencia: "Todo lo de",
    mas: ", más:",
    detalle: "Conoce el plan",
    fiscal: "Todos los precios se muestran sin IVA/IPSI.",
    garantia: "Tu cuota no sube durante los primeros 24 meses.",
    comparativa: "Compara el trabajo, no solo el precio.",
    extras: "Si necesitas algo más.",
    extrasNota:
      "Te damos el precio cerrado según lo que necesites. Pregúntanos sin compromiso.",
    condiciones: "Las cosas claras, desde el principio.",
    cambios: "Tu negocio cambia. Tu plan también.",
    aviso: "Antes de contratar",
    pregunta: "¿No sabes por dónde empezar?",
    ayuda:
      "Cuéntanos qué negocio tienes y qué te hace falta. Te orientamos con un plan concreto.",
  },
  proceso: {
    titulo: "De la primera llamada a estar en marcha.",
    texto: "Sin reuniones eternas. Sin palabras que no se entienden.",
    pasos: [
      {
        titulo: "Hablamos",
        texto: "Nos cuentas qué haces, dónde estás y qué necesitas.",
      },
      {
        titulo: "Te proponemos",
        texto: "Un alcance claro, un precio cerrado y los siguientes pasos.",
      },
      {
        titulo: "Construimos",
        texto:
          "Preparamos tu web y tu contenido. Tú lo revisas antes de publicar.",
      },
      {
        titulo: "Seguimos contigo",
        texto: "Publicamos, medimos y nos ocupamos del trabajo de cada mes.",
      },
    ],
  },
  sectores: {
    titulo: "El mismo cuidado. Distintos negocios.",
    texto:
      "No necesita lo mismo una clínica que una barbería. Por eso empezamos escuchando.",
    enlace: "Ver cómo te ayudamos",
  },
  lanzamiento: {
    titulo: "Empieza con el alta de lanzamiento.",
    texto:
      "Hasta el 31 de diciembre de 2026. El 1 de enero suben las altas; la cuota mensual de cada plan se mantiene.",
    fin: "Hasta el 31.12.2026",
    cta: "Consultar precios de lanzamiento",
  },
  contacto: {
    titulo: "Hablemos de lo que quieres construir.",
    texto:
      "Cuéntanos qué negocio tienes. Te diremos por dónde empezar, qué incluye y cuánto cuesta.",
    local: "En Ceuta. Cerca de tu negocio.",
    pendiente:
      "Estamos preparando el canal de WhatsApp. Puedes dejarnos tu consulta en el formulario.",
    whatsappMensaje: "Hola, quiero información para mi negocio.",
    whatsappPlan: "Hola, me interesa el plan",
    whatsappPagina: "Estoy viendo",
    enviado:
      "Tu consulta se ha enviado. Te contactaremos en el teléfono que has indicado.",
    registrado:
      "Consulta registrada en modo de preparación. El canal de recepción aún no está conectado; no podemos confirmar que el equipo la haya recibido.",
    error:
      "No hemos podido enviar tu consulta. Inténtalo de nuevo o escríbenos por WhatsApp.",
    carga: "Enviando…",
    consentimiento:
      "He leído la política de privacidad y consiento el tratamiento de mis datos para responder a esta solicitud.",
    nombre: "Tu nombre",
    negocio: "Nombre de tu negocio",
    telefono: "Teléfono",
    sector: "Tipo de negocio",
    plan: "Plan de interés (opcional)",
    mensaje: "¿Qué necesitas?",
    otro: "Otro",
    sinPlan: "Todavía no lo sé",
    eligeSector: "Selecciona tu sector",
    requerido: "Los campos marcados con * son obligatorios.",
    validacion:
      "Revisa los campos indicados y acepta la política de privacidad.",
    referidoNegocio: "Negocio que recomiendas",
    referidoContacto: "Teléfono o email de ese negocio",
    referidoConsentimiento:
      "He leído la política de privacidad y confirmo que tengo permiso de este negocio para facilitar su contacto y que ALARYFES contacte con él.",
    referidoExito:
      "Tu recomendación se ha enviado. Comprobaremos que cumple las condiciones del programa.",
    limite: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  },
  footer: {
    frase: "La presencia digital de tu negocio, bien construida.",
    origen: "Alarife: el maestro que levanta la obra.",
    derechos: "ALARYFES. Desde Ceuta, con oficio.",
  },
  faq: {
    titulo: "Lo que conviene saber.",
    texto: "Respuestas directas, antes de que nos escribas.",
  },
  sobre: {
    titulo: "El oficio de construir. También en digital.",
    intro:
      "Alarife es el maestro constructor andalusí: el que levanta la obra. De ahí viene ALARYFES.",
    texto:
      "Somos una agencia nueva, con base en Ceuta y enfocada en los negocios de Andalucía. Construimos su presencia digital por etapas: una base que funciona y el trabajo mensual que realmente necesitan.",
    valores: [
      {
        titulo: "Lo que se ve, se entiende.",
        texto: "Cada plan dice qué hacemos, qué no hacemos y cuánto cuesta.",
      },
      {
        titulo: "La obra crece contigo.",
        texto:
          "Puedes empezar por tu web y tu Google. Las redes y la captación llegan cuando tienen sentido.",
      },
      {
        titulo: "Sin resultados inventados.",
        texto:
          "Estamos empezando. No encontrarás clientes ficticios ni promesas de ventas garantizadas.",
      },
    ],
  },
  casos: {
    titulo: "Las primeras historias se están construyendo.",
    texto:
      "Somos una agencia nueva. Todavía no tenemos casos publicados y no vamos a inventarlos. Aquí contaremos trabajos reales, con contexto y resultados comprobables, cuando los tengamos.",
    cta: "Hablemos de tu negocio",
  },
  blog: {
    titulo: "Ideas claras para tu negocio.",
    texto: "Web, Google y redes sociales explicados sin jerga.",
    vacio:
      "Estamos preparando las primeras guías. Pronto las encontrarás aquí.",
    volver: "Volver al blog",
  },
  notFound: {
    titulo: "Por aquí todavía no hemos construido.",
    texto:
      "La página que buscas no existe. Puedes volver al inicio o consultar nuestros planes.",
    cta: "Volver al inicio",
  },
} as const;
