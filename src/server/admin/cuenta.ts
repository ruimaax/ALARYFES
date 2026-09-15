import { ahora, anotar } from "../bd";
import {
  hashClave,
  iguales,
  nuevoSecretoTotp,
  pasoTotp,
  verificarClave,
} from "../cripto";
import { ErrorApi, json, leerJson, texto } from "../respuestas";
import {
  anotarFallo,
  cerrarSesion,
  crearSesion,
  limitesAcceso,
  limpiarFallos,
  segundosBloqueado,
  sesionActual,
} from "../sesion";
import { PATRON_EMAIL } from "../../cms/esquema";
import { leerAdmin, ruta, type Contexto } from "./contexto";

function validarClaveNueva(clave: string) {
  if (clave.length < 12)
    throw new ErrorApi("La contraseña debe tener al menos 12 caracteres.", 422);
  if (clave.length > 200) throw new ErrorApi("La contraseña es demasiado larga.", 422);
}
function validarEmail(email: string) {
  if (!PATRON_EMAIL.test(email)) throw new ErrorApi("Escribe un email válido.", 422);
}
async function esperaSiBloqueado(c: Contexto) {
  const segundos = await segundosBloqueado(c.db, limitesAcceso(c.request));
  if (segundos)
    throw new ErrorApi(
      `Demasiados intentos fallidos. Vuelve a probar en ${Math.ceil(segundos / 60)} minutos.`,
      429,
    );
}
async function comprobarToken(c: Contexto, token: string) {
  const esperado = c.entorno.secretos.ADMIN_SETUP_TOKEN;
  if (!esperado)
    throw new ErrorApi(
      "Falta el secreto ADMIN_SETUP_TOKEN. Añádelo en Cloudflare (o en .env.local en local) y vuelve a desplegar.",
      503,
    );
  if (!iguales(token, esperado)) {
    await anotarFallo(c.db, limitesAcceso(c.request));
    await anotar(c.db, "acceso.clave-configuracion-incorrecta", "", c.ip);
    throw new ErrorApi("La clave de configuración no es correcta.", 401);
  }
}

// Rutas públicas: se pueden usar sin sesión.
export const rutasSesion = [
  ruta("GET", /^sesion$/, async (c) => {
    const admin = await leerAdmin(c.db);
    const sesion = admin ? await sesionActual(c.db, c.request, false) : null;
    return json({
      configurado: !!admin,
      autenticado: !!sesion,
      email: sesion ? admin!.email : undefined,
      modo: c.entorno.modo,
      claveDisponible: !!c.entorno.secretos.ADMIN_SETUP_TOKEN,
    });
  }),

  ruta("POST", /^sesion\/entrar$/, async (c) => {
    await esperaSiBloqueado(c);
    const cuerpo = await leerJson(c.request);
    const email = texto(cuerpo.email, 200).toLowerCase();
    const clave = typeof cuerpo.clave === "string" ? cuerpo.clave : "";
    const codigo = texto(cuerpo.codigo, 20);
    const admin = await leerAdmin(c.db);
    if (!admin)
      throw new ErrorApi("Todavía no hay cuenta de administrador.", 409, {
        codigo: "sin-cuenta",
      });
    // La contraseña se comprueba siempre, aunque el email no coincida, para
    // no revelar por el tiempo de respuesta cuál de los dos falla.
    const claveBien = await verificarClave(clave, admin.clave);
    if (!claveBien || !iguales(email, admin.email.toLowerCase())) {
      await anotarFallo(c.db, limitesAcceso(c.request));
      await anotar(c.db, "acceso.fallido", email, c.ip);
      throw new ErrorApi("Email o contraseña incorrectos.", 401);
    }
    if (admin.totp) {
      if (!codigo)
        return json({ ok: false, necesitaCodigo: true, mensaje: "Escribe el código de tu app." });
      const paso = await pasoTotp(admin.totp, codigo);
      if (paso === null || paso <= admin.totp_ultimo) {
        await anotarFallo(c.db, limitesAcceso(c.request));
        await anotar(c.db, "acceso.codigo-incorrecto", "", c.ip);
        throw new ErrorApi("Código incorrecto o ya utilizado.", 401, { necesitaCodigo: true });
      }
      await c.db
        .prepare("UPDATE administrador SET totp_ultimo = ? WHERE id = 1")
        .bind(paso)
        .run();
    }
    await limpiarFallos(c.db, c.request);
    const cookie = await crearSesion(c.db, c.request);
    await anotar(c.db, "acceso", "", c.ip);
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }),

  ruta("POST", /^sesion\/configurar$/, async (c) => {
    await esperaSiBloqueado(c);
    const cuerpo = await leerJson(c.request);
    if (await leerAdmin(c.db))
      throw new ErrorApi(
        "La cuenta ya existe. Si has perdido el acceso, usa «Recuperar acceso».",
        409,
      );
    await comprobarToken(c, texto(cuerpo.token, 500));
    const email = texto(cuerpo.email, 200).toLowerCase();
    const clave = typeof cuerpo.clave === "string" ? cuerpo.clave : "";
    validarEmail(email);
    validarClaveNueva(clave);
    const t = ahora();
    await c.db
      .prepare(
        "INSERT INTO administrador (id, email, clave, totp_ultimo, creado, actualizado) VALUES (1, ?, ?, 0, ?, ?)",
      )
      .bind(email, await hashClave(clave), t, t)
      .run();
    await limpiarFallos(c.db, c.request);
    const cookie = await crearSesion(c.db, c.request);
    await anotar(c.db, "cuenta.creada", email, c.ip);
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }),

  ruta("POST", /^sesion\/recuperar$/, async (c) => {
    await esperaSiBloqueado(c);
    const cuerpo = await leerJson(c.request);
    if (!(await leerAdmin(c.db)))
      throw new ErrorApi("Todavía no hay cuenta: créala primero.", 409);
    await comprobarToken(c, texto(cuerpo.token, 500));
    const clave = typeof cuerpo.clave === "string" ? cuerpo.clave : "";
    validarClaveNueva(clave);
    // Recuperar cierra todas las sesiones y desactiva la verificación en dos
    // pasos: quien la recupera vuelve a empezar limpio.
    await c.db.batch([
      c.db
        .prepare(
          "UPDATE administrador SET clave = ?, totp = NULL, totp_pendiente = NULL, actualizado = ? WHERE id = 1",
        )
        .bind(await hashClave(clave), ahora()),
      c.db.prepare("DELETE FROM sesiones"),
    ]);
    await limpiarFallos(c.db, c.request);
    const cookie = await crearSesion(c.db, c.request);
    await anotar(c.db, "cuenta.recuperada", "", c.ip);
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }),

  ruta("POST", /^sesion\/salir$/, async (c) => {
    const cookie = await cerrarSesion(c.db, c.request);
    await anotar(c.db, "salida", "", c.ip);
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }),
];

async function exigirClave(c: Contexto, clave: unknown) {
  const admin = (await leerAdmin(c.db))!;
  if (typeof clave !== "string" || !(await verificarClave(clave, admin.clave))) {
    await anotarFallo(c.db, limitesAcceso(c.request));
    throw new ErrorApi("La contraseña actual no es correcta.", 401);
  }
  return admin;
}

export const rutasCuenta = [
  ruta("GET", /^cuenta$/, async (c) => {
    const admin = (await leerAdmin(c.db))!;
    const { results } = await c.db
      .prepare("SELECT id, creada, visto, ip, agente FROM sesiones WHERE expira > ? ORDER BY visto DESC")
      .bind(ahora())
      .all<{ id: string; creada: string; visto: string; ip: string; agente: string }>();
    return json({
      email: admin.email,
      dosPasos: !!admin.totp,
      sesiones: results.map((s) => ({
        ...s,
        id: s.id.slice(0, 12),
        actual: s.id === c.sesion!.id,
      })),
    });
  }),

  ruta("POST", /^cuenta\/clave$/, async (c) => {
    await esperaSiBloqueado(c);
    const cuerpo = await leerJson(c.request);
    await exigirClave(c, cuerpo.actual);
    const nueva = typeof cuerpo.nueva === "string" ? cuerpo.nueva : "";
    validarClaveNueva(nueva);
    await c.db.batch([
      c.db
        .prepare("UPDATE administrador SET clave = ?, actualizado = ? WHERE id = 1")
        .bind(await hashClave(nueva), ahora()),
      c.db.prepare("DELETE FROM sesiones WHERE id != ?").bind(c.sesion!.id),
    ]);
    await anotar(c.db, "cuenta.contraseña", "Se cerraron las demás sesiones", c.ip);
    return json({ ok: true });
  }),

  ruta("POST", /^cuenta\/email$/, async (c) => {
    await esperaSiBloqueado(c);
    const cuerpo = await leerJson(c.request);
    await exigirClave(c, cuerpo.clave);
    const email = texto(cuerpo.email, 200).toLowerCase();
    validarEmail(email);
    await c.db
      .prepare("UPDATE administrador SET email = ?, actualizado = ? WHERE id = 1")
      .bind(email, ahora())
      .run();
    await anotar(c.db, "cuenta.email", email, c.ip);
    return json({ ok: true });
  }),

  ruta("POST", /^cuenta\/2fa\/iniciar$/, async (c) => {
    const admin = (await leerAdmin(c.db))!;
    const secreto = nuevoSecretoTotp();
    await c.db
      .prepare("UPDATE administrador SET totp_pendiente = ? WHERE id = 1")
      .bind(secreto)
      .run();
    const etiqueta = encodeURIComponent(`ALARYFES:${admin.email}`);
    return json({
      secreto,
      uri: `otpauth://totp/${etiqueta}?secret=${secreto}&issuer=ALARYFES&algorithm=SHA1&digits=6&period=30`,
    });
  }),

  ruta("POST", /^cuenta\/2fa\/activar$/, async (c) => {
    const cuerpo = await leerJson(c.request);
    const admin = (await leerAdmin(c.db))!;
    if (!admin.totp_pendiente)
      throw new ErrorApi("Empieza de nuevo la activación.", 409);
    const paso = await pasoTotp(admin.totp_pendiente, texto(cuerpo.codigo, 20));
    if (paso === null)
      throw new ErrorApi(
        "El código no coincide. Comprueba que la hora del móvil es automática.",
        422,
      );
    await c.db
      .prepare(
        "UPDATE administrador SET totp = totp_pendiente, totp_pendiente = NULL, totp_ultimo = ?, actualizado = ? WHERE id = 1",
      )
      .bind(paso, ahora())
      .run();
    await anotar(c.db, "cuenta.2fa-activada", "", c.ip);
    return json({ ok: true });
  }),

  ruta("POST", /^cuenta\/2fa\/desactivar$/, async (c) => {
    await esperaSiBloqueado(c);
    await exigirClave(c, (await leerJson(c.request)).clave);
    await c.db
      .prepare("UPDATE administrador SET totp = NULL, totp_pendiente = NULL, actualizado = ? WHERE id = 1")
      .bind(ahora())
      .run();
    await anotar(c.db, "cuenta.2fa-desactivada", "", c.ip);
    return json({ ok: true });
  }),

  ruta("DELETE", /^cuenta\/sesiones\/([a-f0-9]{12})$/, async (c) => {
    await c.db
      .prepare("DELETE FROM sesiones WHERE substr(id, 1, 12) = ? AND id != ?")
      .bind(c.params[0], c.sesion!.id)
      .run();
    await anotar(c.db, "cuenta.sesion-cerrada", c.params[0], c.ip);
    return json({ ok: true });
  }),

  ruta("POST", /^cuenta\/sesiones\/cerrar-otras$/, async (c) => {
    await c.db.prepare("DELETE FROM sesiones WHERE id != ?").bind(c.sesion!.id).run();
    await anotar(c.db, "cuenta.sesiones-cerradas", "", c.ip);
    return json({ ok: true });
  }),
];
