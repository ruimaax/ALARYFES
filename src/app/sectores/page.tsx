import Link from "next/link";
import { sitio } from "@/data/sitio";
import { sectores } from "@/data/sectores";
import { PageIntro, ContactCta } from "@/components/content";
import { meta } from "@/lib/seo";
export const metadata = meta(
  "Sectores",
  sitio.sectores.texto,
  "/sectores",
);
export default function SectoresPage() {
  return (
    <>
      <PageIntro
        title={sitio.sectores.titulo}
        description={sitio.sectores.texto}
        path="/sectores"
        label="Sectores"
        dark
      />
      <section className="section">
        <div className="container">
          <div className="sector-links">
            {sectores.map((s, i) => (
              <Link
                key={s.slug}
                href={`/sectores/${s.slug}`}
                className="sector-row"
              >
                <span className="sector-symbol" aria-hidden="true">
                  {["✳", "✺", "✧"][i]}
                </span>
                <h2>{s.nombre}</h2>
                <p>{s.breve}</p>
                <span className="sector-plus" aria-hidden="true">
                  +
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
