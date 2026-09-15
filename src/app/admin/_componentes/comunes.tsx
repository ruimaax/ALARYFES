"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { mensajeDe } from "../_lib/api";
import { Icono } from "./icono";

export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · Panel ALARYFES`;
  }, [titulo]);
}

/** Carga datos al montar y cuando cambian las dependencias. */
export function useCarga<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const funcion = useRef(cargar);
  funcion.current = cargar;
  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await funcion.current());
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
  return { datos, setDatos, error, cargando, recargar };
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="a-cargando" role="status">
      <span className="a-giro" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Giro() {
  return <span className="a-giro" aria-hidden="true" />;
}

export function ErrorCarga({ error, reintentar }: { error: string; reintentar?: () => void }) {
  return (
    <div className="a-alerta error" role="alert">
      <Icono nombre="alerta" />
      <div>
        <p>{error}</p>
        {reintentar && (
          <button type="button" className="a-enlace" onClick={reintentar} style={{ marginTop: 6 }}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function Cabecera({
  titulo,
  descripcion,
  migas,
  acciones,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  migas?: { texto: string; href: string }[];
  acciones?: ReactNode;
}) {
  return (
    <header className="a-cabecera">
      <div>
        {migas && (
          <nav className="a-migas" aria-label="Ruta">
            {migas.map((m) => (
              <span key={m.href}>
                <Link href={m.href}>{m.texto}</Link> /
              </span>
            ))}
          </nav>
        )}
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {acciones && <div className="a-acciones">{acciones}</div>}
    </header>
  );
}

export function Chip({ tono = "", children }: { tono?: string; children: ReactNode }) {
  return <span className={`a-chip ${tono}`}>{children}</span>;
}

export function Vacio({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="a-vacio">
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children && <div className="a-acciones">{children}</div>}
    </div>
  );
}

/** Avisa al salir de la página con cambios sin guardar. */
export function useAvisoSalida(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [activo]);
}

/** Ctrl/Cmd + S ejecuta la función (guardar). */
export function useAtajoGuardar(guardar: () => void) {
  const ref = useRef(guardar);
  ref.current = guardar;
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
}
