export const json = (datos: unknown, estado = 200, cabeceras: HeadersInit = {}) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...cabeceras,
    },
  });

/** Error que llega al panel con un mensaje legible. */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public estado = 400,
    public extra: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }
}

export async function leerJson<T = Record<string, unknown>>(
  request: Request,
  maximo = 2_500_000,
): Promise<T> {
  const texto = await request.text();
  if (texto.length > maximo) throw new ErrorApi("El envío es demasiado grande.", 413);
  try {
    const datos = JSON.parse(texto || "{}");
    if (!datos || typeof datos !== "object") throw new Error();
    return datos as T;
  } catch {
    throw new ErrorApi("Formato no válido.", 400);
  }
}

export const texto = (valor: unknown, maximo = 5000) =>
  typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
