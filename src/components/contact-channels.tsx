"use client";
import { useState } from "react";
import { sitio } from "@/data/sitio";
import { track } from "@/lib/analytics";

// Canales de contacto de /contacto: WhatsApp, email (con copiar) y teléfono.
const iconos = {
  whatsapp: (
    <path d="M20.6 11.7a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.3a8.5 8.5 0 1 1 16.1-4Z" />
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </>
  ),
  telefono: (
    <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
  ),
};

function Icono({ nombre }: { nombre: keyof typeof iconos }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {iconos[nombre]}
    </svg>
  );
}

export function ContactChannels() {
  const [copiado, setCopiado] = useState(false);
  const mensaje = `${sitio.contacto.whatsappMensaje} ${sitio.contacto.whatsappPagina} /contacto.`;
  const whatsapp = sitio.whatsapp
    ? `https://wa.me/${sitio.whatsapp}?text=${encodeURIComponent(mensaje)}`
    : "#contact-form";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(sitio.email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      location.href = `mailto:${sitio.email}`;
    }
  }

  // Un foco que sigue al puntero dentro de cada tarjeta.
  const foco = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className="contact-channels">
      <ul>
        <li className="contact-channel is-primary" onPointerMove={foco} style={{ "--n": 0 } as React.CSSProperties}>
          <Icono nombre="whatsapp" />
          <div>
            <span>WhatsApp</span>
            <a
              href={whatsapp}
              onClick={() => track("ClicWhatsApp", { pagina: "/contacto", plan: "" })}
            >
              {sitio.acciones.whatsapp}
            </a>
          </div>
          <i aria-hidden="true">→</i>
        </li>
        <li className="contact-channel" onPointerMove={foco} style={{ "--n": 1 } as React.CSSProperties}>
          <Icono nombre="email" />
          <div>
            <span>Email</span>
            <a href={`mailto:${sitio.email}`}>{sitio.email}</a>
          </div>
          <button type="button" onClick={copiar} className="contact-copy">
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
          <span className="sr-only" role="status">
            {copiado ? "Email copiado al portapapeles" : ""}
          </span>
        </li>
        <li className="contact-channel" onPointerMove={foco} style={{ "--n": 2 } as React.CSSProperties}>
          <Icono nombre="telefono" />
          <div>
            <span>{sitio.acciones.llamar}</span>
            <a href={`tel:+${sitio.whatsapp}`}>{sitio.telefonoVisible}</a>
          </div>
          <i aria-hidden="true">→</i>
        </li>
      </ul>
    </div>
  );
}
