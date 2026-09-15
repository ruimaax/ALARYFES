import type { MetadataRoute } from "next";
import { seo, sitio } from "@/data/sitio";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    // «Permitir que Google indexe la web» se cambia en /admin → Ajustes.
    rules: seo.indexar
      ? { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${sitio.url}/sitemap.xml`,
  };
}
