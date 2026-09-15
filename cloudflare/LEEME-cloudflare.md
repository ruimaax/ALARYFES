# ALARYFES en Cloudflare Pages

Esta instalación usa integración Git: Cloudflare compila el repositorio y el panel publica contenido mediante commits. No se sube una carpeta manualmente.

## Configuración paso a paso

1. En Cloudflare → Workers y Pages crea un proyecto Pages conectado al repositorio. Usa `npm run build:pages`, directorio de salida `out` y variable `NODE_VERSION=22`.
2. Crea una base Cloudflare D1 y añádela al proyecto de Pages como enlace con el nombre exacto `DB`.
3. En GitHub crea un token fine-grained limitado a este repositorio. Concede Contents: Read and write, Commit statuses: Read-only y Checks: Read-only.
4. En Variables y secretos de Pages configura `ADMIN_SETUP_TOKEN`, `GITHUB_TOKEN`, `GITHUB_REPO=ruimaax/ALARYFES` y `GITHUB_BRANCH=main`. Añade opcionalmente Google Sheets (`CONTACT_WEBHOOK_URL` y `CONTACT_WEBHOOK_TOKEN`) y avisos (`RESEND_API_KEY`, `AVISO_EMAIL_PARA`, `AVISO_EMAIL_DESDE`). Para la sección Analítica, activa Web Analytics, crea un token de solo lectura con `Account Analytics: Read` y configura `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_SITE_HOST=alaryfes.com` y, preferiblemente, `CLOUDFLARE_WORKER_NAME`.
5. Crea un Deploy Hook de Pages para `main`. Guárdalo como `CLOUDFLARE_DEPLOY_HOOK` tanto en Pages como en los secretos de Actions del repositorio. Así funcionan el botón de recompilar y la tarea diaria.
6. Despliega y abre `/admin/login`. Crea la única cuenta de administración con `ADMIN_SETUP_TOKEN`, email y una contraseña de 12 caracteres como mínimo.
7. En `/admin/ayuda` comprueba el sistema y prueba las conexiones opcionales.

## Qué ocurre al publicar

Los formularios del panel guardan borradores en D1. «Publicar» crea un único commit en GitHub y borra de D1 únicamente los borradores incluidos. Cloudflare detecta el commit, compila con `npm run build:pages` y cambia la web cuando la compilación termina. Mientras tanto, o si falla, sigue visible la versión anterior.

El workflow diario llama al Deploy Hook alrededor de las 00:10 de Madrid. Esto hace visibles los artículos programados y actualiza las tarifas el 1 de enero de 2027 aunque nadie haga un commit ese día.

## Variables

| Nombre | Obligatoria | Finalidad |
| --- | --- | --- |
| `ADMIN_SETUP_TOKEN` | Sí | Alta y recuperación de la cuenta |
| `GITHUB_TOKEN` | Sí | Leer y publicar contenido |
| `GITHUB_REPO` | Sí | `ruimaax/ALARYFES` |
| `GITHUB_BRANCH` | Sí | `main` |
| `CLOUDFLARE_DEPLOY_HOOK` | Recomendada | Recompilación manual y diaria |
| `CLOUDFLARE_API_TOKEN` | Para Analítica | Token con `Account Analytics: Read` |
| `CLOUDFLARE_ACCOUNT_ID` | Para Analítica | ID de la cuenta |
| `CLOUDFLARE_SITE_HOST` | Para Analítica web | Dominio medido (`alaryfes.com`) |
| `CLOUDFLARE_WORKER_NAME` | Recomendada | Aísla las métricas de Functions del proyecto |
| `CONTACT_WEBHOOK_URL` | No | Copia en Google Sheets |
| `CONTACT_WEBHOOK_TOKEN` | No | Autenticación de la copia |
| `RESEND_API_KEY` | No | Avisos por email |
| `AVISO_EMAIL_PARA` | No | Destinatario del aviso |
| `AVISO_EMAIL_DESDE` | No | Remitente verificado |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics con consentimiento |
| `NEXT_PUBLIC_META_PIXEL_ID` | No | Meta Pixel con consentimiento |

## Trabajo local

```sh
cp .env.example .env.local
npm run dev
```

Pon `ADMIN_SETUP_TOKEN` en `.env.local`. El modo local usa `.cms-local/cms.sqlite` y publica escribiendo en los archivos del proyecto. Para imitar Pages, ejecuta `npm run build:pages` y después `npm run preview:pages`; Wrangler lee secretos locales desde `.dev.vars`.

Nunca guardes `.env.local`, `.dev.vars` ni tokens en Git.
