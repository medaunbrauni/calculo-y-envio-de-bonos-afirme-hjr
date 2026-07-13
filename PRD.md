# PRD — App de Bonos AFIRME

## 1. Objetivo
Reemplazar el proceso manual de Excel para generar los "Bonos" mensuales (reportes de comisión por agrupamiento/agente) por una app web que:
1. Recibe un `.xlsx` (pestaña `MATRIZ`).
2. Calcula y muestra el reporte por agrupamiento (igual que los PDFs actuales, ver `docs/business-logic.md`).
3. Genera un PDF con diseño nuevo (más "fresco"): tabla de cálculo + cards con datos clave.
4. Redacta un correo (resumen + instrucciones + opcional "constancia de situación fiscal" adjunta).
5. Envía el correo automáticamente desde la cuenta de Gmail del usuario.
6. Da mensajes de confirmación/error en cada paso, y permite personalizar textos.
7. Se despliega gratis (GitHub Pages / Vercel / Netlify).

## 2. Usuarios
Un solo usuario (el dueño de la agencia/cuenta), uso interno mensual. No se requiere multiusuario ni roles por ahora.

## 3. Flujo principal (happy path)
1. Usuario entra a la app y sube el `.xlsx` del mes.
2. La app valida el archivo (existe pestaña `MATRIZ`, existen las columnas esperadas) → mensaje de éxito o error claro.
3. La app detecta los `AGRUPAMIENTO` presentes y los muestra como lista/tarjetas (ej. JIRO CHIH, JIRO TOL, IVAN...).
4. Usuario selecciona un agrupamiento (o "generar todos").
5. La app muestra un preview: cards con totales clave (Prima Base, % aplicado, Emisión Delegada, Subtotal, IVA, Total) + la tabla pivot completa (Ramo/Subramo).
6. Usuario puede ajustar el **% de bono** de ese agrupamiento antes de confirmar (ver sección 6, "Pendiente de confirmar" en business-logic.md).
7. Usuario da clic en "Generar PDF" → se genera el PDF con el nuevo diseño → mensaje de confirmación + botón de descarga/preview.
8. Usuario da clic en "Redactar correo" → la app arma un borrador (asunto + cuerpo) editable, con el PDF adjunto y, opcionalmente, un archivo de "constancia de situación fiscal" que el usuario sube aparte.
9. Usuario revisa/edita el correo y el destinatario, y da clic en "Enviar".
10. La app envía el correo desde el Gmail del usuario → mensaje de confirmación ("Correo enviado a X") o de error con detalle.

## 4. Requisitos funcionales

### 4.1 Carga y parseo de Excel
- Aceptar `.xlsx`, leer la pestaña `MATRIZ` con SheetJS (client-side).
- Validar que existan las columnas mínimas (ver `docs/matriz-columns.md`). Si falta alguna → error explícito ("No se encontró la columna X").
- Si el archivo no tiene pestaña `MATRIZ` → error explícito.

### 4.2 Cálculo del reporte
- Implementar exactamente la lógica de `docs/business-logic.md`, sección 2 y 3.
- Cubrir con tests unitarios usando `sample-data/` (los 3 PDF son el resultado esperado para validar el cálculo).
- Permitir configurar el `%` de bono por agrupamiento (no asumir un valor fijo).
- Manejar filas "(en blanco)" (sin RAMO) igual que el Excel original.

### 4.3 Generación de PDF
- Diseño nuevo, más "bonito"/fresco: paleta de color de marca (a definir, default: colores institucionales tipo AFIRME — azul/dorado, ajustable), tipografía legible.
- Debe incluir:
  - Encabezado (agrupamiento, mes, fecha de generación).
  - **Cards** con las cifras clave (Prima Base, % aplicado, Emisión Delegada, Subtotal, IVA, Total).
  - Tabla de cálculo completa (Ramo → Subramo, con las mismas columnas del pivot actual).
  - Pie con nota o folio.
- Generado en el cliente (ej. `html2pdf.js`, o `@react-pdf/renderer`, o jsPDF + `autoTable`) — decidir en la fase de scaffold cuál da mejor control de diseño.

### 4.4 Redacción de correo
- Plantilla editable con variables: nombre del agrupamiento/agente, mes, totales clave.
- Debe incluir instrucciones (texto configurable, ej. "Favor de confirmar recepción", datos bancarios, etc. — el usuario definirá el texto exacto).
- Adjuntar automáticamente el PDF generado.
- Adjuntar opcionalmente la "constancia de situación fiscal" (el usuario la sube como PDF; no la genera la app).
- Permitir personalizar (editar libremente) asunto y cuerpo antes de enviar, y guardar una plantilla por defecto reutilizable.

### 4.5 Envío de correo
**RESUELTO: Opción B — Gmail API, 100% client-side (sin backend).**

Como la app es de un solo usuario y el envío es un flujo manual mensual (no hace falta acceso "offline"/refresh token), se puede usar el flujo de **Google Identity Services (GIS) — Token Client** directamente desde el navegador:

- El usuario hace clic en "Conectar con Gmail" una vez por sesión → GIS abre el consentimiento de Google → devuelve un **access token** de corta duración (~1 hora) con el scope `https://www.googleapis.com/auth/gmail.send`.
- Con ese token, la app arma el correo (MIME, con adjuntos codificados en base64) y llama directo a `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send` vía `fetch`. No hay client secret que proteger (el Client ID de OAuth es público por diseño) y no se necesita servidor ni función serverless.
- El token dura más que de sobra para generar y enviar los reportes de una sesión; si expira, el usuario vuelve a hacer clic en "Conectar con Gmail".
- **Configuración única (una sola vez, ~15 min, la hace el usuario en Google Cloud Console):** crear proyecto → habilitar Gmail API → configurar pantalla de consentimiento OAuth en modo **Testing** (agregarse a sí mismo como test user — evita el proceso de verificación de Google porque nunca se solicita acceso offline ni se publica la app) → crear credencial **OAuth Client ID tipo "Web application"**, agregando como "Authorized JavaScript origin" la URL donde se hospede la app.
- **Consecuencia:** al no necesitar backend, la app puede hospedarse 100% en **GitHub Pages** (o Vercel/Netlify igual de bien, sin diferencia funcional ya para el envío de correo).

### 4.6 Mensajes de confirmación y error
- Cada acción (cargar archivo, seleccionar agrupamiento, generar PDF, redactar correo, enviar correo) debe mostrar un mensaje claro de éxito o de error específico (no genérico), con opción de reintentar.

### 4.7 Personalización
- Colores/branding del PDF configurables desde la propia plataforma (no hardcodeado): color primario/secundario editables + **subida de logo en PNG** (se guarda localmente, ej. `localStorage`/IndexedDB, para reusarse cada mes).
- Plantilla de correo editable y guardable como default.
- % de bono editable por agrupamiento.

## 5. Requisitos no funcionales
- Gratis de operar (hosting + envío de correo dentro de tiers gratuitos).
- Sin backend con base de datos — no hay necesidad de persistir histórico (a menos que el usuario lo pida después).
- Datos sensibles (Excel, PDFs con montos) no se suben a ningún servidor de terceros salvo lo estrictamente necesario para enviar el correo.
- Repo público o privado en GitHub, desplegable con un `git push` (CI simple o deploy automático de Vercel/GitHub Pages).

## 6. Fuera de alcance (por ahora)
- Multiusuario / login.
- Cálculo desde las hojas crudas (`CAM+10T`, `ASISTENCIA`) — **RESUELTO: Flujo A**. La pestaña `Catálogo` del Excel alimenta `MATRIZ` pero eso ya ocurre dentro del propio Excel antes de subirlo; la app solo necesita leer `MATRIZ` con las columnas AD-AM ya calculadas, sin re-parsear `Catálogo`/`CAM+10T`/`ASISTENCIA`.
- Explicar/replicar el "segundo número" de la página 2 del PDF — descartado, los PDF de muestra son solo ejemplos de formato, no hace falta reproducir ese dato.
- Generar la constancia de situación fiscal (solo se adjunta la que el usuario suba).

## 7. Stack propuesto (a confirmar/ajustar en scaffold)
- **Frontend:** React + TypeScript + Vite.
- **Excel parsing:** SheetJS (`xlsx`).
- **PDF:** `@react-pdf/renderer` o `html2pdf.js` (decidir según control de diseño deseado para las cards).
- **Envío de correo:** Gmail API vía Google Identity Services (Token Client), 100% client-side — ver 4.5.
- **Hosting:** GitHub Pages (ya no se necesita backend/serverless para el correo).
- **Tests:** Vitest para el motor de cálculo, usando `sample-data/` como fixtures.

## 8. Preguntas abiertas — RESUELTAS (2026-07-13)
1. **Envío de correo:** Opción B, Gmail API, sin backend (ver 4.5).
2. **% de bono:** existe la pestaña `Catálogo` en el Excel que alimenta `MATRIZ`, pero ese cálculo ya se resuelve dentro del Excel antes de subirlo — la app solo necesita el editable manual por agrupamiento (sección 4.2), no necesita leer `Catálogo` directamente.
3. **Segundo número página 2:** ignorar, los PDF de muestra son solo referencia de formato.
4. **Desglose por sub-agente:** aplica a **todos** los agrupamientos, no solo IVAN.
5. **Destinatario del correo:** uno **por agrupamiento**.
6. **Branding del PDF:** configurable desde la plataforma — subida de logo PNG + selector de colores (ver 4.7).
