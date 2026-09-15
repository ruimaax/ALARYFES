"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, mensajeDe } from "../_lib/api";
import { Avisos } from "./avisos";
import { Confirmaciones } from "./dialogo";
import { Icono, type NombreIcono } from "./icono";
import { Cargando } from "./comunes";

type Sesion = { autenticado: boolean; configurado: boolean; email?: string; modo: string };
type Resumen = { nuevas: number; borradores: number };
const Contexto = createContext<{
  resumen: Resumen;
  refrescar: () => void;
  modo: string;
  email: string;
}>({ resumen: { nuevas: 0, borradores: 0 }, refrescar: () => {}, modo: "", email: "" });

/** Contadores de la barra lateral y datos de la sesión. */
export const useMarco = () => useContext(Contexto);

const principal: { href: string; texto: string; icono: NombreIcono; insignia?: keyof Resumen }[] = [
  { href: "/admin", texto: "Panel", icono: "panel" },
  { href: "/admin/analitica", texto: "Analítica", icono: "analitica" },
  { href: "/admin/solicitudes", texto: "Solicitudes", icono: "solicitudes", insignia: "nuevas" },
  { href: "/admin/contenido", texto: "Contenido", icono: "contenido" },
  { href: "/admin/blog", texto: "Blog", icono: "blog" },
  { href: "/admin/medios", texto: "Medios", icono: "medios" },
  { href: "/admin/publicar", texto: "Publicar", icono: "publicar", insignia: "borradores" },
  { href: "/admin/historial", texto: "Historial", icono: "historial" },
];
const secundaria: { href: string; texto: string; icono: NombreIcono }[] = [
  { href: "/admin/cuenta", texto: "Mi cuenta", icono: "cuenta" },
  { href: "/admin/actividad", texto: "Actividad", icono: "actividad" },
  { href: "/admin/ayuda", texto: "Ayuda y estado", icono: "ayuda" },
];

export function Marco({ children }: { children: ReactNode }) {
  const ruta = usePathname() || "/admin";
  const esAcceso = ruta.startsWith("/admin/login");
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<Resumen>({ nuevas: 0, borradores: 0 });
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (esAcceso) return;
    api<Sesion>("sesion")
      .then((s) => {
        if (!s.autenticado) {
          const volver = location.pathname + location.search;
          location.replace(
            `/admin/login${volver === "/admin" ? "" : `?volver=${encodeURIComponent(volver)}`}`,
          );
          return;
        }
        setSesion(s);
      })
      .catch((e) => setError(mensajeDe(e)));
  }, [esAcceso]);

  const refrescar = useCallback(() => {
    api<Resumen>("resumen").then(setResumen).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (sesion) refrescar();
  }, [sesion, ruta, refrescar]);
  useEffect(() => setMenu(false), [ruta]);

  if (esAcceso)
    return (
      <Avisos>
        <Confirmaciones>{children}</Confirmaciones>
      </Avisos>
    );
  if (error)
    return (
      <div className="a-acceso">
        <div className="a-acceso-caja a-tarjeta">
          <h1>No se puede abrir el panel</h1>
          <p className="a-suave a-separado">{error}</p>
          <p className="a-pequeno a-suave a-separado">
            Si acabas de configurar Cloudflare, revisa que la base de datos D1 esté vinculada
            con el nombre <code>DB</code> y vuelve a desplegar.
          </p>
        </div>
      </div>
    );
  if (!sesion)
    return (
      <div className="a-acceso">
        <Cargando texto="Abriendo el panel…" />
      </div>
    );

  const activo = (href: string) => (href === "/admin" ? ruta === "/admin" : ruta.startsWith(href));
  const salir = async () => {
    await api("sesion/salir", { metodo: "POST" }).catch(() => undefined);
    location.assign("/admin/login");
  };

  return (
    <Avisos>
      <Confirmaciones>
        <Contexto.Provider
          value={{ resumen, refrescar, modo: sesion.modo, email: sesion.email || "" }}
        >
          <div className="a-marco">
            <div className="a-barra-movil">
              <button
                type="button"
                className="a-boton fantasma icono"
                onClick={() => setMenu(true)}
                aria-label="Abrir menú"
                aria-expanded={menu}
                aria-controls="a-lateral"
              >
                <Icono nombre="menu" />
              </button>
              <strong>ALARYFES</strong>
              {resumen.borradores > 0 && (
                <Link href="/admin/publicar" className="a-insignia ocre" style={{ textDecoration: "none" }}>
                  {resumen.borradores} sin publicar
                </Link>
              )}
            </div>
            {menu && (
              <button type="button" className="a-velo" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
            )}
            <aside id="a-lateral" className={`a-lateral ${menu ? "abierto" : ""}`}>
              <Link href="/admin" className="a-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" />
                <div>
                  <strong>ALARYFES</strong>
                  <span>Panel de gestión</span>
                </div>
              </Link>
              <nav className="a-nav" aria-label="Secciones del panel">
                {principal.map((item) => (
                  <Link key={item.href} href={item.href} aria-current={activo(item.href) ? "page" : undefined}>
                    <Icono nombre={item.icono} />
                    {item.texto}
                    {item.insignia && resumen[item.insignia] > 0 && (
                      <span className={`a-insignia ${item.insignia === "borradores" ? "ocre" : ""}`}>
                        {resumen[item.insignia]}
                      </span>
                    )}
                  </Link>
                ))}
                <p className="a-nav-titulo">Cuenta</p>
                {secundaria.map((item) => (
                  <Link key={item.href} href={item.href} aria-current={activo(item.href) ? "page" : undefined}>
                    <Icono nombre={item.icono} />
                    {item.texto}
                  </Link>
                ))}
              </nav>
              <div className="a-lateral-pie a-nav">
                <p className="a-usuario">{sesion.email}</p>
                <a href="/" target="_blank" rel="noopener">
                  <Icono nombre="web" />
                  Ver la web
                </a>
                <button type="button" onClick={salir}>
                  <Icono nombre="salir" />
                  Salir
                </button>
              </div>
            </aside>
            <main className="a-principal" id="contenido-panel">
              {sesion.modo === "local" && (
                <p className="a-modo-local">
                  Modo local: «Publicar» escribe directamente en los archivos del proyecto y la
                  base de datos está en <code>.cms-local/</code>.
                </p>
              )}
              {children}
            </main>
          </div>
        </Contexto.Provider>
      </Confirmaciones>
    </Avisos>
  );
}
