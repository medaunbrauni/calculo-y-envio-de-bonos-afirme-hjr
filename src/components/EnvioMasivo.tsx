import { useState } from 'react'
import type { MatrizRow } from '../engine/types'
import { calculateReporte, type RegimenFiscal } from '../engine/calculate'
import { generateReportePdf, nombreArchivoPdf } from '../pdf/generateReportePdf'
import type { BrandingConfig } from '../pdf/branding'
import { renderPlantilla, type PlantillaCorreo } from '../emailTemplate'
import { requestGmailAccessToken, GmailAuthError } from '../gmail/gis'
import { sendGmailMessage, GmailSendError } from '../gmail/sendEmail'
import type { EmailAttachment } from '../gmail/mime'
import { DestinatariosEditor } from './DestinatariosEditor'
import { esPctValido } from '../validation'

interface Props {
  agrupamientos: string[]
  rows: MatrizRow[]
  mesReporte: string
  pctPorAgrupamiento: Record<string, number>
  onPctChange: (agrupamiento: string, value: number) => void
  regimenPorAgrupamiento: Record<string, RegimenFiscal>
  onRegimenFiscalChange: (agrupamiento: string, value: RegimenFiscal) => void
  destinatariosPorAgrupamiento: Record<string, string[]>
  onDestinatariosChange: (agrupamiento: string, value: string[]) => void
  plantilla: PlantillaCorreo
  branding?: BrandingConfig
  clientId?: string
  gmailToken: string | null
  onGmailToken: (accessToken: string, expiresIn: number) => void
}

type EstadoEnvio =
  | { kind: 'idle' }
  | { kind: 'enviando' }
  | { kind: 'enviado' }
  | { kind: 'saltado'; motivo: string }
  | { kind: 'error'; mensaje: string }

export function EnvioMasivo({
  agrupamientos,
  rows,
  mesReporte,
  pctPorAgrupamiento,
  onPctChange,
  regimenPorAgrupamiento,
  onRegimenFiscalChange,
  destinatariosPorAgrupamiento,
  onDestinatariosChange,
  plantilla,
  branding,
  clientId,
  gmailToken,
  onGmailToken,
}: Props) {
  const [estados, setEstados] = useState<Record<string, EstadoEnvio>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorConexion, setErrorConexion] = useState<string | null>(null)
  const [cfdi, setCfdi] = useState<{ name: string; bytes: Uint8Array } | null>(null)

  async function handleCfdiChange(file: File | undefined) {
    if (!file) {
      setCfdi(null)
      return
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    setCfdi({ name: file.name, bytes })
  }

  async function handleEnviarTodos() {
    setErrorConexion(null)
    setEnviando(true)

    let token = gmailToken
    if (!token && clientId) {
      try {
        const nuevoToken = await requestGmailAccessToken(clientId)
        onGmailToken(nuevoToken.accessToken, nuevoToken.expiresIn)
        token = nuevoToken.accessToken
      } catch (err) {
        setErrorConexion(
          err instanceof GmailAuthError ? err.message : 'No se pudo conectar con Gmail.',
        )
        setEnviando(false)
        return
      }
    }
    if (!token) {
      setEnviando(false)
      return
    }

    const nuevosEstados: Record<string, EstadoEnvio> = {}
    for (const agrupamiento of agrupamientos) {
      const pct = pctPorAgrupamiento[agrupamiento]
      const destinatarios = destinatariosPorAgrupamiento[agrupamiento] ?? []

      if (!esPctValido(pct)) {
        nuevosEstados[agrupamiento] = { kind: 'saltado', motivo: 'Falta el % de bono' }
      } else if (!mesReporte.trim()) {
        nuevosEstados[agrupamiento] = { kind: 'saltado', motivo: 'Falta el mes de producción' }
      } else if (destinatarios.length === 0) {
        nuevosEstados[agrupamiento] = { kind: 'saltado', motivo: 'Falta agregar destinatarios' }
      } else {
        nuevosEstados[agrupamiento] = { kind: 'enviando' }
      }
      setEstados({ ...nuevosEstados })
      if (nuevosEstados[agrupamiento].kind !== 'enviando') continue

      try {
        const regimenFiscal = regimenPorAgrupamiento[agrupamiento] ?? 'moral'
        const reporte = calculateReporte(rows, agrupamiento, pct, regimenFiscal)
        const doc = generateReportePdf(reporte, { mesReporte, branding })
        const pdfBytes = new Uint8Array(doc.output('arraybuffer') as ArrayBuffer)

        const attachments: EmailAttachment[] = [
          {
            filename: nombreArchivoPdf(reporte, mesReporte),
            mimeType: 'application/pdf',
            content: pdfBytes,
          },
        ]
        if (cfdi) {
          attachments.push({ filename: cfdi.name, mimeType: 'application/pdf', content: cfdi.bytes })
        }

        await sendGmailMessage(token, {
          to: destinatarios.join(', '),
          subject: renderPlantilla(plantilla.asunto, reporte, mesReporte),
          bodyText: renderPlantilla(plantilla.cuerpo, reporte, mesReporte),
          attachments,
        })
        nuevosEstados[agrupamiento] = { kind: 'enviado' }
      } catch (err) {
        nuevosEstados[agrupamiento] = {
          kind: 'error',
          mensaje: err instanceof GmailSendError ? err.message : 'No se pudo enviar el correo.',
        }
      }
      setEstados({ ...nuevosEstados })
    }

    setEnviando(false)
  }

  return (
    <>
      <table className="envio-masivo-table">
        <thead>
          <tr>
            <th>Agrupamiento</th>
            <th>% de bono</th>
            <th>Régimen fiscal</th>
            <th>Destinatarios</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {agrupamientos.map((agrupamiento) => (
            <tr key={agrupamiento}>
              <td>{agrupamiento}</td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="ej. 0.08"
                  value={pctPorAgrupamiento[agrupamiento] ?? ''}
                  onChange={(e) => onPctChange(agrupamiento, Number(e.target.value))}
                />
              </td>
              <td>
                <select
                  value={regimenPorAgrupamiento[agrupamiento] ?? 'moral'}
                  onChange={(e) =>
                    onRegimenFiscalChange(agrupamiento, e.target.value as RegimenFiscal)
                  }
                >
                  <option value="moral">Persona Moral</option>
                  <option value="fisica">Persona Física (general)</option>
                  <option value="fisica_resico">Persona Física (RESICO)</option>
                </select>
              </td>
              <td>
                <DestinatariosEditor
                  value={destinatariosPorAgrupamiento[agrupamiento] ?? []}
                  onChange={(value) => onDestinatariosChange(agrupamiento, value)}
                />
              </td>
              <td>
                <EstadoCelda estado={estados[agrupamiento] ?? { kind: 'idle' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <label className="envio-masivo__cfdi">
        CFDI / recibo de honorarios (opcional, se adjunta a los correos de todo el lote)
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            void handleCfdiChange(e.target.files?.[0])
          }}
        />
      </label>
      {cfdi && <p className="message message--success">Se adjuntará: {cfdi.name}</p>}

      {!clientId && (
        <p className="message message--error">
          Falta configurar VITE_GOOGLE_CLIENT_ID (ver README.md) para poder enviar correos desde
          Gmail.
        </p>
      )}
      {errorConexion && <p className="message message--error">{errorConexion}</p>}

      <button
        type="button"
        onClick={() => {
          void handleEnviarTodos()
        }}
        disabled={!clientId || enviando}
      >
        {enviando ? 'Enviando…' : 'Enviar todos'}
      </button>
    </>
  )
}

function EstadoCelda({ estado }: { estado: EstadoEnvio }) {
  switch (estado.kind) {
    case 'idle':
      return null
    case 'enviando':
      return <span>Enviando…</span>
    case 'enviado':
      return <span className="message message--success">Enviado</span>
    case 'saltado':
      return <span className="message message--info">Saltado: {estado.motivo}</span>
    case 'error':
      return <span className="message message--error">{estado.mensaje}</span>
  }
}
