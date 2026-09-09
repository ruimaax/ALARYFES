# ALARYFES

Web corporativa en Next.js App Router, TypeScript y Tailwind CSS, preparada para Vercel. La dirección visual parte del logo: rojo, marfil y ocre; Faustina y Source Sans 3. La progresión de planes usa diagramas arquitectónicos propios: replanteo, torre, fortaleza y ciudad. Solo se anima su revelación y se respeta `prefers-reduced-motion`.

## Arrancar

Requiere Node.js 22 o posterior y npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Los anteriores `index.html`, `web.html` y `assets/` se conservan como material histórico; la aplicación activa es `src/app/` y no depende de esos HTML.

```sh
npm run build
npm start
npm run typecheck
npm test
```

## Cambiar contenido y precios

Todo el contenido comercial está en archivos TypeScript de `src/data/`.

| Archivo | Contenido |
| --- | --- |
| `planes.ts` | Planes, alta con 3/12 meses, cuota mensual, inclusiones, exclusiones, avisos y plazos |
| `extras.ts` | Servicios adicionales. La web los muestra como «A consultar»: los precios siguen aquí como referencia interna |
| `cambios.ts` | Permanencia, condiciones, bajada y cancelación. La tabla de subidas ya no se publica, pero se conserva aquí |
| `faq.ts` | Seis preguntas y respuestas; alimenta también FAQPage |
| `sectores.ts` | Clínicas, peluquerías y barberías; recomendaciones y ejemplos hipotéticos |
| `sitio.ts` | Contacto, navegación, textos generales y home |
| `servicios.ts` | Disciplinas y comparativa de planes |
| `recomienda.ts` | Recompensas, Círculo de Alarifes y condiciones |
| `legal.ts` | Aviso legal, privacidad, cookies e información junto al formulario |
| `blog.ts` y `articulos/` | Índice editorial y artículos locales MDX |
| `interfaz.ts` | Textos compartidos de interfaz |

Cada plan tiene `lanzamiento` y `normal`, ambos con `alta3`, `alta12` y `mensual`. `FECHA_FIN_LANZAMIENTO = '2026-12-31'`. La comparación usa la fecha civil de Ceuta (`Europe/Madrid`, misma zona horaria) y cambia a tarifas normales a las 00:00 del 1 de enero de 2027. Las páginas con precios se renderizan por petición: **no hay que recompilar el 1 de enero**. El selector de compromiso no cambia la cuota, solo el alta. El bloque de planes vuelve a comprobar la fecha cada minuto si se deja abierto.

La garantía general de cuota es de 24 meses. El Círculo ofrece una congelación de por vida al alcanzar 3 referidos y la identifica como excepción ganada. La cancelación se explica en la página general, en cada plan y en el FAQ: dominio del cliente, despublicación de la web y migración opcional de 250€.

Medina incluye campañas únicamente en Meta (Instagram y Facebook). El ejemplo de clínica conserva el argumento aprobado, con el contexto necesario: facturación no es margen y gasto anual del cliente no equivale a cobro mensual.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL canónica: `https://alaryfes.com` |
| `NEXT_PUBLIC_WHATSAPP` | Número internacional solo con dígitos: `34623173625` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `hola@alaryfes.com` |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_NIF`, `NEXT_PUBLIC_LEGAL_ADDRESS` | Sustituir datos públicos del titular si cambian; por defecto se usan los facilitados |
| `CONTACT_WEBHOOK_URL` | Endpoint de servidor que recibe las solicitudes y las registra en Google Sheets |
| `CONTACT_WEBHOOK_TOKEN` | Bearer token opcional para autenticar la conexión con ese endpoint |
| `NEXT_PUBLIC_GA_ID` | Identificador de Google Analytics `G-…`, opcional |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID numérico de Meta Pixel, opcional |

Las variables `NEXT_PUBLIC_` se incorporan al compilar. No pongas secretos en ellas. El endpoint y su token permanecen en el servidor. No guardes `.env.local` en Git.

## Formularios y recepción

Ambos formularios envían JSON a `POST /api/contacto`. El payload incluye `tipo` (`contacto` o `recomendacion`), `nombre`, `negocio` y `consentimiento`. El contacto añade `telefono`, `sector`, `plan` y `mensaje`. La recomendación añade `referidoNegocio` y `referidoContacto`.

El endpoint externo recibe además `id` y `fecha`. Debe aceptar POST JSON, guardar la solicitud y responder con un estado HTTP 2xx **solo si la ha recibido correctamente**. Usa `id` como identificador al escribir en la hoja. Puede ser un endpoint propio o un webhook de una herramienta de automatización conectado a Google Sheets. Si usa autenticación, acepta `Authorization: Bearer …`. Las cadenas que podrían ejecutarse como fórmulas en la hoja se prefijan con un apóstrofo.

- Con endpoint: se espera su respuesta y se confirma la entrega solo si devuelve 2xx.
- Sin endpoint: se registra la solicitud en los logs del servidor y se devuelve `202` con `status: pending_configuration`. El visitante ve que el canal no está conectado. **No es almacenamiento duradero ni una bandeja de entrada, y no cuenta como conversión entregada.**
- Si hay error o tiempo de espera: se devuelve un error legible y se ofrece volver a intentarlo o usar WhatsApp.

Hay validación compartida en cliente y servidor, consentimiento sin premarcar, honeypot, control de origen, límite de cuerpo de 16 KB, timeout del webhook y limitación de frecuencia. El limitador es por instancia y memoria; para tráfico abusivo en producción se puede complementar con el firewall de Vercel. Los logs de preparación contienen los datos facilitados por el visitante: configura su acceso y retención, y conecta la recepción antes de anunciar los formularios como operativos.

`Contacto` y `ClicWhatsApp` se emiten a `window.dataLayer`. Los campos de los formularios no se incluyen en analítica. Google Analytics y Meta Pixel solo se cargan con IDs válidos y consentimiento de medición. El visitante puede rechazar o retirar ese consentimiento en `/politica-cookies`. Sin IDs no se carga ningún proveedor externo ni aparece un banner innecesario.

## Blog y casos

No hay artículos, testimonios ni casos ficticios publicados. Para publicar un artículo, crea un archivo en `src/data/articulos/` y regístralo en `blog.ts` con `slug`, `titulo`, `descripcion`, `fecha`, `archivo` y `publicado: true`. Solo se leen archivos `.mdx` locales registrados; el motor bloquea JavaScript incrustado. `plantilla.mdx` es una guía sin publicar. Las rutas desconocidas devuelven 404.

## Desplegar en Cloudflare Pages (carpeta estática)

```sh
npm run build:cloudflare
```

Genera `../alaryfes-cloudflare` — fuera del repositorio — con la web compilada
a HTML, la función que recibe los formularios en `functions/api/contacto.js`,
las cabeceras de seguridad y caché en `_headers`, y un `LEEME.md` con los pasos
para el panel de Cloudflare. Esa carpeta se arrastra entera en
**Workers y Pages → Pages → Subir recursos**.

El script rehace la carpeta desde cero, comprueba tipos antes de compilar y
prueba la función empaquetada (sin endpoint, sin consentimiento, con honeypot y
con entrega fallida) antes de darla por buena. Para publicar en otra ruta:
`npm run build:cloudflare -- /ruta/de/salida`.

`CONTACT_WEBHOOK_URL` y `CONTACT_WEBHOOK_TOKEN` **no viajan en la carpeta**: se
configuran como secretos en el panel del proyecto.

Qué cambia respecto al despliegue con servidor:

- La ruta `src/app/api` se aparta durante la compilación y su trabajo lo hace la
  Pages Function, que comparte la misma validación.
- `/blog/[slug]` se aparta mientras no haya artículos publicados; vuelve sola en
  cuanto exista el primero.
- Los precios de lanzamiento los recalcula el navegador, así que el cambio del 1
  de enero de 2027 ocurre solo para quien visita la web. El HTML servido lleva
  los precios del día de compilación, que es lo que ve Google: **recompila y
  vuelve a subir la carpeta en enero de 2027.**

Para comprobar la carpeta antes de subirla, hay un servidor que imita cómo
resuelve Cloudflare las rutas y comprime como él:

```sh
node tests/servidor-estatico.mjs ../alaryfes-cloudflare
# En otro terminal:
TEST_BASE_URL=http://127.0.0.1:4321 node tests/browser-check.mjs
```

## Desplegar en Vercel

1. Importa este repositorio en Vercel y selecciona **Next.js**. La raíz del proyecto es la del repositorio.
2. Elige Node.js 22 o 24. Instalación: `npm ci`; compilación: `npm run build`. No uses exportación estática: los formularios necesitan Route Handlers.
3. Añade las variables de entorno y conecta `CONTACT_WEBHOOK_URL` para recibir solicitudes. Si cambias una variable `NEXT_PUBLIC_`, vuelve a desplegar.
4. Despliega primero una vista previa. Comprueba WhatsApp y el envío real hacia la hoja con datos de prueba autorizados.
5. Añade `alaryfes.com` y, si lo usas, `www.alaryfes.com` en Domains. Aplica los registros DNS que indique Vercel y redirige `www` al dominio canónico.

Se incluyen metadatos propios por página, Open Graph textual, URL canónica, `sitemap.xml`, `robots.txt`, LocalBusiness, Service, FAQPage y BreadcrumbList. No se ha inventado una imagen social. El logo del encabezado es `public/logo-marca.png`, de 172 px y 23 KB; el original de 1254 px se conserva sin publicar en `assets/logo-original.png`.

La dirección legal publicada reproduce la facilitada, «Calle Velarde, Ceuta». Completa número y código postal si corresponden. La conexión y los proveedores efectivos de recepción deberán coincidir con lo descrito en privacidad. Referencias usadas para preparar esos textos: [información general de la LSSI, artículo 10](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758) y [deber de información de la AEPD](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/6-el-deber-de-informacion).

## Verificación

`npm test` comprueba el cambio de tarifas en el límite horario, la invariancia de cuotas, el alcance de Meta, validación, honeypot, neutralización de fórmulas y respuestas de la API con y sin recepción disponible.

Para comprobar interfaz en Chrome instalado:

```sh
npm run build
npm run start -- --port 3001
# En otro terminal:
node tests/browser-check.mjs
```

El script comprueba las 19 páginas públicas a 320, 375, 768 y 1440 px, siete pantallas representativas con axe (esperando a que terminen las animaciones, para medir la página en reposo y comprobar de paso que todo lo que se anima acaba siendo visible), selector de compromiso, mensajes de WhatsApp, FAQ, formularios, navegación móvil, teclado, movimiento reducido y 404. Los formularios de la prueba se interceptan localmente: no se envían mensajes a negocios reales. Los informes y capturas se guardan en `test-results/`, fuera de Git.

Lighthouse sobre la compilación de producción con emulación móvil (medición local del 9 de septiembre de 2026):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| `/` | 96 | 100 | 100 | 100 |
| `/planes` | 98 | 100 | 100 | 100 |
| `/contacto` | 97 | 100 | 100 | 100 |
| `/sectores/clinicas-esteticas` | 97 | 100 | 100 | 100 |
| `/recomienda` | 97 | 100 | 100 | 100 |

Estas cifras no sustituyen la medición tras el despliegue y la conexión de herramientas externas.
