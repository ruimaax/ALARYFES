// Cliente de /api/admin. Si la sesión caduca, lleva a la pantalla de acceso y
// después devuelve a la página donde estabas.
export class ErrorPanel extends Error {
  constructor(
    mensaje: string,
    public estado: number,
    public datos: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }
}

type Opciones = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
};

export async function api<T = Record<string, unknown>>(
  ruta: string,
  { metodo = "GET", cuerpo }: Opciones = {},
): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/${ruta}`, {
      method: metodo,
      headers: cuerpo !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ErrorPanel("No hay conexión con el servidor. Comprueba tu conexión.", 0);
  }
  const datos = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>;
  if (respuesta.status === 401 && datos.codigo === "sin-sesion") {
    location.assign(
      `/admin/login?volver=${encodeURIComponent(location.pathname + location.search)}`,
    );
    throw new ErrorPanel(String(datos.mensaje), 401, datos);
  }
  if (!respuesta.ok)
    throw new ErrorPanel(
      typeof datos.mensaje === "string" ? datos.mensaje : `Error ${respuesta.status}`,
      respuesta.status,
      datos,
    );
  return datos as T;
}

export const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : "Error inesperado.";
