import { interfaz } from "@/data/interfaz";
import {
  PageIntro,
  ResponsiveTable,
  Faq,
  ContactCta,
} from "@/components/content";
import { PlanShowcase } from "@/components/plan-showcase";
import { sitio } from "@/data/sitio";
import { planes, preciosDe } from "@/data/planes";
import { extras } from "@/data/extras";
import { condiciones } from "@/data/cambios";
import { comparativa, tablaTextos } from "@/data/servicios";
import { JsonLd, meta } from "@/lib/seo";
export const metadata = meta("Planes y precios", sitio.planes.texto, "/planes");
export default function PlanesPage() {
  const now = new Date();
  return (
    <>
      <PageIntro
        title={sitio.planes.titulo}
        description={sitio.planes.texto}
        path="/planes"
        label="Planes"
        dark
      >
        <PlanShowcase initialDate={now.toISOString()} detailed />
      </PageIntro>
      <section className="section">
        <div className="container">
          <h2>{sitio.planes.comparativa}</h2>
          <ResponsiveTable
            caption={sitio.planes.comparativa}
            headers={[tablaTextos.disciplina, ...planes.map((p) => p.nombre)]}
            rows={comparativa.map((row) => [row.disciplina, ...row.valores])}
            className="comparison-table"
          />
          <p className="table-note">{sitio.planes.fiscal}</p>
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
      <section id="condiciones" className="section conditions-section">
        <div className="container split">
          <h2>{sitio.planes.condiciones}</h2>
          <ul className="conditions-list">
            {condiciones.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
      <Faq />
      <ContactCta />
      <JsonLd
        data={{
          "@type": "Service",
          name: interfaz.servicio,
          provider: {
            "@type": "LocalBusiness",
            name: sitio.nombre,
            url: sitio.url,
          },
          areaServed: sitio.area,
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Planes",
            itemListElement: planes.map((p) => ({
              "@type": "Offer",
              priceCurrency: "EUR",
              price: preciosDe(p, now).mensual,
              description: `${p.descriptor}. ${interfaz.oferta}`,
              url: `${sitio.url}/planes/${p.slug}`,
              itemOffered: { "@type": "Service", name: p.nombre },
            })),
          },
        }}
      />
    </>
  );
}
