import type { ReactNode } from "react";
import { faq } from "@/data/faq";
import { sitio } from "@/data/sitio";
import { Breadcrumbs, JsonLd } from "@/lib/seo";
import { WhatsApp } from "./whatsapp";
export function PageIntro({
  title,
  description,
  path,
  label,
  dark = false,
  children,
}: {
  title: string;
  description: string;
  path: string;
  label?: string;
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`page-intro ${dark ? "dark-section" : ""}`}>
      <div className="container">
        <Breadcrumbs items={[{ label: label || title, href: path }]} />
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        {children}
      </div>
    </section>
  );
}
export function Faq() {
  return (
    <section className="section faq-section" id="preguntas">
      <div className="container split">
        <div>
          <h2>{sitio.faq.titulo}</h2>
          <p className="intro-copy">{sitio.faq.texto}</p>
        </div>
        <div className="faq-list">
          {faq.map((item) => (
            <details key={item.pregunta}>
              <summary>
                {item.pregunta}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd
        data={{
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.pregunta,
            acceptedAnswer: { "@type": "Answer", text: item.respuesta },
          })),
        }}
      />
    </section>
  );
}
export function ContactCta() {
  return (
    <section className="section contact-section">
      <div className="container split">
        <h2>{sitio.contacto.titulo}</h2>
        <div>
          <p className="lead">{sitio.contacto.texto}</p>
          <div className="hero-actions">
            <WhatsApp />
          </div>
        </div>
      </div>
    </section>
  );
}
export function ResponsiveTable({
  caption,
  headers,
  rows,
  className = "",
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <table className={`responsive-table ${className}`}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th scope="col" key={h}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) =>
              j === 0 ? (
                <th scope="row" key={j}>
                  {cell}
                </th>
              ) : (
                <td key={j}>
                  <span className="mobile-cell-label" aria-hidden="true">
                    {headers[j]}
                  </span>
                  <span>{cell}</span>
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
