import { sitio } from "@/data/sitio";
import { PageIntro } from "@/components/content";
import { WhatsApp } from "@/components/whatsapp";
import { Architecture } from "@/components/architecture";
import { meta } from "@/lib/seo";
export const metadata = meta("Casos", sitio.casos.texto, "/casos");
export default function CasosPage() {
  return (
    <>
      <PageIntro
        title={sitio.casos.titulo}
        description={sitio.casos.texto}
        path="/casos"
        label="Casos"
      />
      <section className="empty-state container">
        <Architecture plan="cimiento" />
        <WhatsApp label={sitio.casos.cta} />
      </section>
    </>
  );
}
