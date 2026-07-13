import { useState } from 'react'
import type { ReporteBono } from '../engine/calculate'
import type { BrandingConfig } from '../pdf/branding'
import { generateReportePdf, nombreArchivoPdf } from '../pdf/generateReportePdf'
import { renderPlantilla, type PlantillaCorreo } from '../emailTemplate'
import { requestGmailAccessToken, GmailAuthError } from '../gmail/gis'
import { sendGmailMessage, GmailSendError } from '../gmail/sendEmail'
import type { EmailAttachment } from '../gmail/mime'
import { DestinatariosEditor } from './DestinatariosEditor'
import { esPctValido } from '../validation'

interface Props {
  reporte: ReporteBono
  pct: number | undefined
  mesReporte: string
  destinatarios: string[]
  onDestinatariosChange: (value: string[]) => void
  plantilla: PlantillaCorreo
  branding?: BrandingConfig
  clientId?: string
}

type EnvioStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export function EmailComposer({
  reporte,
  pct,
  mesReporte,
  destinatarios,
  onDestinatariosChange,
  plantilla,
  branding,
  clientId,
}: Props) {
  const [asunto, setAsunto] = useState(() => renderPlantilla(plantilla.asunto, reporte, mesReporte))
  const [cuerpo, setCuerpo] = useState(() => renderPlantilla(plantilla.cuerpo, reporte, mesReporte))
  const [constancia, setConstancia] = useState<{ name: string; bytes: Uint8Array } | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<EnvioStatus>({ kind: 'idle' })

  const puedeGenerar = esPctValido(pct) && Boolean(mesReporte.trim())
  const puedeEnviar = puedeGenerar && destinatarios.length > 0 && Boolean(clientId)

  async function handleConectar() {
    if (!clientId) return
    setStatus({ kind: 'idle' })
    try {
      const token = await requestGmailAccessToken(clientId)
      setAccessToken(token)
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof GmailAuthError ? err.message : 'No se pudo conectar con Gmail.',
      })
    }
  }

  async function handleConstanciaChange(file: File | undefined) {
    if (!file) {
      setConstancia(null)
      return
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    setConstancia({ name: file.name, bytes })
  }

  async function handleEnviar() {
    if (!puedeEnviar || !clientId) return
    setStatus({ kind: 'sending' })
    try {
      let token = accessToken
      if (!token) {
        token = await requestGmailAccessToken(clientId)
        setAccessToken(token)
      }

      const doc = generateReportePdf(reporte, { mesReporte, branding })
      const pdfBytes = new Uint8Array(doc.output('arraybuffer') as ArrayBuffer)
      const attachments: EmailAttachment[] = [
        {
          filename: nombreArchivoPdf(reporte, mesReporte),
          mimeType: 'application/pdf',
          content: pdfBytes,
        },
      ]
      if (constancia) {
        attachments.push({
          filename: constancia.name,
          mimeType: 'application/pdf',
          content: constancia.bytes,
        })
      }

      await sendGmailMessage(token, {
        to: destinatarios.join(', '),
        subject: asunto,
        bodyText: cuerpo,
        attachments,
      })
      setStatus({ kind: 'success' })
    } catch (err) {
      const message =
        err instanceof GmailAuthError || err instanceof GmailSendError
          ? err.message
          : 'No se pudo enviar el correo.'
      setStatus({ kind: 'error', message })
    }
  }

  return (
    <section className="email-composer">
      <h3>Enviar por correo</h3>

      {!clientId && (
        <p className="message message--error">
          Falta configurar VITE_GOOGLE_CLIENT_ID (ver README.md) para poder enviar correos desde
          Gmail.
        </p>
      )}

      <DestinatariosEditor value={destinatarios} onChange={onDestinatariosChange} />

      <label>
        Asunto
        <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
      </label>

      <label>
        Cuerpo
        <textarea rows={10} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
      </label>

      <label>
        Constancia de situación fiscal (opcional)
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            void handleConstanciaChange(e.target.files?.[0])
          }}
        />
      </label>

      <div className="email-composer__actions">
        {!accessToken && (
          <button
            type="button"
            onClick={() => {
              void handleConectar()
            }}
            disabled={!clientId}
          >
            Conectar con Gmail
          </button>
        )}
        {accessToken && <span className="message message--success">Gmail conectado</span>}

        <button
          type="button"
          onClick={() => {
            void handleEnviar()
          }}
          disabled={!puedeEnviar || status.kind === 'sending'}
        >
          {status.kind === 'sending' ? 'Enviando…' : 'Enviar correo'}
        </button>
      </div>

      {status.kind === 'success' && (
        <p className="message message--success">Correo enviado a {destinatarios.join(', ')}.</p>
      )}
      {status.kind === 'error' && <p className="message message--error">{status.message}</p>}
    </section>
  )
}
