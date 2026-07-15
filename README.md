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

## Deploy — estado actual

- ✅ Repo: https://github.com/medaunbrauni/calculo-y-envio-de-bonos-afirme-hjr (público — GitHub Pages no funciona en repo privado sin plan de pago)
- ✅ Sitio en producción: **https://medaunbrauni.github.io/calculo-y-envio-de-bonos-afirme-hjr/**
- ✅ `sample-data/` excluida del repo (`.gitignore`), workflow de deploy compila sin correr tests
- ❌ **Pendiente: conectar Gmail** (sin esto no se puede enviar correo, ver abajo)

## Configurar el envío de correo (Gmail API) — PENDIENTE

El envío usa Google Identity Services (GIS) 100% desde el navegador — no hay backend ni client secret. Falta hacer esto (~15 min, una sola vez):

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita la **Gmail API** (APIs y servicios → Habilitar APIs y servicios).
3. Configura la **pantalla de consentimiento OAuth**:
   - Tipo de usuario: External (o Internal si usas Google Workspace).
   - Publishing status: déjalo en **Testing** — agrégate a ti mismo como *test user*. Así evitas el proceso de verificación de Google (solo hace falta si publicas la app o pides acceso offline, y aquí no se hace ninguna de las dos cosas).
4. Crea una credencial **OAuth Client ID** de tipo **Web application**:
   - En "Authorized JavaScript origins" agrega **ambas**:
     - `http://localhost:5173` (para desarrollo local)
     - `https://medaunbrauni.github.io` (el sitio ya está en producción — nota: sin la ruta `/calculo-y-envio-de-bonos-afirme-hjr/`, Google solo pide el origin)
5. Copia el Client ID:
   - **Para desarrollo local:** ponlo en un archivo `.env` en la raíz (usa `.env.example` como base): `VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com`, luego reinicia `npm run dev`.
   - **Para producción:** en el repo de GitHub, ve a **Settings → Secrets and variables → Actions → New repository secret**, nombre `VITE_GOOGLE_CLIENT_ID`, valor tu Client ID. Después vuelve a correr el workflow (push a `main`, o "Run workflow" manual en la pestaña Actions) para que el build lo incluya.
6. Listo. En la app, al enviar un correo por primera vez en cada sesión, se te pedirá "Conectar con Gmail" (autorización estándar de Google, token válido ~1 hora).

El Client ID de OAuth no es secreto (está diseñado para ser público), pero se maneja por variable de entorno para no atarlo al código ni al repo.

## Deploy a GitHub Pages (ya configurado)

El workflow `.github/workflows/deploy.yml` compila y publica automáticamente en cada push a `main` (o manualmente desde la pestaña "Actions" → "Run workflow"). Si alguna vez necesitas rehacer el setup desde cero en otro repo:

1. `git init`, `git remote add origin <url>`, `git push -u origin main`.
2. **Settings → Pages** → "Build and deployment" → **Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions** → agregar `VITE_GOOGLE_CLIENT_ID`.
4. En Google Cloud Console, agregar el origin de GitHub Pages a "Authorized JavaScript origins".

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
