"use client";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icono } from "./icono";

type Tipo = "ok" | "error" | "info";
type Aviso = { id: number; texto: ReactNode; tipo: Tipo };
const Contexto = createContext<(texto: ReactNode, tipo?: Tipo) => void>(() => {});

/** Avisos breves («Guardado», «No se ha podido…») en la esquina inferior. */
export const useAviso = () => useContext(Contexto);

let siguiente = 1;

export function Avisos({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Aviso[]>([]);
  const capa = useRef<HTMLDivElement>(null);
  const avisar = useCallback((texto: ReactNode, tipo: Tipo = "ok") => {
    const id = siguiente++;
    setLista((actual) => [...actual.slice(-3), { id, texto, tipo }]);
    setTimeout(
      () => setLista((actual) => actual.filter((a) => a.id !== id)),
      tipo === "error" ? 8000 : 4500,
    );
  }, []);
  // La capa va en la «top layer» del navegador (popover) y se vuelve a abrir
  // con cada aviso para quedar por encima de cualquier diálogo abierto.
  useLayoutEffect(() => {
    const el = capa.current;
    if (!el) return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      if (lista.length) el.showPopover();
    } catch {
      /* Navegadores sin popover: la capa se ve igualmente con position fixed. */
    }
  }, [lista]);
  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div ref={capa} popover="manual" className="a-avisos" role="status" aria-live="polite">
        {lista.map((a) => (
          <div key={a.id} className={`a-toast ${a.tipo}`}>
            <Icono nombre={a.tipo === "ok" ? "check" : a.tipo === "error" ? "alerta" : "info"} />
            <div>{a.texto}</div>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}
