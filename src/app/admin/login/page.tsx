"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api, ErrorPanel, mensajeDe } from "../_lib/api";
import { Cargando, Giro, useTitulo } from "../_componentes/comunes";
import { Icono } from "../_componentes/icono";

type Modo = "cargando" | "entrar" | "codigo" | "crear" | "recuperar" | "sin-bd";
type Sesion = { autenticado: boolean; configurado: boolean; claveDisponible: boolean; modo: string };

// Solo se vuelve a páginas del propio panel: nada de redirecciones a otros sitios.
function destino() {
  const volver = new URLSearchParams(location.search).get("volver") || "";
  return /^\/admin(\/|\?|$)/.test(volver) && !volver.startsWith("/admin/login") ? volver : "/admin";
}

export default function Acceso() {
  useTitulo("Entrar");
  const [modo, setModo] = useState<Modo>("cargando");
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [codigo, setCodigo] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    api<Sesion>("sesion")
      .then((s) => {
        if (s.autenticado) return location.replace(destino());
        setSesion(s);
        setModo(s.configurado ? "entrar" : "crear");
      })
      .catch((e) => {
        setError(mensajeDe(e));
        setModo(e instanceof ErrorPanel && e.datos.codigo === "sin-bd" ? "sin-bd" : "entrar");
      });
  }, []);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if ((modo === "crear" || modo === "recuperar") && clave !== repetir)
      return setError("Las dos contraseñas no coinciden.");
    setEnviando(true);
    try {
      if (modo === "entrar" || modo === "codigo") {
        const r = await api<{ ok: boolean; necesitaCodigo?: boolean }>("sesion/entrar", {
          metodo: "POST",
          cuerpo: { email, clave, codigo: modo === "codigo" ? codigo : undefined },
        });
        if (r.necesitaCodigo) {
          setModo("codigo");
          setEnviando(false);
          return;
        }
      } else if (modo === "crear")
        await api("sesion/configurar", { metodo: "POST", cuerpo: { token, email, clave } });
      else if (modo === "recuperar")
        await api("sesion/recuperar", { metodo: "POST", cuerpo: { token, clave } });
      location.replace(destino());
    } catch (e) {
      setError(mensajeDe(e));
      if (e instanceof ErrorPanel && e.datos.codigo === "sin-cuenta") setModo("crear");
      setEnviando(false);
    }
  };

  const titulos: Record<Modo, string> = {
    cargando: "",
    entrar: "Entrar al panel",
    codigo: "Verificación en dos pasos",
    crear: "Crea tu cuenta de administrador",
    recuperar: "Recuperar el acceso",
    "sin-bd": "Falta la base de datos",
  };

  return (
    <div className="a-acceso">
      <div className="a-acceso-caja">
        <div className="a-acceso-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-marca.png" alt="" />
          <h1>ALARYFES</h1>
          <p>Panel de gestión</p>
        </div>
        {modo === "cargando" ? (
          <Cargando />
        ) : (
          <form className="a-tarjeta a-form" onSubmit={enviar} noValidate>
            <h2>{titulos[modo]}</h2>
            {modo === "crear" && (
              <p className="a-ayuda">
                Solo se hace una vez. La clave de configuración es el valor de{" "}
                <code>ADMIN_SETUP_TOKEN</code> que pusiste en Cloudflare (o en <code>.env.local</code>{" "}
                si estás en local).
              </p>
            )}
            {modo === "recuperar" && (
              <p className="a-ayuda">
                Con la clave de configuración puedes poner una contraseña nueva. Se cerrarán todas
                las sesiones y se desactivará la verificación en dos pasos.
              </p>
            )}
            {modo === "codigo" && (
              <p className="a-ayuda">Escribe el código de 6 cifras de tu app de autenticación.</p>
            )}
            {modo === "sin-bd" ? (
              <div className="a-texto a-pequeno">
                <p>{error}</p>
                <p>
                  En Cloudflare: <strong>Storage &amp; Databases → D1 → Create</strong>. Después, en
                  el proyecto de Pages: <strong>Settings → Bindings → Add → D1 database</strong>,
                  con el nombre <code>DB</code>. Vuelve a desplegar y recarga esta página.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="a-alerta error" role="alert">
                    <Icono nombre="alerta" />
                    <div>{error}</div>
                  </div>
                )}
                {(modo === "crear" || modo === "recuperar") && (
                  <div className="a-campo">
                    <label htmlFor="token">Clave de configuración</label>
                    <input
                      id="token"
                      className="a-entrada"
                      type="password"
                      autoComplete="off"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                    {sesion && !sesion.claveDisponible && (
                      <p className="a-error-campo">
                        Todavía no has configurado ADMIN_SETUP_TOKEN en el servidor.
                      </p>
                    )}
                  </div>
                )}
                {modo !== "recuperar" && modo !== "codigo" && (
                  <div className="a-campo">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      className="a-entrada"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                )}
                {modo !== "codigo" && (
                  <div className="a-campo">
                    <label htmlFor="clave">{modo === "entrar" ? "Contraseña" : "Contraseña nueva"}</label>
                    <input
                      id="clave"
                      className="a-entrada"
                      type="password"
                      autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      minLength={modo === "entrar" ? undefined : 12}
                      required
                    />
                    {modo !== "entrar" && (
                      <p className="a-ayuda">Al menos 12 caracteres. Una frase larga es lo más seguro.</p>
                    )}
                  </div>
                )}
                {(modo === "crear" || modo === "recuperar") && (
                  <div className="a-campo">
                    <label htmlFor="repetir">Repite la contraseña</label>
                    <input
                      id="repetir"
                      className="a-entrada"
                      type="password"
                      autoComplete="new-password"
                      value={repetir}
                      onChange={(e) => setRepetir(e.target.value)}
                      required
                    />
                  </div>
                )}
                {modo === "codigo" && (
                  <div className="a-campo">
                    <label htmlFor="codigo">Código</label>
                    <input
                      id="codigo"
                      className="a-entrada a-mono"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9 ]*"
                      maxLength={7}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      style={{ fontSize: "1.3rem", letterSpacing: "0.3em", textAlign: "center" }}
                      autoFocus
                      required
                    />
                  </div>
                )}
                <button type="submit" className="a-boton" disabled={enviando}>
                  {enviando && <Giro />}
                  {modo === "crear" ? "Crear cuenta y entrar" : modo === "recuperar" ? "Cambiar contraseña y entrar" : "Entrar"}
                </button>
              </>
            )}
          </form>
        )}
        <p className="a-acceso-pie">
          {modo === "entrar" && (
            <button type="button" className="a-enlace" onClick={() => { setError(""); setModo("recuperar"); }}>
              ¿Has perdido el acceso?
            </button>
          )}
          {(modo === "recuperar" || modo === "codigo") && (
            <button type="button" className="a-enlace" onClick={() => { setError(""); setCodigo(""); setModo("entrar"); }}>
              Volver a la pantalla de acceso
            </button>
          )}
          {modo !== "recuperar" && modo !== "codigo" && modo !== "entrar" && <a href="/">Volver a la web</a>}
        </p>
      </div>
    </div>
  );
}
