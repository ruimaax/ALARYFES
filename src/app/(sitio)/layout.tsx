import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { seo, sitio } from "@/data/sitio";
import "../globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(sitio.url),
  title: {
    default: seo.tituloPorDefecto,
    template: `%s | ${sitio.nombre}`,
  },
  description: sitio.descripcion,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: sitio.nombre,
    title: seo.tituloSocial,
    description: sitio.descripcion,
    ...(seo.imagenSocial ? { images: [{ url: seo.imagenSocial }] } : {}),
  },
  twitter: { card: seo.imagenSocial ? "summary_large_image" : "summary" },
  ...(seo.indexar ? {} : { robots: { index: false, follow: false } }),
  ...(seo.verificacionGoogle
    ? { verification: { google: seo.verificacionGoogle } }
    : {}),
};
export default function SitioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
