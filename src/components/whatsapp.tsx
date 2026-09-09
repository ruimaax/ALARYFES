"use client";
import { usePathname } from "next/navigation";
import { sitio } from "@/data/sitio";
import { sectores } from "@/data/sectores";
import { planes } from "@/data/planes";
import { track } from "@/lib/analytics";

export function WhatsApp({
  floating = false,
  className = "",
  label,
}: {
  floating?: boolean;
  className?: string;
  label?: string;
}) {
  const path = usePathname();
  const plan = planes.find((p) => path === `/planes/${p.slug}`);
  const sector = sectores.find((s) => path === `/sectores/${s.slug}`);
  const message = sector
    ? sector.mensaje
    : plan
      ? `${sitio.contacto.whatsappPlan} ${plan.nombre}`
      : `${sitio.contacto.whatsappMensaje}${path === "/" ? "" : ` ${sitio.contacto.whatsappPagina} ${path}.`}`;
  return (
    <a
      className={
        floating ? "whatsapp-float" : `button button-gold ${className}`
      }
      href={
        sitio.whatsapp
          ? `https://wa.me/${sitio.whatsapp}?text=${encodeURIComponent(message)}`
          : "/contacto"
      }
      aria-label={sitio.acciones.whatsapp}
      onClick={() =>
        track("ClicWhatsApp", { pagina: path, plan: plan?.slug || "" })
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="21"
        height="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M20.6 11.7a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.3a8.5 8.5 0 1 1 16.1-4Z" />
        <path d="M8 7.5c.2-.4.6-.4 1 0l1 2c.2.4-.5.9-.8 1.2.7 1.6 1.8 2.7 3.6 3.5l1.2-1.1c.2-.2.5-.2.8 0l1.8 1c.4.3.2.8 0 1.1-.8 1.3-2.3 1.3-3.8.6-2.9-1.3-5.1-3.4-5.6-6.1-.2-1 .1-1.7.8-2.2Z" />
      </svg>
      {!floating && (label || sitio.acciones.whatsapp)}
    </a>
  );
}
