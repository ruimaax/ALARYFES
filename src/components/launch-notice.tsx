"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { enLanzamiento } from "@/data/planes";
import { sitio } from "@/data/sitio";

export function LaunchNotice({ initialDate }: { initialDate: string }) {
  const [visible, setVisible] = useState(() =>
    enLanzamiento(new Date(initialDate)),
  );
  useEffect(() => {
    const update = () => setVisible(enLanzamiento());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  if (!visible) return null;
  return (
    <section className="launch-band">
      <div className="container">
        <span className="launch-date">{sitio.lanzamiento.fin}</span>
        <div>
          <h2>{sitio.lanzamiento.titulo}</h2>
          <p>{sitio.lanzamiento.texto}</p>
        </div>
        <Link href="/planes" className="text-link">
          {sitio.lanzamiento.cta}
        </Link>
      </div>
    </section>
  );
}
