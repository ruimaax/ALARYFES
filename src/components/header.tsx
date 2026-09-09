"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sitio } from "@/data/sitio";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          className="brand"
          href="/"
          aria-label={`${sitio.nombre}, inicio`}
          onClick={() => setOpen(false)}
        >
          <span className="brand-logo">
            <Image
              src="/logo-original.png"
              alt="Emblema de ALARYFES: arco andalusí rojo con columnas ocres"
              width={86}
              height={86}
              priority
            />
          </span>
          <span>{sitio.nombre}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {sitio.navegacion.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.titulo}
            </Link>
          ))}
        </nav>
        <Link href="/contacto" className="header-contact">
          {sitio.acciones.contacto}
          <span aria-hidden="true">↗</span>
        </Link>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? sitio.acciones.cerrar : sitio.acciones.menu}
          onClick={() => setOpen(!open)}
        >
          {open ? "×" : "☰"}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Navegación móvil"
        >
          {[
            ...sitio.navegacion,
            { titulo: sitio.acciones.contacto, href: "/contacto" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.titulo}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
