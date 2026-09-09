import type { NextConfig } from "next";
// CF_STATIC=1 genera la web como HTML suelto para subir a Cloudflare Pages.
// Sin esa variable el proyecto se comporta como siempre (dev, Vercel, Node).
const estatico = process.env.CF_STATIC === "1";
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(estatico
    ? {
        output: "export",
        images: { unoptimized: true },
        // Durante el export se aparta src/app/api, así que sus tests quedan
        // colgando. El tipado real se comprueba antes, en el propio script.
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
};
export default config;
