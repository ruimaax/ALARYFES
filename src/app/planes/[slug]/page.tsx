import { interfaz } from "@/data/interfaz";
import Link from "next/link";
import { notFound } from "next/navigation";
import { planes, preciosDe, euros } from "@/data/planes";
import { sitio } from "@/data/sitio";
import { politicaCambios } from "@/data/cambios";
import { Architecture } from "@/components/architecture";
import { WhatsApp } from "@/components/whatsapp";
import { Faq, ContactCta } from "@/components/content";
import { Breadcrumbs, JsonLd, meta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plan = planes.find((p) => p.slug === slug);
  return plan
    ? meta(`Plan ${plan.nombre}`, plan.descriptor, `/planes/${slug}`)
    : {};
}
export default async function PlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plan = planes.find((p) => p.slug === slug);
  if (!plan) notFound();
  const prices = preciosDe(plan);
  const inherited = planes.slice(0, planes.indexOf(plan));
  return (
    <>
      <section className="page-intro dark-section plan-detail-hero">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Planes", href: "/planes" },
              { label: plan.nombre, href: `/planes/${slug}` },
            ]}
          />
          <div className="split">
            <div>
              <h1>{plan.nombre}</h1>
              <p className="lead">{plan.descriptor}</p>
              <p className="detail-price">
                {euros(prices.mensual)}
                <span>{sitio.hero.unidad}</span>
              </p>
              <div className="detail-setups">
                <p>
                  {sitio.planes.alta}
                  <strong>{euros(prices.alta3)}</strong>
                  <span>{sitio.planes.tres}</span>
                </p>
                <p>
                  {sitio.planes.alta}
                  <strong>{euros(prices.alta12)}</strong>
                  <span>{sitio.planes.doce}</span>
                </p>
              </div>
              <p className="table-note">{sitio.planes.fiscal}</p>
              <p className="guarantee">{sitio.planes.garantia}</p>
              <div className="hero-actions">
                <WhatsApp />
              </div>
            </div>
            <div className="detail-art">
              <Architecture plan={plan.slug} />
              <p>{plan.bajada}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <div>
            <h2>
              {plan.hereda
                ? `${sitio.planes.herencia} ${planes.find((p) => p.slug === plan.hereda)?.nombre}${sitio.planes.mas}`
                : sitio.planes.incluye}
            </h2>
            <div className="delivery-block">
              <p>{interfaz.plazo}</p>
              <strong>{plan.plazo}</strong>
            </div>
          </div>
          <div>
            <ul className="feature-list">
              {plan.incluye.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {inherited.length > 0 && (
              <details className="inherited">
                <summary>{interfaz.heredado}</summary>
                <p className="table-note">{interfaz.sustituye}</p>
                {inherited.map((p) => (
                  <div key={p.slug}>
                    <h3>{p.nombre}</h3>
                    <ul className="feature-list">
                      {p.incluye.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            )}
          </div>
        </div>
      </section>
      <section className="section surface-section">
        <div className="container split">
          <h2>{sitio.planes.noIncluye}</h2>
          <div>
            <p className="lead">{plan.noIncluye}</p>
            {plan.avisos.map((a) => (
              <p className="notice" key={a}>
                {a}
              </p>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2>{sitio.planes.condiciones}</h2>
          <div className="policy-pair">
            <p>{politicaCambios.bajar}</p>
            <p>{politicaCambios.cancelar}</p>
          </div>
          <Link className="text-link" href="/planes#condiciones">
            {interfaz.condiciones}
          </Link>
        </div>
      </section>
      <Faq />
      <ContactCta />
      <JsonLd
        data={{
          "@type": "Service",
          name: `Plan ${plan.nombre}`,
          description: plan.descriptor,
          provider: {
            "@type": "LocalBusiness",
            name: sitio.nombre,
            url: sitio.url,
          },
          areaServed: sitio.area,
          offers: {
            "@type": "Offer",
            url: `${sitio.url}/planes/${slug}`,
            priceCurrency: "EUR",
            price: prices.mensual,
            description: interfaz.oferta,
          },
        }}
      />
    </>
  );
}
