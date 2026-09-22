import Link from "next/link";
import Image from "next/image";
import { sitio } from "@/data/sitio";
import { planes } from "@/data/planes";

export function Footer() {
  return (
    <footer className="site-footer" id="pie">
      <div className="footer-shell">
        <div className="container footer-inner">
          <div className="footer-grid">
            <section
              className="footer-about"
              aria-labelledby="footer-about-title"
            >
              <p className="footer-kicker" id="footer-about-title">
                El estudio
              </p>
              <p className="footer-statement">{sitio.footer.frase}</p>
              <p className="footer-muted">{sitio.footer.origen}</p>
              <div className="footer-contact-icons">
                <a
                  href={`https://wa.me/${sitio.whatsapp}?text=${encodeURIComponent(sitio.contacto.whatsappMensaje)}`}
                  aria-label={sitio.acciones.whatsapp}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.6 11.7a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.3a8.5 8.5 0 1 1 16.1-4Z" />
                    <path d="M8 7.5c.2-.4.6-.4 1 0l1 2c.2.4-.5.9-.8 1.2.7 1.6 1.8 2.7 3.6 3.5l1.2-1.1c.2-.2.5-.2.8 0l1.8 1c.4.3.2.8 0 1.1-.8 1.3-2.3 1.3-3.8.6-2.9-1.3-5.1-3.4-5.6-6.1-.2-1 .1-1.7.8-2.2Z" />
                  </svg>
                </a>
                <a
                  href={`mailto:${sitio.email}`}
                  aria-label={`Escribir a ${sitio.email}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </a>
              </div>
            </section>

            <nav className="footer-nav" aria-label="Navegación del pie">
              <p className="footer-kicker">Navegación</p>
              <div className="footer-links">
                {sitio.navegacion.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.titulo}
                  </Link>
                ))}
                {sitio.adicionales.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.titulo}
                  </Link>
                ))}
                <Link href="/contacto">{sitio.acciones.contacto}</Link>
              </div>
            </nav>

            <nav className="footer-nav" aria-label="Planes de ALARYFES">
              <p className="footer-kicker">Planes</p>
              <div className="footer-links">
                {planes.map((plan) => (
                  <Link key={plan.slug} href={`/planes/${plan.slug}`}>
                    {plan.nombre}
                  </Link>
                ))}
              </div>
            </nav>

            <section
              className="footer-contact"
              aria-labelledby="footer-contact-title"
            >
              <p className="footer-kicker" id="footer-contact-title">
                Contacto
              </p>
              <a className="footer-email" href={`mailto:${sitio.email}`}>
                {sitio.email}
              </a>
              <a
                className="footer-phone"
                href={`tel:${sitio.telefonoVisible.replace(/\s/g, "")}`}
              >
                {sitio.telefonoVisible}
              </a>
              <p className="footer-muted">
                Desde {sitio.localidad}. Trabajamos contigo estés donde estés.
              </p>
              <Link className="footer-cta" href="/contacto">
                Empezar un proyecto <span aria-hidden="true">↗</span>
              </Link>
            </section>
          </div>

          <Link
            className="footer-masthead"
            href="/"
            aria-label={`${sitio.nombre}, inicio`}
          >
            <span className="footer-mark" aria-hidden="true">
              <Image
                src="/logo-transparente.png"
                alt=""
                width={500}
                height={500}
                loading="eager"
              />
            </span>
            <span className="footer-masthead-name" aria-hidden="true">
              <span className="footer-name-red">ALARY</span>
              <span className="footer-name-gold">FES</span>
            </span>
          </Link>

          <div className="footer-bottom">
            <p>{sitio.footer.derechos}</p>
            <div className="footer-legal-row">
              <nav aria-label="Información legal">
                {sitio.legales.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.titulo}
                  </Link>
                ))}
              </nav>
              <a href="#contenido">Volver arriba ↑</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
