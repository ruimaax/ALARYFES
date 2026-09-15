import Link from "next/link";
import { sitio } from "@/data/sitio";
import { StarBorder } from "@/components/star-border";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";
// Las URL desconocidas se resuelven fuera de (sitio)/layout.tsx, así que la
// 404 monta por sí misma la cabecera, el pie y los estilos de la web.
export default function NotFound() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container narrow">
          <h1>{sitio.notFound.titulo}</h1>
          <p className="lead intro-copy">{sitio.notFound.texto}</p>
          <StarBorder as={Link} className="button button-gold" href="/">
            {sitio.notFound.cta}
          </StarBorder>
        </div>
      </section>
    </SiteShell>
  );
}
