import Link from "next/link";
import { LaunchNotice } from "@/components/launch-notice";
import { sitio } from "@/data/sitio";
import { planes, preciosDe, euros } from "@/data/planes";
import { WhatsApp } from "@/components/whatsapp";
import { PlanShowcase } from "@/components/plan-showcase";
import { ContactForm } from "@/components/contact-form";
import { JsonLd, meta } from "@/lib/seo";
import { Pattern } from "@/components/architecture";
export const metadata = meta(
  "Web, Google y redes para tu negocio",
  sitio.descripcion,
  "/",
);
export default function Home() {
  const now = new Date();
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="hero-location">
            <span />
            {sitio.hero.contexto}
          </p>
          <h1>
            {sitio.hero.titulo}
            <em>{sitio.hero.remate}</em>
          </h1>
          <p className="hero-description">{sitio.descripcion}</p>
          <div className="hero-actions">
            <WhatsApp />
            <Link className="button button-outline" href="/planes">
              {sitio.acciones.planes}
            </Link>
          </div>
          <div className="hero-base">
            <p>{sitio.hero.pie}</p>
            <p>
              {sitio.hero.precio}{" "}
              <strong>
                {euros(preciosDe(planes[0], now).mensual)}
                {sitio.hero.unidad}
              </strong>{" "}
              {sitio.hero.alta}
              <span>{sitio.hero.impuesto}</span>
            </p>
            <p>{sitio.hero.sello}</p>
          </div>
        </div>
        <Pattern className="hero-pattern" />
      </section>
      <section className="section problem">
        <div className="container split">
          <h2>{sitio.problema.titulo}</h2>
          <div>
            <p className="lead">{sitio.problema.texto}</p>
            <p className="closing">{sitio.problema.cierre}</p>
          </div>
        </div>
      </section>
      <section className="section dark-section plans-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">{sitio.planes.kicker}</p>
            <h2>{sitio.planes.titulo}</h2>
            <p>{sitio.planes.texto}</p>
          </div>
          <PlanShowcase initialDate={now.toISOString()} />
          <div className="center">
            <Link href="/planes" className="button button-outline">
              {sitio.acciones.comparar}
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <h2>{sitio.proceso.titulo}</h2>
            <p>{sitio.proceso.texto}</p>
          </div>
          <div className="steps">
            {sitio.proceso.pasos.map((paso, i) => (
              <article key={paso.titulo}>
                <span className="step-number">0{i + 1}</span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <LaunchNotice initialDate={now.toISOString()} />
      <section className="section contact-section">
        <div className="container split">
          <h2>{sitio.contacto.titulo}</h2>
          <div>
            <p className="lead">{sitio.contacto.texto}</p>
            <div className="hero-actions">
              <WhatsApp />
              <Link className="text-link" href="/contacto">
                {sitio.acciones.formulario}
              </Link>
            </div>
          </div>
        </div>
        <div className="container home-contact-form">
          <div className="split">
            <div>
              <p className="intro-copy">{sitio.contacto.local}</p>
              <a className="text-link" href={`mailto:${sitio.email}`}>
                {sitio.email}
              </a>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
      <JsonLd
        data={{
          "@type": "LocalBusiness",
          name: sitio.nombre,
          description: sitio.descripcion,
          url: sitio.url,
          telephone: `+${sitio.whatsapp}`,
          email: sitio.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: sitio.direccion,
            addressLocality: sitio.localidad,
            addressCountry: "ES",
          },
          areaServed: ["Ceuta", "Andalucía"],
        }}
      />
    </>
  );
}
