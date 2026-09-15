"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icono } from "./icono";

// Diálogos con <dialog> nativo: el navegador se encarga del foco, de Escape y
// de que el resto de la página no se pueda tocar mientras está abierto.
export function Dialogo({
  abierto,
  onCerrar,
  titulo,
  children,
  pie,
  variante = "",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  variante?: "" | "ancho" | "lateral";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      className={`a-dialogo ${variante}`}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
    >
      {abierto && (
        <>
          <header className="a-dialogo-cabecera">
            <h2>{titulo}</h2>
            <button type="button" className="a-boton fantasma icono" onClick={onCerrar} aria-label="Cerrar">
              <Icono nombre="cerrar" />
            </button>
          </header>
          <div className="a-dialogo-cuerpo">{children}</div>
          {pie && <footer className="a-dialogo-pie">{pie}</footer>}
        </>
      )}
    </dialog>
  );
}

type Pregunta = {
  titulo: string;
  texto?: ReactNode;
  boton?: string;
  peligro?: boolean;
};
const Contexto = createContext<(p: Pregunta) => Promise<boolean>>(async () => false);

/** `if (await confirmar({ titulo: "¿Borrar?" }))` — sustituye a window.confirm. */
export const useConfirmar = () => useContext(Contexto);

export function Confirmaciones({ children }: { children: ReactNode }) {
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const resolver = useRef<(valor: boolean) => void>(() => {});
  const confirmar = useCallback(
    (p: Pregunta) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setPregunta(p);
      }),
    [],
  );
  const responder = (valor: boolean) => {
    resolver.current(valor);
    resolver.current = () => {};
    setPregunta(null);
  };
  return (
    <Contexto.Provider value={confirmar}>
      {children}
      <Dialogo
        abierto={!!pregunta}
        onCerrar={() => responder(false)}
        titulo={pregunta?.titulo}
        pie={
          <>
            <button type="button" className="a-boton secundario" onClick={() => responder(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={`a-boton ${pregunta?.peligro ? "peligro lleno" : ""}`}
              onClick={() => responder(true)}
              autoFocus
            >
              {pregunta?.boton || "Aceptar"}
            </button>
          </>
        }
      >
        <div className="a-texto">{pregunta?.texto}</div>
      </Dialogo>
    </Contexto.Provider>
  );
}
