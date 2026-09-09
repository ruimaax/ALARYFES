# ALARYFES — carpeta para Cloudflare

Todo lo que hay aquí dentro es la web lista para publicar. No hace falta
instalar nada ni compilar: se sube tal cual.

## Publicar por primera vez

1. Entra en <https://dash.cloudflare.com> → **Workers y Pages** → **Crear** →
   pestaña **Pages** → **Subir recursos** (*Upload assets*).
2. Nombre del proyecto: `alaryfes`.
3. Arrastra **esta carpeta entera**, no su contenido suelto.
4. Pulsa **Desplegar**. En un minuto tendrás una dirección
   `alaryfes.pages.dev` para comprobar que todo está bien.

## Conectar tu dominio

En el proyecto → **Dominios personalizados** → **Configurar un dominio** →
escribe `alaryfes.com`. Si el dominio ya está en tu cuenta de Cloudflare, los
registros DNS se crean solos. Repite con `www.alaryfes.com` si lo quieres.

## Que el formulario te llegue

El formulario funciona a través de `functions/api/contacto.js`, que ya va
incluido. Solo le falta saber a dónde mandar las solicitudes:

Proyecto → **Configuración** → **Variables y secretos** → **Añadir**:

| Nombre | Valor |
| --- | --- |
| `CONTACT_WEBHOOK_URL` | La URL de tu hoja de Google (la misma de tu `.env.local`) |
| `CONTACT_WEBHOOK_TOKEN` | Solo si tu endpoint pide autenticación |

Márcalas como **Secreto** y guarda. Luego vuelve a desplegar para que las coja.

**Mientras no la configures, nada se pierde de vista pero tampoco se recibe:**
el formulario responde que la consulta ha quedado registrada a la espera de
conexión, sin afirmar que te ha llegado. WhatsApp funciona desde el minuto uno,
que es por donde va a entrar la mayoría de la gente.

## Actualizar la web

Cada vez que cambies textos o precios en el proyecto:

```sh
npm run build:cloudflare
```

Eso rehace esta carpeta entera. Vuelve a Cloudflare → tu proyecto →
**Crear despliegue** → arrastra la carpeta otra vez.

## Dos cosas que conviene tener presentes

**El 1 de enero de 2027 suben las altas.** El cambio lo hace el navegador de
quien visita la web, comparando la fecha, así que ocurre solo. Pero el HTML que
se sirve lleva los precios del día en que compilaste, y eso es lo que ve Google
hasta que vuelvas a subir la carpeta. **Recompila y vuelve a desplegar en enero
de 2027**; es la única fecha en la que esto importa.

**Los precios y todos los textos se cambian en el proyecto, no aquí.** Están en
`src/data/` del repositorio. Si editas el HTML de esta carpeta, el siguiente
`npm run build:cloudflare` se lo lleva por delante.
