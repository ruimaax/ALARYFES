"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Selectores de todo lo que entra en escena al hacer scroll.
const REVEAL = [
  ".page-intro .container > *",
  ".section > .container > *",
  ".section-heading > *",
  ".split > *",
  ".steps article",
  ".plan-column",
  ".conditions-list li",
  ".faq-list details",
  ".policy-pair p",
  ".responsive-table tbody tr",
  ".empty-state > *",
  ".plan-detail-list li",
].join(",");

export function Motion() {
  const pathname = usePathname();
  useEffect(() => {
    const quieto = matchMedia("(prefers-reduced-motion: reduce)");
    if (quieto.matches) return;
    const root = document.documentElement;
    root.classList.add("motion-ready");

    // Solo animamos las hojas: si un candidato contiene a otro, anima el interior.
    const invisibles = ["SCRIPT", "STYLE", "LINK", "TEMPLATE", "NOSCRIPT"];
    const todos = Array.from(document.querySelectorAll<HTMLElement>(REVEAL));
    const hojas = todos.filter(
      (el) => !invisibles.includes(el.tagName) && !el.querySelector(REVEAL),
    );
    const grupos = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    for (const el of hojas) {
      const padre = el.parentElement ?? document.body;
      const orden = grupos.get(padre) ?? 0;
      grupos.set(padre, orden + 1);
      el.style.setProperty("--i", String(Math.min(orden, 8)));
      el.dataset.reveal = "";
      observer.observe(el);
    }

    // Cabecera condensada y barra de progreso de lectura.
    const barra = document.createElement("div");
    barra.className = "scroll-progress";
    barra.setAttribute("aria-hidden", "true");
    document.body.append(barra);
    let pendiente = false;
    const onScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        const alto = document.body.scrollHeight - innerHeight;
        root.classList.toggle("is-scrolled", y > 40);
        barra.style.transform = `scaleX(${alto > 0 ? Math.min(y / alto, 1) : 0})`;
        root.style.setProperty("--scroll-y", String(y));
        pendiente = false;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      barra.remove();
      root.classList.remove("motion-ready", "is-scrolled");
    };
  }, [pathname]);
  return null;
}
