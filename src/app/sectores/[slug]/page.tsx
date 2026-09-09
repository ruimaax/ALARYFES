import Link from "next/link";
import { notFound } from "next/navigation";
import { sectores, sectorTextos } from "@/data/sectores";
import { planes, euros, preciosDe } from "@/data/planes";
import { sitio } from "@/data/sitio";
import { PageIntro, ContactCta } from "@/components/content";
import { Architecture } from "@/components/architecture";
import { meta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = sectores.find((s) => s.slug === slug);
  return sector ? meta(sector.nombre, sector.breve, `/sectores/${slug}`) : {};
}
export default async function SectorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = sectores.find((s) => s.slug === slug);
  if (!sector) notFound();
  const plan = planes.find((p) => p.slug === sector.recomendado)!;
  const prices = preciosDe(plan);
  return (
    <>
      <PageIntro
        title={sector.titulo}
        description={sector.problema}
        path={`/sectores/${slug}`}
        label={sector.nombre}
        dark
      >
        <p className="sector-entry-price">
          {plan.nombre} · {euros(prices.mensual)}
          {sitio.hero.unidad}{" "}
          <span>
            {sitio.hero.alta}. {sitio.planes.fiscal}
          </span>
        </p>
        <div className="hero-actions">
          <Link href={`/planes/${plan.slug}`} className="button button-gold">
            {sectorTextos.consultar}
          </Link>
        </div>
      </PageIntro>
      <section className="section">
        <div className="container split">
          <h2>{sectorTextos.hacemos}</h2>
          <ul className="feature-list">
            {sector.hacemos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section surface-section">
        <div className="container split">
          <div>
            <p className="eyebrow">{sectorTextos.recomendado}</p>
            <h2>{plan.nombre}</h2>
            <p className="intro-copy">{plan.descriptor}</p>
            <p className="lead">{sector.motivo}</p>
            <div className="hero-actions">
              <Link
                className="button button-gold"
                href={`/planes/${plan.slug}`}
              >
                {sitio.acciones.detalle}
              </Link>
            </div>
            {sector.alternativa && (
              <p className="intro-copy">
                {sectorTextos.alternativa}:{" "}
                <Link
                  className="text-link"
                  href={`/planes/${sector.alternativa}`}
                >
                  {planes.find((p) => p.slug === sector.alternativa)?.nombre}
                </Link>
                .
              </p>
            )}
          </div>
          <div className="sector-diagram">
            <Architecture plan={plan.slug} />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <h2>{sector.ejemplo.titulo}</h2>
          <div>
            <p className="lead">{sector.ejemplo.texto}</p>
            <p className="example-note">{sector.ejemplo.nota}</p>
          </div>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
