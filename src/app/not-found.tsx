import Link from "next/link";
import { sitio } from "@/data/sitio";
export default function NotFound() {
  return (
    <section className="section">
      <div className="container narrow">
        <h1>{sitio.notFound.titulo}</h1>
        <p className="lead intro-copy">{sitio.notFound.texto}</p>
        <Link className="button button-gold" href="/">
          {sitio.notFound.cta}
        </Link>
      </div>
    </section>
  );
}
