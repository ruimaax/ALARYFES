import Link from "next/link";
import { servicios } from "@/data/servicios";
import { PageIntro } from "@/components/content";
import { meta } from "@/lib/seo";
export const metadata = meta("Servicios", servicios.descripcion, "/servicios");
export default function ServiciosPage() {
  return (
    <>
      <PageIntro
        title={servicios.titulo}
        description={servicios.descripcion}
        path="/servicios"
        label="Servicios"
        dark
      />
      <section className="section">
        <div className="container discipline-grid">
          {servicios.disciplinas.map((s, i) => (
            <article key={s.nombre}>
              <span className="discipline-mark" aria-hidden="true">
                {["◇", "⊕", "✳", "◎", "✧", "⊞"][i]}
              </span>
              <h2>{s.nombre}</h2>
              <p>{s.texto}</p>
              <Link className="text-link" href={`/planes/${s.slug}`}>
                {s.desde}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
