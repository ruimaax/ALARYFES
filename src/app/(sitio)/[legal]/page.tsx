import { notFound } from "next/navigation";
import { legales } from "@/data/legal";
import { PageIntro } from "@/components/content";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { meta } from "@/lib/seo";
export function generateStaticParams() {
  return Object.keys(legales).map((legal) => ({ legal }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  const p = legales[legal];
  return p ? meta(p.titulo, p.descripcion, `/${legal}`) : {};
}
export default async function LegalPage({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  const page = legales[legal];
  if (!page) notFound();
  return (
    <>
      <PageIntro
        title={page.titulo}
        description={page.descripcion}
        path={`/${legal}`}
      />
      <section className="section legal-content">
        <div className="container narrow">
          {page.bloques.map((b) => (
            <section key={b.titulo}>
              <h2>{b.titulo}</h2>
              <p>{b.texto}</p>
            </section>
          ))}
          {legal === "politica-cookies" && <AnalyticsConsent settings />}
        </div>
      </section>
    </>
  );
}
