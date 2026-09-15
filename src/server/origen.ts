/**
 * Valida Origin teniendo en cuenta el Host que conservan Next y los proxies.
 * En desarrollo `request.url` puede contener 0.0.0.0 aunque el navegador use
 * localhost; comparar solo ambas URL rechazaría una petición legítima.
 */
export function origenPermitido(request: Request, permitidos: string[] = []) {
  const origen = request.headers.get("origin");
  if (!origen) return false;
  const url = new URL(request.url);
  if ([url.origin, ...permitidos].includes(origen)) return true;
  let recibido: URL;
  try {
    recibido = new URL(origen);
  } catch {
    return false;
  }
  const protocoloProxy = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocolo = protocoloProxy ? `${protocoloProxy}:` : url.protocol;
  const hosts = [
    request.headers.get("host"),
    request.headers.get("x-forwarded-host")?.split(",")[0].trim(),
  ].filter(Boolean);
  return recibido.protocol === protocolo && hosts.includes(recibido.host);
}
