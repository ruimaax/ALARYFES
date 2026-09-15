import { recomienda } from "@/data/recomienda";
import { tablaTextos } from "@/data/servicios";
import { PageIntro, ResponsiveTable } from "@/components/content";
import { ContactForm } from "@/components/contact-form";
import { meta } from "@/lib/seo";
export const metadata = meta(
  "Recomienda ALARYFES",
  recomienda.descripcion,
  "/recomienda",
);
export default function RecomiendaPage() {
  return (
    <>
      <PageIntro
        title={recomienda.titulo}
        description={recomienda.descripcion}
        path="/recomienda"
        label="Recomienda"
        dark
      />
      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <h2>{recomienda.pasosTitulo}</h2>
          </div>
          <div className="steps referral-steps">
            {recomienda.pasos.map((p, i) => (
              <article key={p}>
                <span className="step-number">0{i + 1}</span>
                <h3>{p}</h3>
              </article>
            ))}
          </div>
          <ResponsiveTable
            caption={recomienda.recompensasTitulo}
            headers={[
              tablaTextos.referidoPlan,
              tablaTextos.tu,
              tablaTextos.otro,
            ]}
            rows={recomienda.recompensas}
          />
        </div>
      </section>
      <section className="section surface-section">
        <div className="container">
          <h2>{recomienda.circuloTitulo}</h2>
          <p className="intro-copy">{recomienda.circuloTexto}</p>
          <ResponsiveTable
            caption={recomienda.circuloTitulo}
            headers={[tablaTextos.referidos, tablaTextos.recompensa]}
            rows={recomienda.circulo}
          />
          <p className="notice">{recomienda.excepcion}</p>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <h2>{recomienda.condicionesTitulo}</h2>
          <ul className="conditions-list">
            {recomienda.condiciones.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section surface-section">
        <div className="container split">
          <h2>{recomienda.formulario}</h2>
          <ContactForm referral />
        </div>
      </section>
    </>
  );
}
