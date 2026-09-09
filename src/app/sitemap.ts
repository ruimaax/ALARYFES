import type { MetadataRoute } from "next";
import { sitio } from "@/data/sitio";
import { planes } from "@/data/planes";
import { sectores } from "@/data/sectores";
import { articulosPublicados } from "@/data/blog";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/planes",
    ...planes.map((p) => `/planes/${p.slug}`),
    "/servicios",
    "/sectores",
    ...sectores.map((s) => `/sectores/${s.slug}`),
    "/casos",
    "/sobre-nosotros",
    "/recomienda",
    "/blog",
    ...articulosPublicados().map((a) => `/blog/${a.slug}`),
    "/contacto",
    ...sitio.legales.map((l) => l.href),
  ].map((route) => ({
    url: `${sitio.url}${route}`,
    changeFrequency: route === "/blog" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/planes") ? 0.9 : 0.6,
  }));
}
