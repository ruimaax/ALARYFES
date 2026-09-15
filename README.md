# ALARYFES

Web corporativa en Next.js 16.3 (App Router y TypeScript), exportada como HTML estático en Cloudflare Pages. Incluye un CMS propio en `/admin`: los borradores viven en Cloudflare D1 y cada publicación crea un único commit en GitHub para que Pages vuelva a compilar la web.

## Desarrollo local

Requiere Node.js 22 o posterior.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Escribe en `.env.local` un `ADMIN_SETUP_TOKEN` largo y abre `http://localhost:3000/admin/login`. En local el panel usa SQLite en `.cms-local/` y «Publicar» escribe directamente en `src/content/` y `public/media/`. No actives `CMS_LOCAL_GITHUB` salvo que quieras probar deliberadamente contra GitHub.

Comprobaciones habituales:

```sh
npm run typecheck
npm test
npm run build:pages
```

## Contenido y funcionamiento

- `src/content/*.json` contiene páginas, planes, configuración, textos legales, redirecciones e índice del blog.
- `src/content/blog/<slug>.md` contiene el cuerpo Markdown de cada artículo.
- `public/media/` contiene imágenes y PDF.
- Los artículos futuros aparecen con la primera recompilación de su fecha.
- Las tarifas cambian automáticamente el 1 de enero de 2027; la recompilación diaria actualiza también el HTML estático.
- Las solicitudes se guardan en D1. `CONTACT_WEBHOOK_URL` añade una copia en Google Sheets y Resend puede enviar un aviso por email.

## Puesta en marcha en Cloudflare Pages

### 1. Conectar el repositorio

En Cloudflare → Workers y Pages → Crear → Pages → Conectar a Git, selecciona este repositorio. Configura:

| Ajuste | Valor |
| --- | --- |
| Comando de compilación | `npm run build:pages` |
| Directorio de salida | `out` |
| Variable de compilación | `NODE_VERSION=22` |

El script comprueba TypeScript, aparta temporalmente las Route Handlers incompatibles con la exportación, ejecuta `next build` y restaura siempre los archivos. Después crea `out/_redirects` y `out/_headers`; `public/_routes.json` hace que Functions atienda `/api/*` y proteja `/admin*`.

### 2. Crear y vincular D1

En Workers y Pages → D1 SQL Database crea una base para el CMS. En el proyecto de Pages → Configuración → Enlaces, añade un enlace D1 con el nombre exacto `DB`. Las tablas se crean automáticamente en el primer acceso.

### 3. Crear el token de GitHub

Crea un token personal fine-grained limitado únicamente al repositorio `ruimaax/ALARYFES`. Permisos del repositorio:

- Contents: Read and write.
- Commit statuses: Read-only.
- Checks: Read-only.

No uses un token clásico ni le des acceso a otros repositorios.

### 4. Añadir variables y secretos en Cloudflare

En el proyecto de Pages → Configuración → Variables y secretos añade, como secretos cuando contengan credenciales:

| Variable | Uso |
| --- | --- |
| `ADMIN_SETUP_TOKEN` | Primer acceso y recuperación; valor largo y aleatorio |
| `GITHUB_TOKEN` | Token fine-grained del paso anterior |
| `GITHUB_REPO` | `ruimaax/ALARYFES` |
| `GITHUB_BRANCH` | `main` |
| `CONTACT_WEBHOOK_URL` | Opcional: copia de solicitudes en Google Sheets |
| `CONTACT_WEBHOOK_TOKEN` | Opcional: autenticación del webhook |
| `RESEND_API_KEY` | Opcional: avisos por email |
| `AVISO_EMAIL_PARA` | Opcional: destinatario de los avisos |
| `AVISO_EMAIL_DESDE` | Opcional: remitente verificado en Resend |
| `CLOUDFLARE_DEPLOY_HOOK` | Recompilar desde el panel |
| `CLOUDFLARE_API_TOKEN` | Token solo lectura con `Account Analytics: Read` para `/admin/analitica` |
| `CLOUDFLARE_ACCOUNT_ID` | ID de la cuenta de Cloudflare |
| `CLOUDFLARE_SITE_HOST` | Dominio medido por Web Analytics (`alaryfes.com`) |
| `CLOUDFLARE_WORKER_NAME` | Nombre del Worker de Pages para aislar CPU y errores |
| `NEXT_PUBLIC_GA_ID` | Opcional: Google Analytics |
| `NEXT_PUBLIC_META_PIXEL_ID` | Opcional: Meta Pixel |

Los datos públicos de empresa, contacto y legal salen de `src/content/ajustes.json`, no de variables `NEXT_PUBLIC_*`.

### 5. Crear el Deploy Hook

En Pages → Configuración → Compilaciones y despliegues crea un Deploy Hook para la rama `main`. Guarda su URL en Cloudflare como `CLOUDFLARE_DEPLOY_HOOK`.

En GitHub → repositorio → Settings → Secrets and variables → Actions, crea también el secreto `CLOUDFLARE_DEPLOY_HOOK`. El workflow `.github/workflows/recompilar-diario.yml` lo llama alrededor de las 00:10 de Madrid para los artículos programados y el cambio de tarifas. Si el secreto no existe, el workflow termina sin hacer la llamada.

### 6. Crear la cuenta del panel

Tras el primer despliegue abre `https://tu-dominio/admin/login`, elige crear la cuenta y usa `ADMIN_SETUP_TOKEN`. Crea una contraseña de al menos 12 caracteres y activa 2FA en Mi cuenta. Conserva el token de configuración en un gestor de contraseñas: también sirve para recuperar el acceso.

### 7. Comprobar la instalación

En `/admin/ayuda` verifica D1, GitHub, el Deploy Hook y, si los configuraste, Google Sheets y Resend. Haz un cambio pequeño, guárdalo como borrador y publícalo; Cloudflare debe mostrar la nueva versión normalmente en 1–3 minutos.

## Vista previa de Pages en local

Después de `npm run build:pages`:

```sh
npm run preview:pages
```

Wrangler usa el enlace D1 `DB`. Los secretos locales de esta vista previa van en `.dev.vars`, que está excluido de Git. Para el desarrollo normal con Next usa `.env.local`.

## Formularios y privacidad

`POST /api/contacto` valida el origen y el cuerpo, limita frecuencia, ignora el honeypot y guarda la solicitud en D1. Si existe `CONTACT_WEBHOOK_URL`, envía además una copia neutralizada para evitar fórmulas de hoja de cálculo. Si Resend está configurado, envía un aviso sin sustituir el almacenamiento principal.

Los IDs de Google Analytics y Meta Pixel solo cargan sus proveedores cuando son válidos y el visitante acepta la medición. Los campos de los formularios no se incluyen en analítica.

## Analítica integrada en el CMS

Activa primero Web Analytics en Cloudflare. Crea después un API Token de solo lectura con `Account Analytics: Read` y añade las cuatro variables `CLOUDFLARE_*` indicadas arriba a producción y vista previa. El identificador de cuenta aparece en la portada de la cuenta. Usa `alaryfes.com` como dominio de Web Analytics. El nombre del Worker se puede copiar desde Workers y Pages y sirve para que las cifras de Functions no sumen otros proyectos de la cuenta.

`/admin/analitica` muestra visitas y páginas vistas por día, comparativa con el periodo anterior, páginas, procedencia, países, dispositivos, navegadores, Core Web Vitals, invocaciones, errores, subsolicitudes y percentiles de CPU y duración. Cloudflare Pages/Workers no expone consumo de RAM por Function: el panel lo señala como memoria gestionada en lugar de inventar una cifra.

## Verificación técnica

```sh
npx tsc --noEmit
npm test
npm run build:pages
npx wrangler pages functions build --outdir "$(mktemp -d)"
```

Para comprobar la exportación con un servidor que resuelve las rutas como Pages:

```sh
node tests/servidor-estatico.mjs out
TEST_BASE_URL=http://127.0.0.1:4321 node tests/browser-check.mjs
```

No publiques ni hagas push desde el panel local salvo que hayas activado conscientemente `CMS_LOCAL_GITHUB`.
