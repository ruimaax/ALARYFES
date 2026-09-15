import { anotar } from "../bd";
import { leerJsonActual, listarBorradores } from "../borradores";
import { configAviso, enviarEmail } from "../aviso";
import { enviarAHoja } from "../contacto";
import { ErrorApi, json } from "../respuestas";
import { RUTA_CONTENIDO } from "../../cms/secciones";
import { leerAdmin, ruta, type Contexto } from "./contexto";

type Aviso = { nivel: "error" | "aviso" | "info"; texto: string; enlace?: string };
type Ajustes = {
  empresa: { direccion: string };
  seo: { indexar: boolean };
  mantenimiento: { activo: boolean };
};

async function avisos(c: Contexto): Promise<Aviso[]> {
  const lista: Aviso[] = [];
  const { secretos, repo } = c.entorno;
  if (!repo)
    lista.push({
      nivel: "error",
      texto: "GitHub no está conectado: no se puede leer ni publicar el contenido.",
      enlace: "/admin/ayuda",
    });
  const admin = await leerAdmin(c.db);
  if (admin && !admin.totp)
    lista.push({
      nivel: "aviso",
      texto: "Activa la verificación en dos pasos para proteger el panel.",
      enlace: "/admin/cuenta",
    });
  if (!secretos.CONTACT_WEBHOOK_URL)
    lista.push({
      nivel: "info",
      texto: "Google Sheets no está conectado: las solicitudes solo se guardan en este panel.",
      enlace: "/admin/ayuda",
    });
  if (!configAviso(secretos))
    lista.push({
      nivel: "info",
      texto: "No recibes un email con cada solicitud nueva.",
      enlace: "/admin/ayuda",
    });
  if (repo) {
    try {
      const ajustes = await leerJsonActual<Ajustes>(c.entorno, `${RUTA_CONTENIDO}/ajustes.json`);
      const planes = await leerJsonActual<{ fechaFinLanzamiento: string }>(
        c.entorno,
        `${RUTA_CONTENIDO}/planes.json`,
      );
      if (ajustes && !/\d/.test(ajustes.empresa.direccion))
        lista.push({
          nivel: "aviso",
          texto: `La dirección legal («${ajustes.empresa.direccion}») parece incompleta. La LSSI obliga a publicar la dirección completa.`,
          enlace: "/admin/contenido/editar?s=ajustes",
        });
      if (ajustes?.mantenimiento.activo)
        lista.push({
          nivel: "aviso",
          texto: "El modo mantenimiento está activo: los visitantes no ven la web.",
          enlace: "/admin/contenido/editar?s=ajustes",
        });
      if (ajustes && !ajustes.seo.indexar)
        lista.push({
          nivel: "aviso",
          texto: "Google tiene prohibido indexar la web.",
          enlace: "/admin/contenido/editar?s=ajustes",
        });
      if (planes) {
        const dias = Math.ceil(
          (Date.parse(`${planes.fechaFinLanzamiento}T23:59:59+01:00`) - Date.now()) / 86_400_000,
        );
        if (dias >= 0 && dias <= 45)
          lista.push({
            nivel: "info",
            texto: `Las tarifas de lanzamiento terminan en ${dias} ${dias === 1 ? "día" : "días"}. El cambio es automático.`,
            enlace: "/admin/contenido/editar?s=planes",
          });
      }
    } catch {
      /* Si GitHub falla, el panel sigue mostrando lo demás. */
    }
  }
  return lista;
}

export const rutasPanel = [
  // Contadores ligeros para la barra lateral: no consultan GitHub.
  ruta("GET", /^resumen$/, async (c) => {
    const nuevas = await c.db
      .prepare("SELECT count(*) AS n FROM solicitudes WHERE estado = 'nueva'")
      .first<{ n: number }>();
    const borradores = await c.db
      .prepare("SELECT count(*) AS n FROM borradores")
      .first<{ n: number }>();
    return json({ nuevas: nuevas?.n ?? 0, borradores: borradores?.n ?? 0 });
  }),

  ruta("GET", /^panel$/, async (c) => {
    const { results: porEstado } = await c.db
      .prepare("SELECT estado, count(*) AS n FROM solicitudes GROUP BY estado")
      .all<{ estado: string; n: number }>();
    const { results: ultimas } = await c.db
      .prepare(
        "SELECT id, creada, tipo, estado, nombre, negocio, referido_negocio FROM solicitudes ORDER BY creada DESC LIMIT 6",
      )
      .all();
    const semana = await c.db
      .prepare("SELECT count(*) AS n FROM solicitudes WHERE creada > ?")
      .bind(new Date(Date.now() - 7 * 86_400_000).toISOString())
      .first<{ n: number }>();
    const ultimaPublicacion = await c.db
      .prepare("SELECT * FROM publicaciones ORDER BY fecha DESC LIMIT 1")
      .first();
    return json({
      solicitudes: {
        porEstado: Object.fromEntries(porEstado.map((e) => [e.estado, e.n])),
        semana: semana?.n ?? 0,
        ultimas,
      },
      borradores: (await listarBorradores(c.db)).length,
      ultimaPublicacion,
      avisos: await avisos(c),
      modo: c.entorno.modo,
    });
  }),

  ruta("GET", /^sistema$/, async (c) => {
    const { secretos, repo, modo } = c.entorno;
    const admin = await leerAdmin(c.db);
    const repositorio = repo ? await repo.comprobar() : null;
    const aviso = configAviso(secretos);
    const comprobaciones = [
      { id: "bd", titulo: "Base de datos", estado: "ok", detalle: modo === "local" ? "SQLite local (.cms-local/cms.sqlite)" : "Cloudflare D1 conectada" },
      {
        id: "repo",
        titulo: "Contenido y publicación",
        estado: repositorio?.ok ? "ok" : "error",
        detalle: repositorio?.detalle ?? "Faltan GITHUB_TOKEN y GITHUB_REPO.",
      },
      {
        id: "clave",
        titulo: "Clave de recuperación (ADMIN_SETUP_TOKEN)",
        estado: secretos.ADMIN_SETUP_TOKEN ? "ok" : "aviso",
        detalle: secretos.ADMIN_SETUP_TOKEN
          ? "Configurada. Guárdala en tu gestor de contraseñas: sirve para recuperar el acceso."
          : "Sin ella no podrás recuperar el acceso si pierdes la contraseña.",
      },
      {
        id: "2fa",
        titulo: "Verificación en dos pasos",
        estado: admin?.totp ? "ok" : "aviso",
        detalle: admin?.totp ? "Activa." : "Desactivada. Actívala en Mi cuenta.",
      },
      {
        id: "sheets",
        titulo: "Copia en Google Sheets",
        estado: secretos.CONTACT_WEBHOOK_URL ? "ok" : "info",
        detalle: secretos.CONTACT_WEBHOOK_URL
          ? "Cada solicitud se envía también a la hoja."
          : "Opcional. Sin CONTACT_WEBHOOK_URL las solicitudes solo están en el panel.",
        prueba: secretos.CONTACT_WEBHOOK_URL ? "hoja" : undefined,
      },
      {
        id: "email",
        titulo: "Email con cada solicitud",
        estado: aviso ? "ok" : "info",
        detalle: aviso
          ? `Se envía a ${aviso.para} desde ${aviso.desde}.`
          : "Opcional. Necesita RESEND_API_KEY y AVISO_EMAIL_PARA.",
        prueba: aviso ? "aviso" : undefined,
      },
      {
        id: "hook",
        titulo: "Recompilar desde el panel",
        estado: secretos.CLOUDFLARE_DEPLOY_HOOK ? "ok" : "info",
        detalle: secretos.CLOUDFLARE_DEPLOY_HOOK
          ? "Botón «Recompilar la web» disponible en Publicar."
          : "Opcional. Necesita CLOUDFLARE_DEPLOY_HOOK.",
      },
      {
        id: "analitica",
        titulo: "Analítica de Cloudflare",
        estado:
          secretos.CLOUDFLARE_API_TOKEN &&
          secretos.CLOUDFLARE_ACCOUNT_ID &&
          secretos.CLOUDFLARE_SITE_HOST
            ? "ok"
            : "info",
        detalle:
          secretos.CLOUDFLARE_API_TOKEN &&
          secretos.CLOUDFLARE_ACCOUNT_ID &&
          secretos.CLOUDFLARE_SITE_HOST
            ? "Tráfico, rendimiento y métricas de Functions disponibles en Analítica."
            : "Opcional. Activa Web Analytics y configura el token, la cuenta y el identificador del sitio.",
      },
    ];
    return json({ comprobaciones, modo });
  }),

  ruta("POST", /^sistema\/probar-aviso$/, async (c) => {
    const cfg = configAviso(c.entorno.secretos);
    if (!cfg) throw new ErrorApi("Los avisos por email no están configurados.", 409);
    try {
      await enviarEmail(
        cfg,
        "Prueba de avisos del panel de ALARYFES",
        "Si lees esto, recibirás un email con cada solicitud nueva de la web.",
      );
    } catch (error) {
      throw new ErrorApi(`No se ha podido enviar: ${(error as Error).message}`, 502);
    }
    await anotar(c.db, "sistema.prueba-email", cfg.para, c.ip);
    return json({ ok: true, mensaje: `Email enviado a ${cfg.para}.` });
  }),

  ruta("POST", /^sistema\/probar-hoja$/, async (c) => {
    const { CONTACT_WEBHOOK_URL: webhook, CONTACT_WEBHOOK_TOKEN: webhookToken } = c.entorno.secretos;
    if (!webhook) throw new ErrorApi("No hay ninguna hoja conectada.", 409);
    const ok = await enviarAHoja({ webhook, webhookToken }, `prueba-${Date.now()}`, new Date().toISOString(), {
      tipo: "contacto",
      nombre: "Prueba desde el panel",
      negocio: "ALARYFES",
      telefono: "000000000",
      sector: "Prueba",
      plan: "",
      mensaje: "Fila de prueba enviada desde /admin. Puedes borrarla.",
      consentimiento: true,
    });
    if (!ok) throw new ErrorApi("La hoja no ha respondido correctamente.", 502);
    await anotar(c.db, "sistema.prueba-hoja", "", c.ip);
    return json({ ok: true, mensaje: "La hoja ha recibido una fila de prueba." });
  }),

  ruta("GET", /^registro$/, async (c) => {
    const pagina = Math.max(1, Number(c.url.searchParams.get("pagina")) || 1);
    const { results } = await c.db
      .prepare("SELECT * FROM registro ORDER BY id DESC LIMIT 50 OFFSET ?")
      .bind((pagina - 1) * 50)
      .all();
    const total = await c.db.prepare("SELECT count(*) AS n FROM registro").first<{ n: number }>();
    return json({ registro: results, pagina, total: total?.n ?? 0, porPagina: 50 });
  }),
];
