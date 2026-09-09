/**
 * Arma la carpeta lista para arrastrar a Cloudflare Pages.
 *
 *   npm run build:cloudflare [-- ruta/de/salida]
 *
 * Deja dentro la web compilada, la función que recibe los formularios y un
 * LEEME con los pasos. Por defecto escribe fuera del repositorio, en
 * ../alaryfes-cloudflare, para que no se mezcle con el código.
 */
import { cp, mkdir, rm, writeFile, readFile, rename, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { build } from "esbuild";

const raiz = path.resolve(import.meta.dirname, "..");
const destino = path.resolve(
  raiz,
  process.argv[2] || path.join("..", "..", "alaryfes-cloudflare"),
);
// Fuera del árbol de la app: dentro, Next compilaría igualmente la carpeta.
const refugio = path.join(raiz, ".apartado-del-export");
const apartar = [
  // La ruta de API no cabe en una web estática: la sustituye la Pages Function.
  path.join(raiz, "src", "app", "api"),
];

const paso = (texto) => console.log(`\n▸ ${texto}`);
const existe = async (ruta) =>
  await access(ruta).then(
    () => true,
    () => false,
  );

// Compilación limpia: los tipos que Next deja de una ejecución anterior
// hablan de rutas que ahora mismo pueden no estar.
await rm(path.join(raiz, ".next"), { recursive: true, force: true });

paso("Comprobando tipos con el proyecto completo");
const tipos = spawnSync("npx", ["tsc", "--noEmit"], {
  cwd: raiz,
  stdio: "inherit",
});
if (tipos.status !== 0) throw new Error("Falló la comprobación de tipos");

// Sin artículos publicados, /blog/[slug] no genera ninguna página y el export
// falla. Se aparta hasta que haya al menos uno; entonces vuelve solo.
const cuenta = spawnSync(
  "npx",
  [
    "tsx",
    "-e",
    'import("./src/data/blog.ts").then((m) => console.log(m.articulosPublicados().length))',
  ],
  { cwd: raiz, encoding: "utf8" },
);
if (Number(cuenta.stdout?.trim()) === 0)
  apartar.push(path.join(raiz, "src", "app", "blog", "[slug]"));

// 1. Se apartan las rutas que no puede haber en una web estática y se
//    devuelven a su sitio pase lo que pase.
paso("Compilando la web como HTML estático");
const apartadas = [];
try {
  await mkdir(refugio, { recursive: true });
  for (const [indice, ruta] of apartar.entries())
    if (await existe(ruta)) {
      const guardada = path.join(refugio, String(indice));
      await rename(ruta, guardada);
      apartadas.push([guardada, ruta]);
    }
  const compilacion = spawnSync("npx", ["next", "build"], {
    cwd: raiz,
    stdio: "inherit",
    env: { ...process.env, CF_STATIC: "1" },
  });
  if (compilacion.status !== 0) throw new Error("Falló next build");
} finally {
  for (const [guardada, ruta] of apartadas) await rename(guardada, ruta);
  await rm(refugio, { recursive: true, force: true });
}

// 2. La carpeta de salida se rehace entera en cada ejecución.
paso(`Preparando ${destino}`);
await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
await cp(path.join(raiz, "out"), destino, { recursive: true });

// 3. La recepción de formularios, empaquetada como Pages Function.
paso("Empaquetando la función de contacto");
await mkdir(path.join(destino, "functions", "api"), { recursive: true });
await build({
  entryPoints: [path.join(raiz, "cloudflare", "contacto.ts")],
  outfile: path.join(destino, "functions", "api", "contacto.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "neutral",
  alias: { "@": path.join(raiz, "src") },
  legalComments: "none",
});

// 4. La función no se entrega sin probarla: se importa y se le habla.
paso("Probando la función de contacto");
const { onRequestPost } = await import(
  path.join(destino, "functions", "api", "contacto.js")
);
const llamar = (cuerpo, env = {}, cabeceras = {}) =>
  onRequestPost({
    env,
    request: new Request("https://alaryfes.com/api/contacto", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabeceras },
      body: JSON.stringify(cuerpo),
    }),
  });
const valido = {
  tipo: "contacto",
  nombre: "Comprobación de compilación",
  negocio: "Comprobación",
  telefono: "600000000",
  sector: "barberias",
  mensaje: "Prueba local del empaquetado. No se envía a ningún sitio.",
  consentimiento: true,
};
const sinEndpoint = await llamar(valido);
const sinConsentimiento = await llamar({ ...valido, consentimiento: false });
const conTrampa = await llamar({ ...valido, website: "soy un robot" });
const conEndpoint = await llamar(valido, {
  CONTACT_WEBHOOK_URL: "https://ejemplo.invalido/hoja",
});
if (
  sinEndpoint.status !== 202 ||
  sinConsentimiento.status !== 422 ||
  conTrampa.status !== 200 ||
  conEndpoint.status !== 502
)
  throw new Error(
    `La función de contacto no responde como debe: ${sinEndpoint.status}/${sinConsentimiento.status}/${conTrampa.status}/${conEndpoint.status}`,
  );

// 5. Cabeceras: seguridad para todo y caché larga solo para lo versionado.
await writeFile(
  path.join(destino, "_headers"),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`,
);

const leeme = await readFile(
  path.join(raiz, "cloudflare", "LEEME-cloudflare.md"),
  "utf8",
);
await writeFile(path.join(destino, "LEEME.md"), leeme);

paso(`Listo: ${destino}`);
console.log("   Súbela entera en Cloudflare Pages → Upload assets.\n");
