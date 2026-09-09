"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Architecture } from "./architecture";
import { planes, preciosDe, euros, type Plan } from "@/data/planes";
import { sitio } from "@/data/sitio";

export function PlanShowcase({
  detailed = false,
  initialDate,
}: {
  detailed?: boolean;
  initialDate: string;
}) {
  const [term, setTerm] = useState<3 | 12>(12);
  const [date, setDate] = useState(initialDate);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // La fecha se comprueba en el navegador: en una web estática es lo que
    // hace que el cambio de tarifas del 1 de enero ocurra solo.
    setDate(new Date().toISOString());
    const timer = setInterval(() => setDate(new Date().toISOString()), 60000);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          ref.current?.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, []);
  return (
    <div className="showcase" ref={ref}>
      <fieldset className="term-control">
        <legend>{sitio.planes.compromiso}</legend>
        <div>
          {([3, 12] as const).map((value) => (
            <label key={value} className={term === value ? "selected" : ""}>
              <input
                type="radio"
                name={`compromiso-${detailed}`}
                value={value}
                checked={term === value}
                onChange={() => setTerm(value)}
              />
              {value === 3 ? sitio.planes.tres : sitio.planes.doce}
            </label>
          ))}
        </div>
      </fieldset>
      {detailed && (
        <h2 className="visually-hidden">{sitio.planes.kicker}</h2>
      )}
      <div className="plan-grid">
        {planes.map((plan, index) => (
          <PlanColumn
            key={plan.slug}
            plan={plan}
            index={index}
            term={term}
            date={date}
            detailed={detailed}
          />
        ))}
      </div>
      <p className="plans-footnote">
        {sitio.planes.fiscal} <span>{sitio.planes.garantia}</span>
      </p>
    </div>
  );
}
function PlanColumn({
  plan,
  index,
  term,
  date,
  detailed,
}: {
  plan: Plan;
  index: number;
  term: 3 | 12;
  date: string;
  detailed: boolean;
}) {
  const prices = preciosDe(plan, new Date(date));
  return (
    <article
      className="plan-column"
      style={{ "--plan-index": index } as React.CSSProperties}
    >
      <div className="plan-art">
        <Architecture plan={plan.slug} />
      </div>
      <div className="plan-info">
        <h3>{plan.nombre}</h3>
        <p className="plan-descriptor">{plan.descriptor}</p>
        <p className="plan-terms">
          {sitio.planes.alta}
          <span key={term} className="plan-term-tag">
            {term === 3 ? sitio.planes.tres : sitio.planes.doce}
          </span>
        </p>
        <p className="plan-price">
          <span key={term} className="plan-price-value">
            {euros(term === 3 ? prices.alta3 : prices.alta12)}
          </span>
        </p>
        <span className="plan-price-rule" aria-hidden="true" />
        <p className="plan-setup">
          {sitio.planes.luego},{" "}
          <strong>
            {euros(prices.mensual)}
            {sitio.hero.unidad}
          </strong>
        </p>
        {detailed && (
          <>
            <p className="plan-tagline">{plan.bajada}</p>
            <p className="plan-delivery">{plan.plazo}</p>
          </>
        )}
        <Link className="plan-link" href={`/planes/${plan.slug}`}>
          {sitio.acciones.detalle}
          <span aria-hidden="true">+</span>
        </Link>
      </div>
    </article>
  );
}
