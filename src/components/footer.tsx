import Link from "next/link";
import { sitio } from "@/data/sitio";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Link className="footer-wordmark" href="/">
              {sitio.nombre}
            </Link>
            <p>{sitio.footer.frase}</p>
            <p className="muted">{sitio.footer.origen}</p>
          </div>
          <nav aria-label="Más sobre ALARYFES">
            {sitio.adicionales.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.titulo}
              </Link>
            ))}
            <a href={`mailto:${sitio.email}`}>{sitio.email}</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>{sitio.footer.derechos}</p>
          <nav aria-label="Información legal">
            {sitio.legales.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.titulo}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
