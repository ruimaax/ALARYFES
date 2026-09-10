"use client";
import { useRef, type ReactNode } from "react";

// SpotlightCard, de React Bits. Un foco que sigue al puntero; por defecto
// en el ocre de acento de la marca.
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(190, 148, 93, 0.25)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = divRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`.trim()}
    >
      {children}
    </div>
  );
}
