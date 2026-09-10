import { sitio } from "./sitio";
export type LegalPage = {
  titulo: string;
  descripcion: string;
  bloques: { titulo: string; texto: string }[];
};
export const privacidadBasica = {
  responsable: `Responsable: ${sitio.titular}.`,
  finalidad:
    "Finalidad: responder a tu consulta o gestionar la recomendación. Base: tu consentimiento y, cuando solicitas una propuesta, las medidas previas al contrato.",
  destinatarios:
    "Acceden los proveedores necesarios para alojar la web y gestionar la solicitud. No vendemos tus datos.",
  derechos: `Puedes acceder, rectificar, suprimir tus datos y retirar el consentimiento escribiendo a ${sitio.email}.`,
  enlace: "Información completa sobre privacidad",
};
export const legales: Record<string, LegalPage> = {
  "aviso-legal": {
    titulo: "Aviso legal",
    descripcion: "Quién está detrás de ALARYFES y cómo contactar.",
    bloques: [
      {
        titulo: "Titular de la web",
        texto: `ALARYFES es el nombre comercial de ${sitio.titular}, con NIF ${sitio.nif} y dirección en ${sitio.direccion}. Contacto: ${sitio.email}. Teléfono: +34 623 173 625. Dominio: alaryfes.com.`,
      },
      {
        titulo: "Qué ofrece esta web",
        texto:
          "Información sobre servicios de diseño web y marketing digital, planes, precios y un programa de recomendaciones. El envío de un formulario no constituye por sí solo la contratación de un servicio. El alcance y las condiciones se concretan en una propuesta.",
      },
      {
        titulo: "Precios y condiciones",
        texto:
          "Los precios se muestran sin IVA. Las altas de lanzamiento se aplican hasta el 31 de diciembre de 2026. Consulta en la página de planes los compromisos, pagos, cambios de plan y condiciones de cancelación.",
      },
      {
        titulo: "Contenidos y enlaces",
        texto:
          "Los contenidos, el diseño y la identidad de ALARYFES no pueden explotarse comercialmente sin autorización de su titular. Las marcas de terceros pertenecen a sus propietarios. Los enlaces externos, como WhatsApp, llevan a servicios con sus propias condiciones.",
      },
      {
        titulo: "Uso del sitio",
        texto:
          "Utiliza la web de forma lícita y facilita datos veraces cuando nos contactes. Trabajamos para mantener la información actualizada; si detectas un error, puedes comunicarlo al correo de contacto.",
      },
    ],
  },
  "politica-privacidad": {
    titulo: "Política de privacidad",
    descripcion: "Qué hacemos con los datos que nos facilitas.",
    bloques: [
      {
        titulo: "Responsable",
        texto: `${sitio.titular}, NIF ${sitio.nif}, con dirección en ${sitio.direccion}. Para cualquier cuestión sobre tus datos: ${sitio.email}.`,
      },
      {
        titulo: "Datos y finalidad",
        texto:
          "El formulario de contacto recoge nombre, negocio, teléfono, tipo de empresa o proyecto, plan de interés y mensaje para atender la consulta y preparar una propuesta si la solicitas. El formulario de recomendación recoge tus datos y el nombre y contacto del negocio recomendado para registrar la recomendación y comprobar sus condiciones. No incluyas datos de salud ni otra información sensible en el mensaje.",
      },
      {
        titulo: "Base del tratamiento",
        texto:
          "Tratamos la solicitud con el consentimiento que expresas en el formulario. Cuando pides una propuesta, también tratamos los datos necesarios para las medidas previas a un posible contrato. No te añadimos a listas publicitarias por enviar una consulta. Puedes retirar tu consentimiento en cualquier momento sin afectar a los tratamientos previos.",
      },
      {
        titulo: "Datos de un negocio recomendado",
        texto:
          "Solo debes facilitar el contacto de un tercero si tienes su permiso para que ALARYFES contacte con él. En el primer contacto informaremos al negocio de la procedencia de los datos, de esta política y de cómo oponerse a nuevos contactos.",
      },
      {
        titulo: "Proveedores y conservación",
        texto:
          "Los proveedores de alojamiento y gestión de consultas pueden tratar datos por cuenta del responsable. Cuando esté conectada, la recepción de formularios se realizará mediante un servicio que registra las solicitudes en Google Sheets. Mientras se prepara esa conexión, la solicitud puede quedar registrada en los registros del servidor y el formulario lo indicará expresamente. Conservamos la información durante la gestión de la solicitud y, cuando proceda, durante los plazos necesarios para atender obligaciones legales o reclamaciones. No vendemos tus datos.",
      },
      {
        titulo: "Servicios externos",
        texto:
          "Al pulsar WhatsApp sales hacia un servicio de Meta, que aplica su propia política de privacidad. Los proveedores tecnológicos pueden tratar información fuera del Espacio Económico Europeo; cuando actúan por nuestra cuenta deben contar con las garantías aplicables para esas transferencias. No usamos el contenido de tus mensajes para decisiones automatizadas ni elaboración de perfiles.",
      },
      {
        titulo: "Tus derechos",
        texto: `Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad y retirar el consentimiento escribiendo a ${sitio.email}. Para tramitarlo podemos pedir la información necesaria para verificar tu identidad. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos en aepd.es.`,
      },
      {
        titulo: "Medición de la web",
        texto:
          "La web dispone de una capa de eventos para medir solicitudes y clics a WhatsApp sin incluir los campos del formulario. Los proveedores externos de analítica o publicidad solo se activan si están configurados y aceptas su uso. Puedes cambiar esa elección en la política de cookies.",
      },
    ],
  },
  "politica-cookies": {
    titulo: "Política de cookies",
    descripcion: "Tú decides si permites la medición opcional.",
    bloques: [
      {
        titulo: "Funcionamiento básico",
        texto:
          "Puedes navegar y enviar los formularios sin aceptar analítica. Guardamos tu elección de privacidad en el almacenamiento local del navegador con la clave alaryfes-analytics. Esa preferencia sirve para respetar tu decisión y no se usa para publicidad.",
      },
      {
        titulo: "Medición opcional",
        texto:
          "Si están configurados, Google Analytics y Meta Pixel se cargan únicamente después de aceptar. Google Analytics permite medir el uso de la web mediante identificadores como _ga (duración habitual de hasta 2 años); Meta puede utilizar _fbp (hasta 3 meses) para medir campañas. No enviamos el nombre, teléfono ni contenido de los formularios como parámetros de estos eventos. Sin proveedores configurados, no se carga ningún píxel externo.",
      },
      {
        titulo: "Cambiar de opinión",
        texto:
          "Puedes aceptar o rechazar la medición desde el control de esta página. Al retirar el permiso detenemos futuras cargas y eliminamos las cookies de medición accesibles desde este dominio. También puedes borrar cookies y almacenamiento desde tu navegador. El bloqueo de cookies de terceros depende de sus ajustes.",
      },
    ],
  },
};
export const cookiesTextos = {
  titulo: "¿Nos permites medir las visitas?",
  texto:
    "La medición opcional nos ayuda a entender qué funciona. Puedes usar la web igualmente si la rechazas.",
  aceptar: "Aceptar medición",
  rechazar: "Rechazar medición",
  configurar: "Cambiar mi elección",
  actual: "Tu elección actual:",
  aceptada: "medición aceptada",
  rechazada: "medición rechazada",
  ninguna: "sin decidir",
  sinProveedores: "No hay proveedores de medición externos activos.",
  politica: "Política de cookies",
};
