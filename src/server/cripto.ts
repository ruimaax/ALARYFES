// Criptografía del panel con Web Crypto: funciona igual en Cloudflare y en Node.
const codificador = new TextEncoder();
export type Bytes = Uint8Array<ArrayBuffer>;

export const bytesDe = (valor: string | Bytes): Bytes =>
  typeof valor === "string" ? codificador.encode(valor) : valor;

export const aHex = (datos: ArrayBuffer | Bytes) =>
  Array.from(new Uint8Array(datos), (b) => b.toString(16).padStart(2, "0")).join("");

export function aBase64(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}
export function deBase64(texto: string): Bytes {
  const binario = atob(texto.replace(/\s/g, ""));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}
export const aBase64Url = (bytes: Uint8Array) =>
  aBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const aleatorio = (n = 32): Bytes => crypto.getRandomValues(new Uint8Array(n));
export const tokenAleatorio = (n = 32) => aBase64Url(aleatorio(n));

export const sha256Hex = async (valor: string | Bytes) =>
  aHex(await crypto.subtle.digest("SHA-256", bytesDe(valor)));

/** El identificador que Git da a un archivo: sirve para detectar conflictos. */
export async function shaGit(bytes: Bytes) {
  const cabecera = codificador.encode(`blob ${bytes.length}\0`);
  const todo = new Uint8Array(cabecera.length + bytes.length);
  todo.set(cabecera);
  todo.set(bytes, cabecera.length);
  return aHex(await crypto.subtle.digest("SHA-1", todo));
}

/** Comparación en tiempo constante para no filtrar información por tiempos. */
export function iguales(a: string, b: string) {
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diferencia |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diferencia === 0;
}

// PBKDF2 con 100 000 iteraciones: es el máximo que admite Cloudflare Workers.
const ITERACIONES = 100_000;
async function derivar(clave: string, sal: Bytes, iteraciones: number) {
  const llave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(clave.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteraciones },
      llave,
      256,
    ),
  );
}
export async function hashClave(clave: string) {
  const sal = aleatorio(16);
  const hash = await derivar(clave, sal, ITERACIONES);
  return `pbkdf2-sha256$${ITERACIONES}$${aBase64(sal)}$${aBase64(hash)}`;
}
export async function verificarClave(clave: string, guardado: string) {
  const [algoritmo, iteraciones, sal, hash] = guardado.split("$");
  if (algoritmo !== "pbkdf2-sha256" || !sal || !hash) return false;
  const calculado = await derivar(clave, deBase64(sal), Number(iteraciones));
  return iguales(aBase64(calculado), hash);
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function aBase32(bytes: Uint8Array) {
  let bits = 0,
    valor = 0,
    salida = "";
  for (const byte of bytes) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      salida += BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) salida += BASE32[(valor << (5 - bits)) & 31];
  return salida;
}
export function deBase32(texto: string): Bytes {
  const limpio = texto.toUpperCase().replace(/[\s=]/g, "");
  const salida: number[] = [];
  let bits = 0,
    valor = 0;
  for (const letra of limpio) {
    const indice = BASE32.indexOf(letra);
    if (indice < 0) throw new Error("Clave base32 no válida");
    valor = (valor << 5) | indice;
    bits += 5;
    if (bits >= 8) {
      salida.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(salida);
}

// Verificación en dos pasos (TOTP, RFC 6238): la que usan Google
// Authenticator, 1Password, Authy y similares.
export const nuevoSecretoTotp = () => aBase32(aleatorio(20));
export async function codigoTotp(secreto: string, paso: number) {
  const llave = await crypto.subtle.importKey(
    "raw",
    deBase32(secreto),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mensaje = new ArrayBuffer(8);
  const vista = new DataView(mensaje);
  vista.setUint32(0, Math.floor(paso / 2 ** 32));
  vista.setUint32(4, paso >>> 0);
  const firma = new Uint8Array(await crypto.subtle.sign("HMAC", llave, mensaje));
  const o = firma[firma.length - 1] & 15;
  const numero =
    ((firma[o] & 127) << 24) | (firma[o + 1] << 16) | (firma[o + 2] << 8) | firma[o + 3];
  return String(numero % 1_000_000).padStart(6, "0");
}
/** Devuelve el paso de tiempo que coincide (para impedir reutilizarlo) o null. */
export async function pasoTotp(secreto: string, codigo: string, ahora = Date.now()) {
  const limpio = codigo.replace(/\s/g, "");
  if (!/^\d{6}$/.test(limpio)) return null;
  const actual = Math.floor(ahora / 30_000);
  for (const desfase of [0, -1, 1])
    if (iguales(await codigoTotp(secreto, actual + desfase), limpio))
      return actual + desfase;
  return null;
}
