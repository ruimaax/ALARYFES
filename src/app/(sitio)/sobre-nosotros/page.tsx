import type { CSSProperties } from "react";
import Link from "next/link";
import { sitio } from "@/data/sitio";
import { PageIntro } from "@/components/content";
import { InkText } from "@/components/ink-text";
import { StarBorder } from "@/components/star-border";
import { meta } from "@/lib/seo";
export const metadata = meta(
  "Sobre nosotros",
  sitio.sobre.intro,
  "/sobre-nosotros",
);

// De dónde viene el nombre, en tres tiempos.
const etimologia = [
  { termino: "al-‘arīf", lengua: "Árabe andalusí", sentido: "El entendido, el que sabe." },
  { termino: "alarife", lengua: "Castellano", sentido: "Maestro de obras: el que levanta la obra." },
  { termino: "ALARYFES", lengua: "Hoy", sentido: "Un estudio que construye presencia digital." },
];

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
      <section className="section about-studio">
        <div className="container about-studio-inner">
          <div className="about-story">
            <p className="about-kicker">Granada · Córdoba · cualquier lugar</p>
            <InkText className="about-intro" text={sitio.sobre.texto} />
            <div className="about-route" aria-hidden="true">
              <div className="about-route-city">
                <strong>GRX</strong>
                <span>Base operativa</span>
              </div>
              <div className="about-route-line">
                <i />
              </div>
              <div className="about-route-city">
                <strong>COR</strong>
                <span>Raíces</span>
              </div>
            </div>
          </div>

          <div className="about-etymology">
            <p className="about-kicker">De dónde viene el nombre</p>
            <ol>
              {etimologia.map((e, i) => (
                <li key={e.termino} style={{ "--step": i } as CSSProperties}>
                  <span className="about-etymology-lang">{e.lengua}</span>
                  <strong lang={i === 0 ? "ar-Latn" : undefined}>{e.termino}</strong>
                  <span className="about-etymology-sense">{e.sentido}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="about-manifesto">
            <div className="about-manifesto-heading">
              <p>Nuestra forma de trabajar</p>
              <h2>Tres principios. Ningún artificio.</h2>
            </div>
            <div className="about-principles">
              {sitio.sobre.valores.map((v, index) => (
                <article
                  key={v.titulo}
                  style={{ "--card": index } as CSSProperties}
                >
                  <span className="about-value-number" aria-hidden="true">
                    0{index + 1}
                    <small>/0{sitio.sobre.valores.length}</small>
                  </span>
                  <h3>{v.titulo}</h3>
                  <p>{v.texto}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="about-cta">
            <h2>¿Levantamos tu obra?</h2>
            <div className="about-cta-actions">
              <StarBorder as={Link} href="/contacto" className="button button-gold">
                {sitio.acciones.contacto}
              </StarBorder>
              <Link className="text-link" href="/planes">
                {sitio.acciones.planes}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
