import type { ReactNode } from "react";
import Image from "next/image";
import { AnalyticsConsent } from "./analytics-consent";
import { Grainient } from "./grainient";
import { Motion } from "./motion";
import { Header } from "./header";
import { Footer } from "./footer";
import { WhatsApp } from "./whatsapp";
import { mantenimiento, sitio } from "@/data/sitio";
import { interfaz } from "@/data/interfaz";

// Envoltorio común de la web pública: lo usan el layout de (sitio) y la
// página 404, que se renderiza fuera de ese layout.
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Crema base, ocre de acento y rosa del titular, todos claros: el
          texto tinta conserva el contraste encima. */}
      <div className="site-background" aria-hidden="true">
        <Grainient
          color1="#fdf9ef"
          color2="#ead3ae"
          color3="#ecc9bd"
          timeSpeed={0.18}
          contrast={1}
          grainAmount={0.05}
        />
      </div>
      <a href="#contenido" className="skip-link">
        {interfaz.saltar}
      </a>
      {mantenimiento.activo ? (
        // Modo mantenimiento, activable desde /admin → Ajustes.
        <main id="contenido" className="maintenance">
          <div className="container narrow">
            <Image
              src="/logo-marca.png"
              alt={interfaz.logoAlt}
              width={86}
              height={86}
              priority
            />
            <h1>{mantenimiento.titulo}</h1>
            <p className="lead intro-copy">{mantenimiento.texto}</p>
            <div className="hero-actions">
              <WhatsApp />
              <a className="text-link" href={`mailto:${sitio.email}`}>
                {sitio.email}
              </a>
            </div>
          </div>
        </main>
      ) : (
        <>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
          <WhatsApp floating />
        </>
      )}
      <AnalyticsConsent />
      <Motion />
    </>
  );
}
