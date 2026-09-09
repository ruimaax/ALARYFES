import { sitio } from "@/data/sitio";
import { PageIntro, ContactCta } from "@/components/content";
import { meta } from "@/lib/seo";
export const metadata = meta(
  "Sobre nosotros",
  sitio.sobre.intro,
  "/sobre-nosotros",
);
export default function SobrePage() {
  return (
    <>
      <PageIntro
        title={sitio.sobre.titulo}
        description={sitio.sobre.intro}
        path="/sobre-nosotros"
        label="Sobre nosotros"
        dark
      />
      <section className="section">
        <div className="container">
          <p className="about-intro">{sitio.sobre.texto}</p>
          <div className="values-grid">
            {sitio.sobre.valores.map((v) => (
              <article key={v.titulo}>
                <h2>{v.titulo}</h2>
                <p>{v.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
