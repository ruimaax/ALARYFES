/**
 * Qué se puede editar en /admin → Contenido. Cada sección es un archivo de
 * src/content/ con su esquema. Si añades un texto nuevo a un JSON, descríbelo
 * aquí también: la prueba tests/cms.test.ts avisa si falta alguno.
 */
import type {
  Campo,
  CampoBooleano,
  CampoEmail,
  CampoEnlace,
  CampoFecha,
  CampoFila,
  CampoGrupo,
  CampoImagen,
  CampoLista,
  CampoNumero,
  CampoSeleccion,
  CampoTexto,
} from "./esquema";

export const RUTA_CONTENIDO = "src/content";
export const RUTA_BLOG = "src/content/blog";
export const INDICE_BLOG = "src/content/blog.json";
export const RUTA_MEDIOS = "public/media";

type Extra = Partial<Omit<CampoTexto, "tipo" | "clave" | "etiqueta">>;
const t = (clave: string, etiqueta: string, extra: Extra = {}): CampoTexto => ({
  tipo: "texto",
  clave,
  etiqueta,
  requerido: true,
  ...extra,
});
const tl = (clave: string, etiqueta: string, extra: Extra = {}): CampoTexto => ({
  tipo: "textoLargo",
  clave,
  etiqueta,
  requerido: true,
  ...extra,
});
const g = (
  clave: string,
  etiqueta: string,
  campos: Campo[],
  extra: Partial<CampoGrupo> = {},
): CampoGrupo => ({ tipo: "grupo", clave, etiqueta, campos, ...extra });
const lista = (
  clave: string,
  etiqueta: string,
  elemento: Campo,
  extra: Partial<CampoLista> = {},
): CampoLista => ({ tipo: "lista", clave, etiqueta, elemento, ...extra });
const num = (
  clave: string,
  etiqueta: string,
  extra: Partial<CampoNumero> = {},
): CampoNumero => ({ tipo: "numero", clave, etiqueta, ...extra });
const euros = (clave: string, etiqueta: string) =>
  num(clave, etiqueta, { min: 0, entero: true, sufijo: "€", medio: true });
const si = (
  clave: string,
  etiqueta: string,
  extra: Partial<CampoBooleano> = {},
): CampoBooleano => ({ tipo: "booleano", clave, etiqueta, ...extra });
const fecha = (
  clave: string,
  etiqueta: string,
  extra: Partial<CampoFecha> = {},
): CampoFecha => ({ tipo: "fecha", clave, etiqueta, ...extra });
const imagen = (
  clave: string,
  etiqueta: string,
  extra: Partial<CampoImagen> = {},
): CampoImagen => ({ tipo: "imagen", clave, etiqueta, ...extra });
const enlace = (
  clave: string,
  etiqueta: string,
  extra: Partial<CampoEnlace> = {},
): CampoEnlace => ({ tipo: "enlace", clave, etiqueta, ...extra });
const email = (
  clave: string,
  etiqueta: string,
  extra: Partial<CampoEmail> = {},
): CampoEmail => ({ tipo: "email", clave, etiqueta, ...extra });
const opciones = (
  clave: string,
  etiqueta: string,
  valores: [string, string][],
  extra: Partial<CampoSeleccion> = {},
): CampoSeleccion => ({
  tipo: "seleccion",
  clave,
  etiqueta,
  opciones: valores.map(([valor, texto]) => ({ valor, etiqueta: texto })),
  ...extra,
});
const fila = (
  clave: string,
  etiqueta: string,
  columnas: string[],
  extra: Partial<CampoFila> = {},
): CampoFila => ({ tipo: "fila", clave, etiqueta, columnas, ...extra });
/** Grupo de textos cortos: [clave, etiqueta, largo?]. */
const textos = (pares: [string, string, boolean?][]): Campo[] =>
  pares.map(([clave, etiqueta, largo]) =>
    largo ? tl(clave, etiqueta, { filas: 2 }) : t(clave, etiqueta),
  );

const PLANES: [string, string][] = [
  ["cimiento", "Cimiento"],
  ["torre", "Torre"],
  ["alcazaba", "Alcazaba"],
  ["medina", "Medina"],
];
const MARCADORES =
  "Puedes escribir {titular}, {nif}, {direccion}, {email}, {telefono} y {dominio}: se sustituyen por los datos de Ajustes generales.";

const enlaceMenu = g("", "Enlace", [
  t("titulo", "Texto", { medio: true }),
  enlace("href", "Destino", { requerido: true, medio: true }),
]);

const precios = (clave: string, etiqueta: string) =>
  g(clave, etiqueta, [
    euros("alta3", "Alta con 3 meses"),
    euros("alta12", "Alta con 12 meses"),
    euros("mensual", "Cuota mensual"),
  ]);

const paginaLegal = (clave: string, etiqueta: string) =>
  g(
    clave,
    etiqueta,
    [
      t("titulo", "Título"),
      t("descripcion", "Descripción"),
      lista(
        "bloques",
        "Apartados",
        g("", "Apartado", [
          t("titulo", "Título"),
          tl("texto", "Texto", { filas: 6, marcadores: true }),
        ]),
        { titulo: "titulo", min: 1, etiquetaNuevo: "Añadir apartado" },
      ),
    ],
    { plegado: true },
  );

export type Seccion = {
  id: string;
  titulo: string;
  descripcion: string;
  grupo: "Páginas" | "Planes y precios" | "Legal" | "Configuración";
  archivo: string;
  /** Página de la web donde se ve el resultado. */
  ver: string;
  esquema: CampoGrupo;
};

export const secciones: Seccion[] = [
  {
    id: "inicio",
    titulo: "Página de inicio",
    descripcion: "Portada, el problema, cómo trabajamos y la banda de lanzamiento.",
    grupo: "Páginas",
    archivo: `${RUTA_CONTENIDO}/inicio.json`,
    ver: "/",
    esquema: g("", "Inicio", [
      g(
        "hero",
        "Portada",
        [
          t("contexto", "Texto sobre el titular"),
          t("titulo", "Titular"),
          t("remate", "Remate en cursiva"),
          t("pie", "Línea de servicios", { medio: true }),
          t("sello", "Sello", { medio: true }),
          t("precio", "Texto antes del precio", { medio: true }),
          t("unidad", "Unidad del precio", { medio: true }),
          t("alta", "Texto tras el precio", { medio: true }),
          t("impuesto", "Nota de impuestos", { medio: true }),
        ],
        {
          ayuda:
            "La descripción bajo el titular está en Ajustes generales. El precio «desde» se calcula solo con la cuota del plan más barato.",
        },
      ),
      g("problema", "Bloque «el problema»", [
        t("titulo", "Título"),
        tl("texto", "Texto"),
        t("cierre", "Frase de cierre"),
      ]),
      g("proceso", "Cómo trabajamos", [
        t("titulo", "Título"),
        t("texto", "Entradilla"),
        lista(
          "pasos",
          "Pasos",
          g("", "Paso", [t("titulo", "Título"), tl("texto", "Texto", { filas: 2 })]),
          { titulo: "titulo", min: 1, max: 6, etiquetaNuevo: "Añadir paso" },
        ),
      ]),
      g(
        "lanzamiento",
        "Banda de lanzamiento",
        [
          t("titulo", "Título"),
          tl("texto", "Texto", { filas: 2 }),
          t("fin", "Etiqueta de la fecha", { medio: true }),
          t("cta", "Texto del enlace", { medio: true }),
        ],
        {
          ayuda:
            "Desaparece sola al terminar la fecha de lanzamiento, que se cambia en Planes y precios.",
        },
      ),
    ]),
  },
  {
    id: "servicios",
    titulo: "Servicios y comparativa",
    descripcion: "Las seis disciplinas y la tabla que compara los planes.",
    grupo: "Páginas",
    archivo: `${RUTA_CONTENIDO}/servicios.json`,
    ver: "/servicios",
    esquema: g("", "Servicios", [
      t("titulo", "Título de la página"),
      tl("descripcion", "Entradilla", { filas: 2 }),
      lista(
        "disciplinas",
        "Disciplinas",
        g("", "Disciplina", [
          t("nombre", "Nombre", { medio: true }),
          opciones("slug", "Enlaza al plan", PLANES, { medio: true }),
          tl("texto", "Texto", { filas: 3 }),
          t("desde", "Texto del enlace"),
        ]),
        {
          titulo: "nombre",
          min: 1,
          max: 6,
          ayuda: "Cada disciplina tiene su icono: caben seis.",
          etiquetaNuevo: "Añadir disciplina",
        },
      ),
      lista(
        "comparativa",
        "Tabla comparativa",
        g("", "Fila", [
          t("disciplina", "Concepto"),
          fila("valores", "Valor en cada plan", PLANES.map((p) => p[1]), {
            requerido: true,
          }),
        ]),
        {
          titulo: "disciplina",
          min: 1,
          ayuda: "Se muestra en Planes y precios.",
          etiquetaNuevo: "Añadir fila",
        },
      ),
    ]),
  },
  {
    id: "sobre",
    titulo: "Sobre nosotros",
    descripcion: "Quiénes sois y vuestros valores.",
    grupo: "Páginas",
    archivo: `${RUTA_CONTENIDO}/sobre.json`,
    ver: "/sobre-nosotros",
    esquema: g("", "Sobre nosotros", [
      t("titulo", "Título"),
      tl("intro", "Entradilla", { filas: 2 }),
      tl("texto", "Texto principal", { filas: 4 }),
      lista(
        "valores",
        "Valores",
        g("", "Valor", [t("titulo", "Título"), tl("texto", "Texto", { filas: 2 })]),
        { titulo: "titulo", min: 1, max: 6, etiquetaNuevo: "Añadir valor" },
      ),
    ]),
  },
  {
    id: "casos",
    titulo: "Casos de éxito",
    descripcion: "Trabajos reales con resultados comprobables y testimonios.",
    grupo: "Páginas",
    archivo: `${RUTA_CONTENIDO}/casos.json`,
    ver: "/casos",
    esquema: g("", "Casos", [
      t("titulo", "Título de la página"),
      tl("texto", "Entradilla", { filas: 3 }),
      t("cta", "Texto del botón (sin casos publicados)"),
      lista(
        "casos",
        "Casos",
        g("", "Caso", [
          t("cliente", "Cliente", { medio: true }),
          t("sector", "Sector", { medio: true }),
          opciones("plan", "Plan contratado", [["", "Sin indicar"], ...PLANES.map(([, n]): [string, string] => [n, n])], { medio: true }),
          si("publicado", "Publicado", {
            medio: true,
            ayuda: "Publícalo solo con permiso del cliente.",
          }),
          t("titulo", "Titular del caso"),
          tl("resumen", "Resumen", { filas: 3 }),
          lista("resultados", "Resultados comprobables", t("", "Resultado"), {
            etiquetaNuevo: "Añadir resultado",
          }),
          tl("testimonio", "Testimonio", { requerido: false, filas: 3 }),
          t("autorTestimonio", "Autor del testimonio", { requerido: false }),
          imagen("imagen", "Imagen"),
          t("imagenAlt", "Texto alternativo de la imagen", { requerido: false }),
          enlace("enlace", "Web del cliente"),
        ]),
        { titulo: "cliente", etiquetaNuevo: "Añadir caso" },
      ),
    ]),
  },
  {
    id: "recomienda",
    titulo: "Programa Recomienda",
    descripcion: "Recompensas, Círculo de Alarifes y condiciones.",
    grupo: "Páginas",
    archivo: `${RUTA_CONTENIDO}/recomienda.json`,
    ver: "/recomienda",
    esquema: g("", "Recomienda", [
      t("titulo", "Título"),
      t("descripcion", "Entradilla"),
      t("pasosTitulo", "Título de los pasos"),
      lista("pasos", "Pasos", t("", "Paso"), { min: 1, max: 6 }),
      t("recompensasTitulo", "Título de la tabla de recompensas"),
      lista(
        "recompensas",
        "Recompensas por plan",
        fila("", "Fila", ["Plan contratado", "Tú ganas", "Quien recomiendas gana"], {
          requerido: true,
        }),
        { fija: true },
      ),
      t("circuloTitulo", "Título del Círculo"),
      tl("circuloTexto", "Texto del Círculo", { filas: 2 }),
      lista(
        "circulo",
        "Niveles del Círculo",
        fila("", "Nivel", ["Referidos", "Recompensa"], { requerido: true }),
        { min: 1, etiquetaNuevo: "Añadir nivel" },
      ),
      tl("excepcion", "Aviso sobre la cuota congelada", { filas: 3 }),
      t("condicionesTitulo", "Título de las condiciones"),
      lista("condiciones", "Condiciones", tl("", "Condición", { filas: 2 }), {
        min: 1,
        etiquetaNuevo: "Añadir condición",
      }),
      t("formulario", "Título del formulario"),
    ]),
  },
  {
    id: "contacto",
    titulo: "Contacto y formularios",
    descripcion: "Textos de contacto, etiquetas y mensajes de los formularios.",
    grupo: "Páginas",
    archivo: `${RUTA_CONTENIDO}/contacto.json`,
    ver: "/contacto",
    esquema: g("", "Contacto", [
      t("titulo", "Título", { apartado: "Página de contacto" }),
      tl("texto", "Entradilla", { filas: 2 }),
      t("local", "Frase sobre dónde trabajáis"),
      tl("pendiente", "Aviso si no hay WhatsApp", { filas: 2 }),
      t("whatsappMensaje", "Mensaje predefinido", {
        apartado: "WhatsApp",
        ayuda: "Texto con el que se abre la conversación.",
      }),
      t("whatsappPlan", "Mensaje desde un plan", {
        ayuda: "Se completa con el nombre del plan.",
        medio: true,
      }),
      t("whatsappPagina", "Texto antes de la página", {
        ayuda: "Se completa con la dirección de la página.",
        medio: true,
      }),
      t("nombre", "Campo nombre", { apartado: "Etiquetas del formulario", medio: true }),
      t("negocio", "Campo negocio", { medio: true }),
      t("telefono", "Campo teléfono", { medio: true }),
      t("sector", "Campo tipo de empresa", { medio: true }),
      t("plan", "Campo plan", { medio: true }),
      t("sinPlan", "Opción «sin plan»", { medio: true }),
      t("mensaje", "Campo mensaje", { medio: true }),
      t("carga", "Botón mientras envía", { medio: true }),
      tl("consentimiento", "Casilla de consentimiento", { filas: 2 }),
      t("requerido", "Nota de campos obligatorios"),
      t("referidoNegocio", "Campo negocio recomendado", {
        apartado: "Formulario de recomendación",
        medio: true,
      }),
      t("referidoContacto", "Campo contacto recomendado", { medio: true }),
      tl("referidoConsentimiento", "Casilla de consentimiento", { filas: 3 }),
      tl("enviado", "Enviado correctamente", { apartado: "Mensajes", filas: 2 }),
      tl("referidoExito", "Recomendación enviada", { filas: 2 }),
      tl("registrado", "Recibido sin canal conectado", { filas: 2 }),
      tl("error", "Error al enviar", { filas: 2 }),
      tl("validacion", "Faltan datos", { filas: 2 }),
      tl("limite", "Demasiados intentos", { filas: 2 }),
    ]),
  },
  {
    id: "planes",
    titulo: "Planes y precios",
    descripcion: "Precios, qué incluye cada plan, fecha de lanzamiento y textos.",
    grupo: "Planes y precios",
    archivo: `${RUTA_CONTENIDO}/planes.json`,
    ver: "/planes",
    esquema: g("", "Planes", [
      fecha("fechaFinLanzamiento", "Último día de las tarifas de lanzamiento", {
        requerido: true,
        ayuda:
          "Desde las 00:00 del día siguiente (hora de Madrid) se muestran las tarifas normales. La cuota mensual no cambia.",
      }),
      lista(
        "planes",
        "Planes",
        g("", "Plan", [
          t("slug", "Identificador", { soloLectura: true, medio: true }),
          t("nombre", "Nombre", { medio: true }),
          t("descriptor", "Resumen", { medio: true }),
          t("plazo", "Plazo de entrega", { medio: true }),
          t("bajada", "Frase del diagrama"),
          precios("lanzamiento", "Precios de lanzamiento"),
          precios("normal", "Precios normales"),
          lista("incluye", "Incluye", tl("", "Elemento", { filas: 2 }), {
            min: 1,
            etiquetaNuevo: "Añadir elemento",
          }),
          tl("noIncluye", "No incluye", { filas: 2 }),
          lista("avisos", "Avisos", tl("", "Aviso", { filas: 2 }), {
            etiquetaNuevo: "Añadir aviso",
          }),
          t("hereda", "Incluye todo lo de", { soloLectura: true, requerido: false }),
        ]),
        {
          fija: true,
          titulo: "nombre",
          ayuda:
            "Los cuatro planes son fijos: cada uno tiene su diagrama y su columna en la comparativa.",
        },
      ),
      g(
        "textos",
        "Textos de la sección de planes",
        textos([
          ["titulo", "Titular"],
          ["texto", "Entradilla"],
          ["kicker", "Antetítulo en inicio"],
          ["compromiso", "Selector de compromiso"],
          ["tres", "Opción de 3 meses"],
          ["doce", "Opción de 12 meses"],
          ["alta", "Etiqueta del alta"],
          ["luego", "Etiqueta «luego»"],
          ["mensual", "Etiqueta de la cuota"],
          ["incluye", "Título «incluye»"],
          ["noIncluye", "Título «no incluye»"],
          ["herencia", "Texto «Todo lo de»"],
          ["mas", "Texto «, más:»"],
          ["detalle", "Enlace al detalle"],
          ["fiscal", "Nota fiscal"],
          ["garantia", "Garantía de cuota"],
          ["comparativa", "Título de la comparativa"],
          ["extras", "Título de servicios adicionales"],
          ["extrasNota", "Nota de servicios adicionales", true],
          ["condiciones", "Título de condiciones"],
          ["cambios", "Título de cambios de plan"],
          ["aviso", "Título «antes de contratar»"],
          ["pregunta", "Pregunta de ayuda"],
          ["ayuda", "Texto de ayuda", true],
        ]),
        { plegado: true },
      ),
    ]),
  },
  {
    id: "extras",
    titulo: "Servicios adicionales",
    descripcion: "La lista que se muestra como «A consultar».",
    grupo: "Planes y precios",
    archivo: `${RUTA_CONTENIDO}/extras.json`,
    ver: "/servicios",
    esquema: g("", "Extras", [
      lista("extras", "Servicios adicionales", g("", "Servicio", [t("concepto", "Concepto")]), {
        titulo: "concepto",
        ayuda: "En la web aparecen con el precio «A consultar».",
        etiquetaNuevo: "Añadir servicio",
      }),
    ]),
  },
  {
    id: "condiciones",
    titulo: "Condiciones y cambios de plan",
    descripcion: "Permanencia, pagos, bajada, cancelación y tabla interna de subidas.",
    grupo: "Planes y precios",
    archivo: `${RUTA_CONTENIDO}/condiciones.json`,
    ver: "/planes#condiciones",
    esquema: g("", "Condiciones", [
      lista("condiciones", "Condiciones", tl("", "Condición", { filas: 2 }), {
        min: 1,
        etiquetaNuevo: "Añadir condición",
      }),
      g("politicaCambios", "Política de cambios de plan", [
        tl("intro", "Introducción", { filas: 3 }),
        tl("bajar", "Si baja de plan", { filas: 2 }),
        tl("cancelar", "Si cancela", { filas: 3 }),
        tl("compromiso", "Nuevo compromiso", { filas: 2 }),
      ]),
      lista(
        "cambios",
        "Tabla interna de subidas",
        g("", "Cambio", [
          t("cambio", "Cambio"),
          euros("alta", "Alta"),
          euros("compromiso", "Con compromiso"),
        ]),
        {
          titulo: "cambio",
          ayuda: "Referencia interna: esta tabla no se publica en la web.",
          etiquetaNuevo: "Añadir cambio",
        },
      ),
    ]),
  },
  {
    id: "faq",
    titulo: "Preguntas frecuentes",
    descripcion: "Las preguntas de Planes y de cada plan. También van a Google.",
    grupo: "Planes y precios",
    archivo: `${RUTA_CONTENIDO}/faq.json`,
    ver: "/planes#preguntas",
    esquema: g("", "Preguntas frecuentes", [
      t("titulo", "Título"),
      t("texto", "Entradilla"),
      lista(
        "preguntas",
        "Preguntas",
        g("", "Pregunta", [t("pregunta", "Pregunta"), tl("respuesta", "Respuesta", { filas: 5 })]),
        { titulo: "pregunta", min: 1, etiquetaNuevo: "Añadir pregunta" },
      ),
    ]),
  },
  {
    id: "legal",
    titulo: "Textos legales",
    descripcion: "Aviso legal, privacidad, cookies e información junto a los formularios.",
    grupo: "Legal",
    archivo: `${RUTA_CONTENIDO}/legal.json`,
    ver: "/aviso-legal",
    esquema: g("", "Legal", [
      g(
        "paginas",
        "Páginas legales",
        [
          paginaLegal("aviso-legal", "Aviso legal"),
          paginaLegal("politica-privacidad", "Política de privacidad"),
          paginaLegal("politica-cookies", "Política de cookies"),
        ],
        { ayuda: MARCADORES },
      ),
      g(
        "privacidadBasica",
        "Información básica junto a los formularios",
        [
          tl("responsable", "Responsable", { filas: 2, marcadores: true }),
          tl("finalidad", "Finalidad", { filas: 3, marcadores: true }),
          tl("destinatarios", "Destinatarios", { filas: 2, marcadores: true }),
          tl("derechos", "Derechos", { filas: 2, marcadores: true }),
          t("enlace", "Texto del enlace a la política"),
        ],
        { plegado: true },
      ),
      g(
        "cookies",
        "Aviso y controles de cookies",
        textos([
          ["titulo", "Título del aviso"],
          ["texto", "Texto del aviso", true],
          ["aceptar", "Botón aceptar"],
          ["rechazar", "Botón rechazar"],
          ["configurar", "Enlace para cambiar"],
          ["actual", "Texto «tu elección»"],
          ["aceptada", "Estado aceptada"],
          ["rechazada", "Estado rechazada"],
          ["ninguna", "Estado sin decidir"],
          ["sinProveedores", "Aviso sin proveedores"],
          ["politica", "Enlace a la política"],
        ]),
        { plegado: true },
      ),
    ]),
  },
  {
    id: "ajustes",
    titulo: "Ajustes generales",
    descripcion: "Datos de la empresa, Google, analítica y modo mantenimiento.",
    grupo: "Configuración",
    archivo: `${RUTA_CONTENIDO}/ajustes.json`,
    ver: "/",
    esquema: g("", "Ajustes", [
      g("empresa", "Datos de la empresa", [
        t("nombre", "Nombre comercial", { medio: true }),
        t("url", "Dirección de la web", {
          medio: true,
          patron: "^https://[^\\s/]+$",
          mensajePatron: "Empieza por https:// y sin barra final.",
          ayuda: "Dirección principal. Se usa en Google y al compartir.",
        }),
        tl("descripcion", "Descripción del negocio", {
          filas: 2,
          max: 300,
          ayuda:
            "Aparece bajo el titular de inicio y como descripción en Google. Ideal: menos de 160 caracteres.",
        }),
        t("telefonoVisible", "Teléfono (como se muestra)", { medio: true }),
        t("whatsapp", "Número de WhatsApp", {
          medio: true,
          patron: "^\\d{8,15}$",
          mensajePatron: "Solo números, con el prefijo del país: 34600000000.",
          ayuda: "Con prefijo y sin espacios ni +.",
        }),
        email("email", "Email de contacto", { requerido: true, medio: true }),
        t("localidad", "Localidad", { medio: true }),
        t("area", "Zona de servicio", { medio: true }),
        t("titular", "Titular legal", {
          medio: true,
          ayuda: "Nombre y apellidos o razón social.",
        }),
        t("nif", "NIF", { medio: true }),
        t("direccion", "Dirección legal", {
          ayuda:
            "La dirección completa del titular. La ley (LSSI) exige publicarla en el aviso legal.",
        }),
      ]),
      g("seo", "Google y redes sociales", [
        t("tituloPorDefecto", "Título por defecto", { max: 70 }),
        t("tituloSocial", "Título al compartir", { max: 90 }),
        imagen("imagenSocial", "Imagen al compartir", {
          ayuda:
            "1200 × 630 px. Es la imagen que sale al compartir la web en WhatsApp o redes.",
        }),
        si("indexar", "Permitir que Google indexe la web", {
          ayuda: "Desactívalo solo si la web no debe aparecer todavía en buscadores.",
        }),
        t("verificacionGoogle", "Verificación de Google Search Console", {
          requerido: false,
          ayuda:
            "Solo el valor de content de la etiqueta que te da Search Console.",
        }),
      ]),
      g(
        "analitica",
        "Analítica",
        [
          t("googleAnalytics", "ID de Google Analytics", {
            requerido: false,
            medio: true,
            patron: "^G-[A-Z0-9]+$",
            mensajePatron: "Formato G-XXXXXXX.",
          }),
          t("metaPixel", "ID de Meta Pixel", {
            requerido: false,
            medio: true,
            patron: "^\\d+$",
            mensajePatron: "Solo números.",
          }),
        ],
        {
          ayuda:
            "Opcional. Solo se cargan si el visitante acepta la medición; sin ningún ID no aparece el aviso de cookies.",
        },
      ),
      g(
        "mantenimiento",
        "Modo mantenimiento",
        [
          si("activo", "Mostrar solo el aviso de mantenimiento en toda la web"),
          t("titulo", "Título"),
          tl("texto", "Texto", { filas: 2 }),
        ],
        {
          ayuda:
            "Los visitantes solo ven este aviso, tu WhatsApp y tu email. El panel sigue funcionando.",
        },
      ),
    ]),
  },
  {
    id: "navegacion",
    titulo: "Menú y pie de página",
    descripcion: "Enlaces del menú principal, del pie y textos del pie.",
    grupo: "Configuración",
    archivo: `${RUTA_CONTENIDO}/navegacion.json`,
    ver: "/",
    esquema: g("", "Navegación", [
      lista("principal", "Menú principal", enlaceMenu, {
        titulo: "titulo",
        min: 1,
        max: 6,
        ayuda: "El logo lleva a inicio y el botón de contacto se añade solo.",
        etiquetaNuevo: "Añadir enlace",
      }),
      lista("adicionales", "Enlaces del pie", enlaceMenu, {
        titulo: "titulo",
        max: 8,
        etiquetaNuevo: "Añadir enlace",
      }),
      lista("legales", "Enlaces legales del pie", enlaceMenu, {
        titulo: "titulo",
        max: 6,
        etiquetaNuevo: "Añadir enlace",
      }),
      g("footer", "Textos del pie", [
        t("frase", "Frase"),
        t("origen", "Nota sobre el nombre"),
        t("derechos", "Línea final"),
      ]),
    ]),
  },
  {
    id: "textos",
    titulo: "Textos de interfaz",
    descripcion: "Botones, etiquetas de tablas, blog y página no encontrada.",
    grupo: "Configuración",
    archivo: `${RUTA_CONTENIDO}/textos.json`,
    ver: "/",
    esquema: g("", "Textos", [
      g(
        "acciones",
        "Botones y enlaces",
        textos([
          ["whatsapp", "Botón de WhatsApp"],
          ["planes", "Ver los planes"],
          ["comparar", "Comparar planes"],
          ["contacto", "Botón de contacto"],
          ["formulario", "Ir al formulario"],
          ["enviar", "Enviar consulta"],
          ["recomendar", "Enviar recomendación"],
          ["llamar", "Llamar"],
          ["detalle", "Ver qué incluye"],
          ["menu", "Abrir menú (lectores de pantalla)"],
          ["cerrar", "Cerrar menú (lectores de pantalla)"],
        ]),
        { plegado: true },
      ),
      g(
        "blog",
        "Blog",
        textos([
          ["titulo", "Título del blog"],
          ["texto", "Entradilla"],
          ["vacio", "Mensaje sin artículos", true],
          ["volver", "Enlace para volver"],
        ]),
        { plegado: true },
      ),
      g(
        "notFound",
        "Página no encontrada (404)",
        textos([
          ["titulo", "Título"],
          ["texto", "Texto", true],
          ["cta", "Botón"],
        ]),
        { plegado: true },
      ),
      g(
        "tablas",
        "Encabezados de tablas",
        textos([
          ["concepto", "Concepto"],
          ["precio", "Precio"],
          ["consultar", "Precio a consultar"],
          ["cambio", "Cambio de plan"],
          ["alta", "Alta adicional"],
          ["compromiso", "Con compromiso"],
          ["disciplina", "Columna de disciplinas"],
          ["referidoPlan", "Plan contratado"],
          ["tu", "Tú ganas"],
          ["otro", "Quien recomiendas gana"],
          ["referidos", "Referidos"],
          ["recompensa", "Qué ganas"],
        ]),
        { plegado: true },
      ),
      g(
        "interfaz",
        "Etiquetas generales y accesibilidad",
        textos([
          ["inicio", "Inicio"],
          ["planes", "Planes"],
          ["servicios", "Servicios"],
          ["contacto", "Contacto"],
          ["recomienda", "Recomienda"],
          ["nosotros", "Sobre nosotros"],
          ["casos", "Casos"],
          ["blog", "Blog"],
          ["saltar", "Saltar al contenido"],
          ["navegacion", "Navegación principal"],
          ["navegacionMovil", "Navegación móvil"],
          ["ruta", "Ruta de navegación"],
          ["mas", "Más sobre la empresa"],
          ["informacionLegal", "Información legal"],
          ["plan", "Plan"],
          ["plazo", "Plazo de entrega"],
          ["heredado", "Ver lo heredado", true],
          ["sustituye", "Nota de sustitución", true],
          ["condiciones", "Enlace a condiciones"],
          ["servicio", "Nombre del servicio (Google)"],
          ["oferta", "Descripción de la oferta (Google)"],
          ["logoAlt", "Descripción del logo", true],
        ]),
        { plegado: true },
      ),
    ]),
  },
  {
    id: "redirecciones",
    titulo: "Redirecciones",
    descripcion: "Envía direcciones antiguas a las nuevas para no perder visitas.",
    grupo: "Configuración",
    archivo: `${RUTA_CONTENIDO}/redirecciones.json`,
    ver: "/",
    esquema: g("", "Redirecciones", [
      lista(
        "redirecciones",
        "Redirecciones",
        g("", "Redirección", [
          t("desde", "Desde", {
            medio: true,
            patron: "^/[^\\s]*$",
            mensajePatron: "Una ruta de esta web que empiece por /.",
          }),
          enlace("hasta", "Hacia", { requerido: true, medio: true }),
          opciones("codigo", "Tipo", [
            ["301", "Permanente (301)"],
            ["302", "Temporal (302)"],
          ]),
        ]),
        {
          titulo: "desde",
          max: 100,
          ayuda:
            "Se aplican en Cloudflare. Al cambiar la dirección de un artículo se crea una sola.",
          etiquetaNuevo: "Añadir redirección",
        },
      ),
    ]),
  },
];

export const seccionPorId = (id: string) => secciones.find((s) => s.id === id);
export const seccionPorArchivo = (ruta: string) =>
  secciones.find((s) => s.archivo === ruta);

export const esquemaArticulo = g("", "Artículo", [
  t("titulo", "Título", { max: 120 }),
  t("slug", "Dirección", {
    max: 80,
    patron: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    mensajePatron: "Solo minúsculas sin tildes, números y guiones.",
  }),
  tl("descripcion", "Descripción", {
    max: 220,
    filas: 2,
    ayuda: "Resumen para el listado y para Google. Ideal: 120-160 caracteres.",
  }),
  fecha("fecha", "Fecha de publicación", { requerido: true, medio: true }),
  fecha("actualizado", "Última actualización", { medio: true }),
  si("publicado", "Publicado"),
  imagen("imagen", "Imagen de portada"),
  t("imagenAlt", "Texto alternativo de la portada", { requerido: false, max: 200 }),
]);
