# Bonos AFIRME

App web para automatizar la generación y envío de los reportes de "Bono" mensual: sube el Excel (`MATRIZ`), calcula el reporte por agrupamiento, genera un PDF con diseño propio y lo envía por correo desde tu cuenta de Gmail — todo desde el navegador, sin backend.

## Uso

```
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción (dist/)
npm run test      # tests del motor de cálculo (Vitest)
```

> `npm run test` necesita `sample-data/` (excluido del repo por `.gitignore` — trae datos reales de clientes). Solo corre en local; el workflow de deploy a GitHub Pages no ejecuta tests, solo build.

## Configurar el envío de correo (Gmail API)

El envío usa Google Identity Services (GIS) 100% desde el navegador — no hay backend ni client secret. Configuración única (~15 min):

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita la **Gmail API** (APIs y servicios → Habilitar APIs y servicios).
3. Configura la **pantalla de consentimiento OAuth**:
   - Tipo de usuario: External (o Internal si usas Google Workspace).
   - Publishing status: déjalo en **Testing** — agrégate a ti mismo como *test user*. Así evitas el proceso de verificación de Google (solo hace falta si publicas la app o pides acceso offline, y aquí no se hace ninguna de las dos cosas).
4. Crea una credencial **OAuth Client ID** de tipo **Web application**:
   - En "Authorized JavaScript origins" agrega la URL donde vayas a correr la app (ej. `http://localhost:5173` para desarrollo, y la URL de GitHub Pages una vez desplegada).
5. Copia el Client ID y ponlo en un archivo `.env` en la raíz del proyecto (usa `.env.example` como base):
   ```
   VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   ```
6. Reinicia `npm run dev`. En la app, al enviar un correo por primera vez en cada sesión, se te pedirá "Conectar con Gmail" (autorización estándar de Google, token válido ~1 hora).

El Client ID de OAuth no es secreto (está diseñado para ser público), pero se maneja por variable de entorno para no atarlo al código ni al repo.

## Deploy a GitHub Pages

El repo incluye un workflow (`.github/workflows/deploy.yml`) que compila y publica automáticamente en cada push a `main`.

1. `sample-data/` ya está excluida del repo vía `.gitignore` (trae montos y nombres reales de agentes) — sigue existiendo en tu disco local para los tests, pero nunca se sube a GitHub.
2. Crea el repo en GitHub y sube el código (`git init`, `git remote add origin ...`, `git push`).
3. En **Settings → Pages**, en "Build and deployment" elige **Source: GitHub Actions** (no "Deploy from a branch").
4. En **Settings → Secrets and variables → Actions**, agrega un secret `VITE_GOOGLE_CLIENT_ID` con tu Client ID (el mismo de tu `.env` local) — el workflow lo necesita para compilar la app con el envío de correo habilitado.
5. En Google Cloud Console, agrega la URL de GitHub Pages (`https://<usuario>.github.io/<repo>/`) a "Authorized JavaScript origins" del OAuth Client ID (ver sección de Gmail arriba).
6. Cada push a `main` vuelve a compilar y publicar automáticamente. También puedes disparar el deploy manualmente desde la pestaña "Actions" del repo ("Run workflow").

## Estructura

```
src/engine/    → parser de Excel + motor de cálculo puro (con tests, ver docs/business-logic.md)
src/pdf/       → generación de PDF (jsPDF + jspdf-autotable) y configuración de marca
src/gmail/     → integración con Gmail API vía Google Identity Services
src/components/, src/hooks/ → UI
docs/          → fórmulas y diccionario de columnas extraídos del Excel real
sample-data/   → Excel real + PDFs de referencia (formato), usados como fixtures de test
```

## Archivos de referencia (`sample-data/`)
- `JUNIO_11499_HJR__AGENTE_DE_SEGUROS_Y_DE_FIANZAS_SA_DE_CV.xlsx` — Excel de origen (pestaña `MATRIZ`), usado como fixture de los tests del motor de cálculo (contra las hojas de pivot `*_BONO` que el propio Excel ya trae).
- `2026_BONO_MAYO_JIRO_CHIH.pdf`, `2026_BONO_MAYO_JIRO_TOLUCA.pdf`, `2026_BONO_MAYO_IVAN_LEON.pdf` — PDFs de un ciclo distinto (mayo) al Excel de muestra (junio); sirven solo como referencia del formato original, no como fixture numérico.

> Nota: estos archivos contienen datos reales de negocio (montos, nombres de agentes) — por eso `sample-data/` está en `.gitignore` y nunca se sube al repo. Sigue existiendo en tu disco local para los tests; si clonas el repo en otra máquina, cópiala manualmente ahí.
