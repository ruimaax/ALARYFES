import Link from "next/link";
import { sitio } from "@/data/sitio";
import { StarBorder } from "@/components/star-border";
export default function NotFound() {
  return (
    <section className="section">
      <div className="container narrow">
        <h1>{sitio.notFound.titulo}</h1>
        <p className="lead intro-copy">{sitio.notFound.texto}</p>
        <StarBorder as={Link} className="button button-gold" href="/">
          {sitio.notFound.cta}
        </StarBorder>
      </div>
    </section>
  );
}
