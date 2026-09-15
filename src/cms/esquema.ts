/**
 * Esquemas del CMS. Cada archivo de src/content/ se describe con campos: /admin
 * pinta el formulario a partir de ellos y el servidor valida con los mismos
 * antes de guardar, así un texto mal puesto nunca llega a romper la web.
 */
type Base = {
  clave: string;
  etiqueta: string;
  ayuda?: string;
  requerido?: boolean;
  /** Se muestra, pero no se puede cambiar (p. ej. el identificador de un plan). */
  soloLectura?: boolean;
  /** Campos cortos que caben de dos en dos. */
  medio?: boolean;
  /** Subtítulo que se pinta antes del campo para ordenar formularios largos. */
  apartado?: string;
};
export type CampoTexto = Base & {
  tipo: "texto" | "textoLargo";
  max?: number;
  filas?: number;
  patron?: string;
  mensajePatron?: string;
  /** Admite marcadores como {titular} o {email}. */
  marcadores?: boolean;
};
export type CampoEnlace = Base & { tipo: "enlace" };
export type CampoEmail = Base & { tipo: "email" };
export type CampoNumero = Base & {
  tipo: "numero";
  min?: number;
  max?: number;
  entero?: boolean;
  sufijo?: string;
};
export type CampoBooleano = Base & { tipo: "booleano" };
export type CampoSeleccion = Base & {
  tipo: "seleccion";
  opciones: { valor: string; etiqueta: string }[];
};
export type CampoFecha = Base & { tipo: "fecha" };
export type CampoImagen = Base & { tipo: "imagen" };
export type CampoGrupo = Base & {
  tipo: "grupo";
  campos: Campo[];
  plegado?: boolean;
};
export type CampoLista = Base & {
  tipo: "lista";
  elemento: Campo;
  min?: number;
  max?: number;
  /** Ni se añaden ni se quitan ni se reordenan elementos. */
  fija?: boolean;
  /** Clave del elemento que se usa como título en la lista plegada. */
  titulo?: string;
  etiquetaNuevo?: string;
};
export type CampoFila = Base & { tipo: "fila"; columnas: string[] };
export type Campo =
  | CampoTexto
  | CampoEnlace
  | CampoEmail
  | CampoNumero
  | CampoBooleano
  | CampoSeleccion
  | CampoFecha
  | CampoImagen
  | CampoGrupo
  | CampoLista
  | CampoFila;

export type Errores = Record<string, string>;

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const PATRON_ENLACE =
  /^(\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d\s]+|#[\w-]*)$/;
export const PATRON_IMAGEN =
  /^(\/media\/[a-z0-9][a-z0-9._-]*\.(webp|jpe?g|png|avif|gif)|https:\/\/\S+)$/;
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const fechaValida = (v: string) =>
  PATRON_FECHA.test(v) &&
  !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
  new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

/**
 * Valida `valor` contra `campo` y devuelve la versión limpia. `anterior` es lo
 * que hay guardado: de ahí salen los campos de solo lectura y cualquier clave
 * que el esquema no describa, que se conserva tal cual.
 */
export function validar(
  campo: Campo,
  valor: unknown,
  anterior: unknown,
  ruta: string,
  errores: Errores,
): unknown {
  if (campo.soloLectura && anterior !== undefined) return anterior;
  const fallo = (mensaje: string, devolver: unknown = anterior ?? valor) => {
    errores[ruta] = mensaje;
    return devolver;
  };
  switch (campo.tipo) {
    case "texto":
    case "textoLargo": {
      if (typeof valor !== "string") return fallo("Debe ser texto.", "");
      const limpio = valor.replace(/\r\n?/g, "\n").trim();
      if (campo.requerido && !limpio) return fallo("Es obligatorio.", limpio);
      if (campo.max && limpio.length > campo.max)
        return fallo(
          `Máximo ${campo.max} caracteres (tiene ${limpio.length}).`,
          limpio,
        );
      if (campo.patron && limpio && !new RegExp(campo.patron).test(limpio))
        return fallo(campo.mensajePatron || "Formato no válido.", limpio);
      return limpio;
    }
    case "enlace":
    case "email":
    case "imagen":
    case "fecha": {
      if (typeof valor !== "string") return fallo("Debe ser texto.", "");
      const limpio = valor.trim();
      if (!limpio)
        return campo.requerido ? fallo("Es obligatorio.", limpio) : limpio;
      if (campo.tipo === "enlace" && !PATRON_ENLACE.test(limpio))
        return fallo(
          "Usa una ruta de la web (/planes) o una dirección completa (https://…).",
          limpio,
        );
      if (campo.tipo === "email" && !PATRON_EMAIL.test(limpio))
        return fallo("Escribe un email válido.", limpio);
      if (campo.tipo === "imagen" && !PATRON_IMAGEN.test(limpio))
        return fallo("Elige una imagen de la biblioteca de medios.", limpio);
      if (campo.tipo === "fecha" && !fechaValida(limpio))
        return fallo("Fecha no válida.", limpio);
      return limpio;
    }
    case "numero": {
      if (typeof valor !== "number" || !Number.isFinite(valor))
        return fallo("Debe ser un número.", 0);
      if (campo.entero && !Number.isInteger(valor))
        return fallo("Debe ser un número entero.", valor);
      if (campo.min !== undefined && valor < campo.min)
        return fallo(`El mínimo es ${campo.min}.`, valor);
      if (campo.max !== undefined && valor > campo.max)
        return fallo(`El máximo es ${campo.max}.`, valor);
      return valor;
    }
    case "booleano":
      return typeof valor === "boolean" ? valor : fallo("Debe ser sí o no.", false);
    case "seleccion":
      return campo.opciones.some((o) => o.valor === valor)
        ? valor
        : fallo("Elige una de las opciones.", campo.opciones[0]?.valor ?? "");
    case "fila": {
      if (
        !Array.isArray(valor) ||
        valor.length !== campo.columnas.length ||
        valor.some((v) => typeof v !== "string")
      )
        return fallo(`Debe tener ${campo.columnas.length} columnas.`);
      const limpio = valor.map((v: string) => v.trim());
      if (campo.requerido && limpio.some((v) => !v))
        return fallo("Rellena todas las columnas.", limpio);
      return limpio;
    }
    case "grupo": {
      if (!esObjeto(valor)) return fallo("Formato no válido.");
      const previo = esObjeto(anterior) ? anterior : {};
      const salida: Record<string, unknown> = {};
      const campos = new Map(campo.campos.map((c) => [c.clave, c]));
      // Se respeta el orden del archivo para que el historial muestre solo
      // lo que ha cambiado de verdad.
      for (const clave of Object.keys(previo)) {
        const hijo = campos.get(clave);
        salida[clave] = hijo
          ? validar(hijo, valor[clave], previo[clave], `${ruta}.${clave}`, errores)
          : previo[clave];
      }
      for (const hijo of campo.campos)
        if (!(hijo.clave in salida))
          salida[hijo.clave] = validar(
            hijo,
            valor[hijo.clave] ?? valorInicial(hijo),
            undefined,
            `${ruta}.${hijo.clave}`,
            errores,
          );
      return salida;
    }
    case "lista": {
      if (!Array.isArray(valor)) return fallo("Debe ser una lista.", []);
      const previo = Array.isArray(anterior) ? anterior : [];
      if (campo.fija && Array.isArray(anterior) && valor.length !== previo.length)
        return fallo("En esta lista no se pueden añadir ni quitar elementos.");
      if (campo.min !== undefined && valor.length < campo.min)
        errores[ruta] = `Necesita al menos ${campo.min}.`;
      if (campo.max !== undefined && valor.length > campo.max)
        errores[ruta] = `Admite como máximo ${campo.max}.`;
      return valor.map((v, i) =>
        validar(campo.elemento, v, previo[i], `${ruta}.${i}`, errores),
      );
    }
  }
}

export function valorInicial(campo: Campo): unknown {
  switch (campo.tipo) {
    case "numero":
      return campo.min && campo.min > 0 ? campo.min : 0;
    case "booleano":
      return false;
    case "seleccion":
      return campo.opciones[0]?.valor ?? "";
    case "fila":
      return campo.columnas.map(() => "");
    case "lista":
      return [];
    case "grupo":
      return Object.fromEntries(
        campo.campos.map((c) => [c.clave, valorInicial(c)]),
      );
    default:
      return "";
  }
}

/** Valida un archivo completo. La ruta raíz no aparece en los errores. */
export function validarDocumento(
  esquema: CampoGrupo,
  valor: unknown,
  anterior: unknown,
) {
  const errores: Errores = {};
  const bruto = validar(esquema, valor, anterior, "", errores);
  const limpios: Errores = {};
  for (const [ruta, mensaje] of Object.entries(errores))
    limpios[ruta.replace(/^\./, "")] = mensaje;
  return { datos: bruto, errores: limpios, ok: !Object.keys(limpios).length };
}
