"use client";
import { useMemo } from "react";

type Linea = { tipo: "igual" | "mas" | "menos"; texto: string };

/** Diferencias línea a línea (subsecuencia común más larga). */
export function lineasDiff(antes: string, despues: string): Linea[] {
  const a = antes.split("\n");
  const b = despues.split("\n");
  let inicio = 0;
  while (inicio < a.length && inicio < b.length && a[inicio] === b[inicio]) inicio++;
  let finA = a.length;
  let finB = b.length;
  while (finA > inicio && finB > inicio && a[finA - 1] === b[finB - 1]) {
    finA--;
    finB--;
  }
  const x = a.slice(inicio, finA);
  const y = b.slice(inicio, finB);
  const medio: Linea[] = [];
  if (x.length * y.length > 4_000_000) {
    x.forEach((t) => medio.push({ tipo: "menos", texto: t }));
    y.forEach((t) => medio.push({ tipo: "mas", texto: t }));
  } else {
    const ancho = y.length + 1;
    const tabla = new Uint32Array((x.length + 1) * ancho);
    for (let i = x.length - 1; i >= 0; i--)
      for (let j = y.length - 1; j >= 0; j--)
        tabla[i * ancho + j] =
          x[i] === y[j]
            ? tabla[(i + 1) * ancho + j + 1] + 1
            : Math.max(tabla[(i + 1) * ancho + j], tabla[i * ancho + j + 1]);
    let i = 0;
    let j = 0;
    while (i < x.length && j < y.length) {
      if (x[i] === y[j]) {
        medio.push({ tipo: "igual", texto: x[i] });
        i++;
        j++;
      } else if (tabla[(i + 1) * ancho + j] >= tabla[i * ancho + j + 1]) medio.push({ tipo: "menos", texto: x[i++] });
      else medio.push({ tipo: "mas", texto: y[j++] });
    }
    while (i < x.length) medio.push({ tipo: "menos", texto: x[i++] });
    while (j < y.length) medio.push({ tipo: "mas", texto: y[j++] });
  }
  return [
    ...a.slice(0, inicio).map((t) => ({ tipo: "igual" as const, texto: t })),
    ...medio,
    ...a.slice(finA).map((t) => ({ tipo: "igual" as const, texto: t })),
  ];
}

const CONTEXTO = 3;

export function Diff({ antes, despues }: { antes: string | null; despues: string | null }) {
  const lineas = useMemo(() => lineasDiff(antes ?? "", despues ?? ""), [antes, despues]);
  const cambios = lineas.filter((l) => l.tipo !== "igual").length;
  if (antes === null && despues === null) return <p className="a-suave">Sin contenido.</p>;
  if (!cambios) return <p className="a-suave">No hay diferencias.</p>;
  // Solo se enseñan unas líneas de contexto alrededor de cada cambio.
  const cerca = lineas.map((_, i) =>
    lineas.slice(Math.max(0, i - CONTEXTO), i + CONTEXTO + 1).some((l) => l.tipo !== "igual"),
  );
  const salida: React.ReactNode[] = [];
  let ocultas = 0;
  lineas.forEach((l, i) => {
    if (l.tipo === "igual" && !cerca[i]) {
      ocultas++;
      return;
    }
    if (ocultas) {
      salida.push(
        <div key={`s${i}`} className="salto">
          {ocultas} {ocultas === 1 ? "línea sin cambios" : "líneas sin cambios"}
        </div>,
      );
      ocultas = 0;
    }
    salida.push(
      <div key={i} className={l.tipo}>
        {l.tipo === "mas" ? "+ " : l.tipo === "menos" ? "− " : "  "}
        {l.texto}
      </div>,
    );
  });
  if (ocultas)
    salida.push(
      <div key="fin" className="salto">
        {ocultas} {ocultas === 1 ? "línea sin cambios" : "líneas sin cambios"}
      </div>,
    );
  return (
    <>
      <p className="a-pequeno a-suave" style={{ marginBottom: 8 }}>
        <span style={{ color: "var(--a-ok)", fontWeight: 700 }}>+ añadido</span> ·{" "}
        <span style={{ color: "var(--a-error)", fontWeight: 700 }}>− quitado</span>
      </p>
      <div className="a-diff">{salida}</div>
    </>
  );
}
