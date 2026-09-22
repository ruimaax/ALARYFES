"use client";
import { useEffect, useRef } from "react";

// Texto que se entinta palabra a palabra según avanza el scroll.
// Sin JS (o con movimiento reducido) --p se queda en 1 y todo se lee.
export function InkText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const palabras = text.split(/\s+/);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      const { top, height } = el.getBoundingClientRect();
      const inicio = innerHeight * 0.85;
      const fin = innerHeight * 0.35;
      const p = (inicio - top) / (inicio - fin + height * 0.6);
      el.style.setProperty("--p", Math.min(Math.max(p, 0), 1).toFixed(3));
    };
    const onScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(medir);
    };
    medir();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <p ref={ref} className={`ink-text ${className}`.trim()}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {palabras.map((palabra, i) => (
          <span
            key={i}
            style={{ "--w": (i / palabras.length).toFixed(3) } as React.CSSProperties}
          >
            {palabra}{" "}
          </span>
        ))}
      </span>
    </p>
  );
}
