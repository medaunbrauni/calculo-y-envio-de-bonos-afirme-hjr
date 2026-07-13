import { useState } from 'react'
import type { ReporteBono } from '../engine/calculate'
import { generateReportePdf, nombreArchivoPdf } from '../pdf/generateReportePdf'
import type { BrandingConfig } from '../pdf/branding'
import { esPctValido } from '../validation'

interface Props {
  reporte: ReporteBono
  pct: number | undefined
  mesReporte: string
  branding?: BrandingConfig
}

type Status = { kind: 'idle' } | { kind: 'success'; fileName: string } | { kind: 'error'; message: string }

export function GenerarPdfButton({ reporte, pct, mesReporte, branding }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const disabled = !esPctValido(pct) || !mesReporte.trim()

  function handleClick() {
    try {
      const doc = generateReportePdf(reporte, { mesReporte, branding })
      const fileName = nombreArchivoPdf(reporte, mesReporte)
      doc.save(fileName)
      setStatus({ kind: 'success', fileName })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No se pudo generar el PDF.',
      })
    }
  }

  return (
    <div className="generar-pdf">
      <button type="button" onClick={handleClick} disabled={disabled}>
        Generar PDF
      </button>
      {disabled && (
        <p className="message message--info">
          Captura el % de bono y el mes de producción antes de generar el PDF.
        </p>
      )}
      {status.kind === 'success' && (
        <p className="message message--success">PDF generado: {status.fileName}</p>
      )}
      {status.kind === 'error' && <p className="message message--error">{status.message}</p>}
    </div>
  )
}
