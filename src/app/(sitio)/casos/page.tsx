import { sitio } from "@/data/sitio";
import { casosPublicados } from "@/data/casos";
import { PageIntro, ContactCta } from "@/components/content";
import { WhatsApp } from "@/components/whatsapp";
import { Architecture } from "@/components/architecture";
import { meta } from "@/lib/seo";
export const metadata = meta("Casos", sitio.casos.texto, "/casos");
export default function CasosPage() {
  const casos = casosPublicados();
  return (
    <>
      <PageIntro
        title={sitio.casos.titulo}
        description={sitio.casos.texto}
        path="/casos"
        label="Casos"
      />
      {casos.length ? (
        <>
          <section className="section">
            <div className="container case-grid">
              {casos.map((caso) => (
                <article key={`${caso.cliente}-${caso.titulo}`} className="case-card">
                  {caso.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={caso.imagen}
                      alt={caso.imagenAlt || ""}
                      loading="lazy"
                    />
                  )}
                  <p className="eyebrow">
                    {[caso.sector, caso.plan && `Plan ${caso.plan}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <h2>{caso.titulo}</h2>
                  <p className="case-client">{caso.cliente}</p>
                  <p>{caso.resumen}</p>
                  {caso.resultados.length > 0 && (
                    <ul className="feature-list">
                      {caso.resultados.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {caso.testimonio && (
                    <blockquote>
                      <p>«{caso.testimonio}»</p>
                      {caso.autorTestimonio && (
                        <footer>{caso.autorTestimonio}</footer>
                      )}
                    </blockquote>
                  )}
                  {caso.enlace && (
                    <a
                      className="text-link"
                      href={caso.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver su web
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
          <ContactCta />
        </>
      ) : (
        <section className="empty-state container">
          <Architecture plan="cimiento" />
          <WhatsApp label={sitio.casos.cta} />
        </section>
      )}
    </>
  );
}
