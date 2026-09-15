import Link from "next/link";
import { servicios, tablaTextos } from "@/data/servicios";
import { extras } from "@/data/extras";
import { sitio } from "@/data/sitio";
import { PageIntro, ResponsiveTable, ContactCta } from "@/components/content";
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
      <section className="section surface-section">
        <div className="container">
          <h2>{sitio.planes.extras}</h2>
          <ResponsiveTable
            caption={sitio.planes.extras}
            headers={[tablaTextos.concepto, tablaTextos.precio]}
            rows={extras.map((e) => [e.concepto, tablaTextos.consultar])}
          />
          <p className="table-note">{sitio.planes.extrasNota}</p>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
