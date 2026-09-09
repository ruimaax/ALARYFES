import type { Metadata } from "next";
import { Faustina, Source_Sans_3 } from "next/font/google";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { Motion } from "@/components/motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsApp } from "@/components/whatsapp";
import { sitio } from "@/data/sitio";
import "./globals.css";
const serif = Faustina({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});
const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(sitio.url),
  title: {
    default: "ALARYFES — Web, Google y redes para tu negocio",
    template: "%s | ALARYFES",
  },
  description: sitio.descripcion,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: sitio.nombre,
    title: "ALARYFES — Tu presencia digital, bien construida",
    description: sitio.descripcion,
  },
  twitter: { card: "summary" },
  icons: { icon: "/logo.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido">{children}</main>
        <Footer />
        <WhatsApp floating />
        <AnalyticsConsent />
        <Motion />
      </body>
    </html>
  );
}
