"use client";

import { FormEvent, useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import { api, mensajeDe } from "../_lib/api";
import { fechaHora } from "../_lib/formato";
import { useAviso } from "../_componentes/avisos";
import { Cabecera, Cargando, Chip, ErrorCarga, Giro, useCarga, useTitulo } from "../_componentes/comunes";
import { useConfirmar } from "../_componentes/dialogo";
import { Icono } from "../_componentes/icono";

type Sesion = { id: string; creada: string; visto: string; ip: string; agente: string; actual: boolean };
type Cuenta = { email: string; dosPasos: boolean; sesiones: Sesion[] };
type Preparacion2FA = { secreto: string; uri: string };

function dispositivo(ua: string) {
  const navegador = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador desconocido";
  const sistema = /iPhone|iPad/.test(ua) ? "iOS/iPadOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Sistema desconocido";
  return `${navegador} · ${sistema}`;
}

export default function Cuenta() {
  useTitulo("Mi cuenta");
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { datos, setDatos, error, cargando, recargar } = useCarga(() => api<Cuenta>("cuenta"));
  const [email, setEmail] = useState("");
  const [claveEmail, setClaveEmail] = useState("");
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repeticion, setRepeticion] = useState("");
  const [preparacion, setPreparacion] = useState<Preparacion2FA | null>(null);
  const [codigo, setCodigo] = useState("");
  const [clave2FA, setClave2FA] = useState("");
  const [ocupado, setOcupado] = useState("");

  const qr = useMemo(() => {
    if (!preparacion) return "";
    const codigoQr = qrcode(0, "M");
    codigoQr.addData(preparacion.uri);
    codigoQr.make();
    return codigoQr.createDataURL(5, 2);
  }, [preparacion]);

  const cambiarEmail = async (e: FormEvent) => {
    e.preventDefault();
    setOcupado("email");
    try {
      await api("cuenta/email", { metodo: "POST", cuerpo: { email, clave: claveEmail } });
      avisar("Email actualizado.");
      setClaveEmail("");
      recargar();
    } catch (err) {
      avisar(mensajeDe(err), "error");
    } finally {
      setOcupado("");
    }
  };

  const cambiarClave = async (e: FormEvent) => {
    e.preventDefault();
    if (nueva.length < 12) return avisar("La contraseña nueva debe tener al menos 12 caracteres.", "error");
    if (nueva !== repeticion) return avisar("Las contraseñas nuevas no coinciden.", "error");
    setOcupado("clave");
    try {
      await api("cuenta/clave", { metodo: "POST", cuerpo: { actual, nueva } });
      avisar("Contraseña actualizada. Se han cerrado las demás sesiones.");
      setActual(""); setNueva(""); setRepeticion("");
      recargar();
    } catch (err) {
      avisar(mensajeDe(err), "error");
    } finally {
      setOcupado("");
    }
  };

  const iniciar2FA = async () => {
    setOcupado("2fa");
    try {
      setPreparacion(await api<Preparacion2FA>("cuenta/2fa/iniciar", { metodo: "POST" }));
    } catch (e) {
      avisar(mensajeDe(e), "error");
    } finally {
      setOcupado("");
    }
  };
  const activar2FA = async (e: FormEvent) => {
    e.preventDefault();
    setOcupado("activar2fa");
    try {
      await api("cuenta/2fa/activar", { metodo: "POST", cuerpo: { codigo } });
      avisar("Verificación en dos pasos activada.");
      setPreparacion(null); setCodigo("");
      recargar();
    } catch (err) {
      avisar(mensajeDe(err), "error");
    } finally {
      setOcupado("");
    }
  };
  const desactivar2FA = async (e: FormEvent) => {
    e.preventDefault();
    if (!(await confirmar({ titulo: "¿Desactivar la verificación en dos pasos?", texto: "La cuenta quedará protegida solo por la contraseña.", boton: "Desactivar", peligro: true }))) return;
    setOcupado("desactivar2fa");
    try {
      await api("cuenta/2fa/desactivar", { metodo: "POST", cuerpo: { clave: clave2FA } });
      avisar("Verificación en dos pasos desactivada.");
      setClave2FA("");
      recargar();
    } catch (err) {
      avisar(mensajeDe(err), "error");
    } finally {
      setOcupado("");
    }
  };

  const cerrarSesion = async (sesion: Sesion) => {
    if (sesion.actual) return;
    if (!(await confirmar({ titulo: "¿Cerrar esta sesión?", texto: dispositivo(sesion.agente), boton: "Cerrar sesión", peligro: true }))) return;
    try {
      await api(`cuenta/sesiones/${sesion.id}`, { metodo: "DELETE" });
      avisar("Sesión cerrada.");
      setDatos((d) => d ? { ...d, sesiones: d.sesiones.filter((s) => s.id !== sesion.id) } : d);
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };
  const cerrarOtras = async () => {
    if (!(await confirmar({ titulo: "¿Cerrar las demás sesiones?", texto: "Este dispositivo seguirá conectado.", boton: "Cerrar las demás", peligro: true }))) return;
    try {
      await api("cuenta/sesiones/cerrar-otras", { metodo: "POST" });
      avisar("Se han cerrado las demás sesiones.");
      recargar();
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  if (cargando && !datos)
    return (
      <div className="a-contenedor">
        <Cabecera titulo="Mi cuenta" descripcion="Datos de acceso, verificación en dos pasos y dispositivos conectados." />
        <Cargando />
      </div>
    );
  if (error || !datos)
    return (
      <div className="a-contenedor">
        <Cabecera titulo="Mi cuenta" descripcion="Datos de acceso, verificación en dos pasos y dispositivos conectados." />
        <ErrorCarga error={error || "No se ha podido cargar la cuenta."} reintentar={recargar} />
      </div>
    );
  return (
    <div className="a-contenedor">
      <Cabecera titulo="Mi cuenta" descripcion="Datos de acceso, verificación en dos pasos y dispositivos conectados." />
      <div className="a-dos">
        <div className="a-apilado">
          <form className="a-tarjeta a-form" onSubmit={cambiarEmail}>
            <h2>Cambiar email</h2>
            <div className="a-campo"><label htmlFor="cuenta-email">Email nuevo</label><input id="cuenta-email" className="a-entrada" type="email" required value={email} placeholder={datos.email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="a-campo"><label htmlFor="cuenta-email-clave">Contraseña actual</label><input id="cuenta-email-clave" className="a-entrada" type="password" required value={claveEmail} autoComplete="current-password" onChange={(e) => setClaveEmail(e.target.value)} /></div>
            <div className="a-acciones"><button className="a-boton" disabled={ocupado === "email"}>{ocupado === "email" && <Giro />} Cambiar email</button></div>
          </form>
          <form className="a-tarjeta a-form" onSubmit={cambiarClave}>
            <h2>Cambiar contraseña</h2>
            <div className="a-campo"><label htmlFor="clave-actual">Contraseña actual</label><input id="clave-actual" className="a-entrada" type="password" required value={actual} autoComplete="current-password" onChange={(e) => setActual(e.target.value)} /></div>
            <div className="a-campo"><label htmlFor="clave-nueva">Contraseña nueva</label><input id="clave-nueva" className="a-entrada" type="password" required minLength={12} value={nueva} autoComplete="new-password" onChange={(e) => setNueva(e.target.value)} /><span className="a-ayuda">12 caracteres como mínimo.</span></div>
            <div className="a-campo"><label htmlFor="clave-repetir">Repite la contraseña nueva</label><input id="clave-repetir" className="a-entrada" type="password" required minLength={12} value={repeticion} autoComplete="new-password" onChange={(e) => setRepeticion(e.target.value)} /></div>
            <div className="a-acciones"><button className="a-boton" disabled={ocupado === "clave"}>{ocupado === "clave" && <Giro />} Cambiar contraseña</button></div>
          </form>
        </div>
        <section className="a-tarjeta a-form">
          <div className="a-tarjeta-cabecera"><h2>Verificación en dos pasos</h2><Chip tono={datos.dosPasos ? "ok" : "aviso"}>{datos.dosPasos ? "Activa" : "Desactivada"}</Chip></div>
          {datos.dosPasos ? (
            <form className="a-form" onSubmit={desactivar2FA}>
              <p className="a-suave">Al entrar se pide un código temporal de tu aplicación de autenticación.</p>
              <div className="a-campo"><label htmlFor="clave-2fa">Contraseña actual</label><input id="clave-2fa" className="a-entrada" type="password" required value={clave2FA} onChange={(e) => setClave2FA(e.target.value)} /></div>
              <div className="a-acciones"><button className="a-boton peligro" disabled={ocupado === "desactivar2fa"}>Desactivar 2FA</button></div>
            </form>
          ) : preparacion ? (
            <form className="a-form" onSubmit={activar2FA}>
              <p>Escanea el código con tu aplicación de autenticación.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}<img className="a-qr" src={qr} alt="Código QR para configurar la verificación en dos pasos" />
              <div><p className="a-ayuda">Si no puedes escanearlo, escribe este secreto:</p><p className="a-codigo-grande">{preparacion.secreto}</p></div>
              <div className="a-campo"><label htmlFor="codigo-2fa">Código de seis cifras</label><input id="codigo-2fa" className="a-entrada" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} /></div>
              <div className="a-acciones"><button className="a-boton" disabled={ocupado === "activar2fa"}>{ocupado === "activar2fa" && <Giro />} Activar</button><button type="button" className="a-boton secundario" onClick={() => setPreparacion(null)}>Cancelar</button></div>
            </form>
          ) : (
            <><p className="a-suave">Añade una segunda comprobación aunque alguien averigüe tu contraseña.</p><div className="a-acciones"><button type="button" className="a-boton" onClick={iniciar2FA} disabled={ocupado === "2fa"}><Icono nombre="escudo" /> Configurar 2FA</button></div></>
          )}
        </section>
      </div>
      <section className="a-tarjeta a-separado">
        <div className="a-tarjeta-cabecera"><h2>Sesiones abiertas</h2>{datos.sesiones.some((s) => !s.actual) && <button type="button" className="a-boton peligro pequeno" onClick={cerrarOtras}>Cerrar todas las demás</button>}</div>
        <ul className="a-filas">
          {datos.sesiones.map((s) => (
            <li key={s.id}>
              <div className="texto"><strong>{dispositivo(s.agente)} {s.actual && <Chip tono="ok">Esta sesión</Chip>}</strong><span>Última actividad: {fechaHora(s.visto)} · Creada: {fechaHora(s.creada)} · IP {s.ip || "no disponible"}</span></div>
              {!s.actual && <button type="button" className="a-boton peligro pequeno" onClick={() => cerrarSesion(s)}>Cerrar sesión</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
