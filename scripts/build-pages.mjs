/** Genera `out/` para un proyecto de Cloudflare Pages conectado a Git. */
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const refugio = path.join(raiz, ".apartado-del-export");
const salida = path.join(raiz, "out");
const existe = (ruta) => access(ruta).then(() => true, () => false);
const paso = (texto) => console.log(`\n▸ ${texto}`);
const ejecutar = (orden, argumentos, env = process.env) => {
  const resultado = spawnSync(orden, argumentos, { cwd: raiz, env, stdio: "inherit" });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) throw new Error(`Falló ${orden} ${argumentos.join(" ")}`);
};

paso("Comprobando los tipos del proyecto completo");
ejecutar("npx", ["tsc", "--noEmit"]);

const blog = JSON.parse(await readFile(path.join(raiz, "src/content/blog.json"), "utf8"));
const hoy = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());
const hayPublicados = blog.articulos.some((a) => a.publicado && a.fecha <= hoy);
const apartar = [path.join(raiz, "src/app/api")];
if (!hayPublicados) apartar.push(path.join(raiz, "src/app/(sitio)/blog/[slug]"));

if (await existe(refugio))
  throw new Error(
    `Existe ${refugio}. Puede contener rutas recuperables de una compilación interrumpida; revísala antes de volver a ejecutar.`,
  );

const apartadas = [];
try {
  await mkdir(refugio);
  for (const [indice, origen] of apartar.entries()) {
    if (!(await existe(origen))) continue;
    const guardada = path.join(refugio, String(indice));
    await rename(origen, guardada);
    apartadas.push([guardada, origen]);
  }
  paso("Compilando la web como exportación estática");
  ejecutar("npx", ["next", "build"], { ...process.env, CF_STATIC: "1" });
} finally {
  for (const [guardada, origen] of apartadas.reverse()) {
    await mkdir(path.dirname(origen), { recursive: true });
    await rename(guardada, origen);
  }
  await rm(refugio, { recursive: true, force: true });
}

const redirecciones = JSON.parse(
  await readFile(path.join(raiz, "src/content/redirecciones.json"), "utf8"),
).redirecciones;
await writeFile(
  path.join(salida, "_redirects"),
  redirecciones.map((r) => `${r.desde} ${r.hasta} ${r.codigo}`).join("\n") + (redirecciones.length ? "\n" : ""),
);
await writeFile(
  path.join(salida, "_headers"),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/admin/*
  X-Robots-Tag: noindex
`,
);

paso("Salida preparada en out/");

