import type { CSSProperties } from "react";
import { sitio } from "@/data/sitio";
import { PageIntro } from "@/components/content";
import { ContactForm } from "@/components/contact-form";
import { ContactChannels } from "@/components/contact-channels";
import { meta } from "@/lib/seo";
export const metadata = meta("Contacto", sitio.contacto.texto, "/contacto");

// Lo que ocurre después de escribirnos.
const pasos = [
  { titulo: "Nos cuentas tu negocio", texto: "Por el formulario, WhatsApp o teléfono." },
  { titulo: "Agendamos una reunión", texto: "Para entender qué tienes y qué necesitas." },
  { titulo: "Te proponemos un plan", texto: "Por dónde empezar, qué incluye y cuánto cuesta." },
];

export default function ContactoPage() {
  return (
    <>
      <PageIntro
        title={sitio.contacto.titulo}
        description={sitio.contacto.texto}
        path="/contacto"
        label="Contacto"
      />
      <section className="section contact-page">
        <div className="container contact-page-layout">
          <aside className="contact-aside">
            <ContactChannels />
            <div className="contact-next">
              <p className="contact-next-kicker">Qué pasa después</p>
              <ol>
                {pasos.map((p, i) => (
                  <li key={p.titulo} style={{ "--n": i } as CSSProperties}>
                    <span aria-hidden="true">0{i + 1}</span>
                    <div>
                      <strong>{p.titulo}</strong>
                      <p>{p.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <p className="contact-place">
              {sitio.contacto.local}
              <span>{sitio.direccion}</span>
            </p>
          </aside>
          <div className="contact-form-panel">
            <div className="contact-form-panel-heading">
              <span>Tu proyecto</span>
              <span aria-hidden="true">✦</span>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
