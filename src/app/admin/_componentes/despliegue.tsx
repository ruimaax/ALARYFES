"use client";
import { useEffect, useState } from "react";
import { api } from "../_lib/api";
import { Chip, Giro } from "./comunes";

type Estado = { estado: "pendiente" | "ok" | "error" | "desconocido"; detalle: string; url?: string };

/**
 * Estado de la compilación en Cloudflare de un commit. Mientras compila se
 * vuelve a consultar cada 6 segundos (hasta unos 6 minutos).
 */
export function EstadoPublicacion({ sha, vigilar = true }: { sha: string; vigilar?: boolean }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  useEffect(() => {
    let vivo = true;
    let intentos = 0;
    let temporizador: ReturnType<typeof setTimeout>;
    const mirar = async () => {
      try {
        const e = await api<Estado>(`publicacion/estado?sha=${sha}`);
        if (!vivo) return;
        setEstado(e);
        if (vigilar && (e.estado === "pendiente" || e.estado === "desconocido") && intentos++ < 60)
          temporizador = setTimeout(mirar, 6000);
      } catch {
        if (vivo) setEstado({ estado: "desconocido", detalle: "No se ha podido consultar el estado." });
      }
    };
    mirar();
    return () => {
      vivo = false;
      clearTimeout(temporizador);
    };
  }, [sha, vigilar]);
  if (!estado)
    return (
      <span className="a-suave a-pequeno" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <Giro /> Consultando…
      </span>
    );
  const chip = {
    pendiente: <Chip tono="aviso">Compilando</Chip>,
    ok: <Chip tono="ok">En la web</Chip>,
    error: <Chip tono="error">Falló la compilación</Chip>,
    desconocido: <Chip>Esperando a Cloudflare</Chip>,
  }[estado.estado];
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {chip}
        {estado.url && (
          <a className="a-enlace a-pequeno" href={estado.url} target="_blank" rel="noopener">
            Ver detalles
          </a>
        )}
      </div>
      <span className="a-pequeno a-suave">{estado.detalle}</span>
    </div>
  );
}
