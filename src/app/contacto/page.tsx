import { sitio } from "@/data/sitio";
import { PageIntro } from "@/components/content";
import { ContactForm } from "@/components/contact-form";
import { WhatsApp } from "@/components/whatsapp";
import { meta } from "@/lib/seo";
export const metadata = meta("Contacto", sitio.contacto.texto, "/contacto");
export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return (
    <>
      <PageIntro
        title={sitio.contacto.titulo}
        description={sitio.contacto.texto}
        path="/contacto"
        label="Contacto"
      />
      <section className="section contact-page">
        <div className="container split">
          <div className="contact-details">
            <WhatsApp />
            <a className="text-link" href={`mailto:${sitio.email}`}>
              {sitio.email}
            </a>
            <a className="text-link" href={`tel:+${sitio.whatsapp}`}>
              {sitio.acciones.llamar}: {sitio.telefonoVisible}
            </a>
            <p>{sitio.contacto.local}</p>
            <p className="muted">{sitio.direccion}</p>
          </div>
          <ContactForm selectedPlan={plan} />
        </div>
      </section>
    </>
  );
}
