# Instrucciones para Claude Code

Este repo es el punto de partida para construir una **app web** que automatiza la generación de "Bonos" (reportes de comisión) a partir de un Excel (`MATRIZ`) y el envío del reporte por correo. Lee **PRD.md** y **docs/business-logic.md** antes de escribir código: ahí está toda la lógica de negocio ya verificada contra los archivos de ejemplo en `sample-data/`.

## Qué hay en este repo
- `PRD.md` — especificación funcional y técnica completa.
- `docs/business-logic.md` — fórmulas exactas extraídas del Excel (columna por columna) que el cálculo debe replicar.
- `docs/matriz-columns.md` — diccionario de columnas de la hoja `MATRIZ`.
- `sample-data/` — el Excel real (`MATRIZ`) y 3 PDFs "golden" (CHIH, TOLUCA, IVAN) que son el resultado esperado para ese mismo Excel. **Úsalos como fixtures de prueba**: si tu cálculo no reproduce esos tres PDFs (o razonablemente algo muy cercano), algo está mal.

## Orden de trabajo sugerido
1. Scaffold del proyecto (Vite + React + TS, o el stack que se decida en el PRD).
2. Parser de `.xlsx` (SheetJS) → lee la pestaña `MATRIZ`, valida columnas esperadas.
3. Motor de cálculo puro (funciones sin UI) que reproduce `docs/business-logic.md`. Escribe tests unitarios contra `sample-data/` antes de tocar la UI.
4. UI: carga de archivo, selección de agrupamiento/agente, vista previa de tabla + cards.
5. Generación de PDF "bonito" (tabla + cards) con el nuevo diseño.
6. Redacción de correo (plantilla editable) + adjuntos (PDF + opcional constancia de situación fiscal subida por el usuario).
7. Envío desde Gmail del usuario (ver sección de correo en el PRD — hay que decidir entre EmailJS/Gmail API antes de programar, está marcado como **DECISIÓN PENDIENTE**).
8. Mensajes de confirmación/error en cada acción (carga de archivo, cálculo, generación de PDF, envío de correo).
9. Deploy a GitHub Pages/Vercel (gratis).

## Reglas importantes
- Todo el procesamiento (Excel, PDF, cálculo) debe poder correr **en el cliente** (browser) si se elige hosting 100% estático (GitHub Pages). Si se elige Vercel/Netlify, se pueden usar funciones serverless gratuitas para el envío de correo.
- Nunca subir credenciales (client secret de Gmail, API keys) al repo. Usar variables de entorno / `.env` (con `.env.example` documentado) y `.gitignore`.
- Antes de implementar el envío de correo, confirmar con el usuario qué método usar (ver PRD, sección "Envío de correo") porque cambia la arquitectura (con o sin backend).
- Mantén el motor de cálculo desacoplado de la UI y cúbrelo con tests usando `sample-data/` como fixtures.
- Idioma de la UI: español (México).
