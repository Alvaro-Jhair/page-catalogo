# Catálogo Digital

Lookbook/catálogo digital, generado desde datos estructurados (no editado a mano página por página). Next.js App Router + React 19 + TypeScript, con un panel de administración que comitea los cambios directo al repo de GitHub (no hay base de datos ni filesystem editable en producción).

La arquitectura completa está documentada en [`CLAUDE.md`](./CLAUDE.md). Este README cubre solo lo necesario para levantar el proyecto **en un entorno nuevo** (otro repo, otro proyecto de Vercel, otra máquina).

## Resumen: ¿qué se lleva un clon/fork y qué no?

El código sí. **Las variables de entorno no** — están en `.gitignore` (`.env*`) a propósito, porque son credenciales. Cloná este repo a otro lado, o conectalo a otro proyecto de Vercel, y **ninguna** de las integraciones de abajo va a funcionar hasta que las configures de nuevo ahí: ni GitHub, ni el login del admin, ni Google Drive.

Esto responde directamente la pregunta de "¿usaría mi API de Google?": **no automáticamente**. Ver la sección [Google Drive](#google-drive-opcional---solo-si-usás-importar-desde-drive) para el motivo exacto y los dos pasos que hacen falta.

## 1. Instalación local

```bash
npm install     # también corre `playwright install chromium` (postinstall, para el export a PDF)
cp .env.example .env.local   # completar con tus propios valores, ver abajo
npm run dev
```

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción (`next build` + genera un PDF por catálogo en `public/`)
- `npm run start` — corre el build de producción
- `npm run lint` — ESLint

No hay suite de tests configurada.

## 2. Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `GITHUB_TOKEN` | Sí, para guardar cambios | Token de GitHub con el que el admin comitea (catálogos, imágenes). Ver [2.1](#21-github). |
| `GITHUB_REPO` | Sí, para guardar cambios | `owner/repo` — **el repo al que se comitea**, no necesariamente el mismo del que corre el sitio. |
| `GITHUB_BRANCH` | No (default `main`) | Rama a la que se comitea. |
| `ADMIN_USERNAME` | Sí, para entrar a `/admin` | Usuario del único admin. |
| `ADMIN_PASSWORD_HASH` | Sí, para entrar a `/admin` | Hash bcrypt de la contraseña — **nunca texto plano**. Ver [2.2](#22-credenciales-del-admin). |
| `AUTH_SECRET` | Sí, para entrar a `/admin` | Clave para firmar el JWT de sesión (cookie httpOnly). Ver [2.2](#22-credenciales-del-admin). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No — solo para "Importar desde Google Drive" | OAuth Client ID de Google Cloud. Ver [2.3](#23-google-drive-opcional). |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | No — solo para Drive | API Key de Google Cloud (restringida a Picker API). Ver [2.3](#23-google-drive-opcional). |
| `NEXT_PUBLIC_GOOGLE_APP_ID` | No — solo para Drive | Número de proyecto de Google Cloud. Ver [2.3](#23-google-drive-opcional). |

Sin `GITHUB_TOKEN`/`GITHUB_REPO`, todo lo demás del sitio funciona igual — solo falla (con un mensaje claro, no un cuelgue) el botón "Guardar y publicar" y la subida de imágenes. Sin `AUTH_SECRET`/`ADMIN_*`, `/admin` no es accesible. Sin las tres `NEXT_PUBLIC_GOOGLE_*`, el botón de Drive queda deshabilitado con un tooltip que dice exactamente cuál falta — el resto del panel funciona normal.

### 2.1 GitHub

1. Generá un **fine-grained personal access token** (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens), con acceso solo al repo donde vive el contenido (`data/catalogs/*.json`, `public/imagenes/`) y permiso **Contents: Read and write**.
2. `GITHUB_REPO` = `tu-usuario/tu-repo` (el repo destino de los commits — si movés este proyecto a un fork o a otro repo, este valor tiene que apuntar ahí, si no el panel va a seguir comiteando al repo original).
3. El admin panel usa la API GraphQL de GitHub (`createCommitOnBranch`) para comitear — no necesita nada más de tu lado que el token con ese permiso.

### 2.2 Credenciales del admin

```bash
# AUTH_SECRET: cualquier string largo y aleatorio
openssl rand -base64 32

# ADMIN_PASSWORD_HASH: hash bcrypt de tu contraseña real
npx bcryptjs-cli hash "tu-contraseña"
```

Guardá el hash (no la contraseña) en `ADMIN_PASSWORD_HASH`, y un usuario cualquiera en `ADMIN_USERNAME`.

### 2.3 Google Drive (opcional)

El botón "Importar desde Google Drive" (en el wizard de creación y en cualquier campo de imagen del editor) usa el Picker + Identity Services de Google **desde el navegador** — no hay ningún token de Google guardado en el servidor ni en el repo. Por diseño no persiste nada: cada importación vuelve a pedir que elijas tu cuenta de Google.

**Por qué no "viene incluido" al mover el proyecto a otro lado**, dos motivos independientes, hacen falta los dos:

1. **Las variables de entorno no viajan con el código.** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`/`_API_KEY`/`_APP_ID` están en `.env.local` (local) o en la configuración del proyecto de Vercel (producción) — ninguna de las dos cosas está en el repo de Git. Un clon nuevo, o el mismo repo conectado a un proyecto de Vercel distinto, no las tiene hasta que las cargues ahí de nuevo.
2. **El OAuth Client ID está restringido por dominio.** Google exige declarar de antemano, en el Client ID, cuáles son los "Authorized JavaScript origins" desde los que se puede pedir login (ej. `https://tu-sitio.vercel.app`, `http://localhost:3000`). Si el proyecto termina sirviéndose desde un dominio nuevo (otro proyecto de Vercel, un dominio propio), ese dominio tiene que agregarse a la lista en Google Cloud Console — si no, Google rechaza el login con un error de origen no autorizado, aunque el Client ID/API Key sean correctos.

**Setup, si querés habilitarlo en un entorno nuevo:**

1. [Google Cloud Console](https://console.cloud.google.com/) → crear o reusar un proyecto → habilitar **Google Picker API** y **Google Drive API**.
2. **Credenciales → OAuth 2.0 Client ID** (tipo "Web application"). En **Authorized JavaScript origins**, agregá cada dominio desde el que se va a usar el panel (ej. `http://localhost:3000` para desarrollo, `https://tu-proyecto.vercel.app` y/o tu dominio propio para producción). → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
3. **Credenciales → API Key**, restringida a la Picker API. → `NEXT_PUBLIC_GOOGLE_API_KEY`.
4. El **número de proyecto** (no el nombre) de Google Cloud, visible en la página principal del proyecto ("Project number"). → `NEXT_PUBLIC_GOOGLE_APP_ID`.
5. Reusar un Client ID/proyecto de Google Cloud que ya tenías de otro entorno es válido — solo asegurate de agregar el dominio nuevo a "Authorized JavaScript origins" en el paso 2, si no lo vas a poder usar desde ahí.

Si en algún momento se quiere sincronización automática (sin volver a pedir login cada vez), hace falta persistir un refresh token — eso quedó fuera de alcance a propósito (ver decision log en `CLAUDE.md`, "Phase F") porque requeriría una base de datos que este proyecto no tiene.

## 3. Desplegar en Vercel

1. Importar el repo en Vercel.
2. Cargar las variables de la sección 2 en **Project Settings → Environment Variables** — separado para Production/Preview/Development si hace falta que se comporten distinto (ej. un `GITHUB_BRANCH` de prueba en Preview).
3. El build (`next build && node scripts/generate-pdf.mjs`) genera un PDF por catálogo (`public/catalog-<id>.pdf`) usando Chromium — en Vercel usa automáticamente `@sparticuz/chromium` (detectado vía `process.env.VERCEL`) en vez del Chromium de Playwright, que no puede correr en el contenedor de build de Vercel.
4. Si el paso de PDF falla por cualquier motivo, el build igual termina bien (`exit 0`) — el PDF queda desactualizado hasta el próximo build exitoso, pero nunca bloquea que se publique un cambio de contenido.

No hay "botón de publicar" aparte: cada guardado desde `/admin` comitea directo a `GITHUB_REPO`/`GITHUB_BRANCH`, y eso dispara el redeploy normal de Vercel (~1-2 minutos hasta verse en vivo).
