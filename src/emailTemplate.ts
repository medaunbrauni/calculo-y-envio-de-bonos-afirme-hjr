import type { ReporteBono } from './engine/calculate'
import { formatCurrency, formatPercent } from './format'

export interface PlantillaCorreo {
  asunto: string
  cuerpo: string
}

export const PLANTILLA_DEFAULT: PlantillaCorreo = {
  asunto: 'Bono {agrupamiento} - {mes}',
  cuerpo: `Hola,

Adjunto el reporte de Bono correspondiente a {agrupamiento} - {mes}.

Resumen:
{resumen}

El concepto del recibo de honorarios o factura debe ser: "Asesoría en ventas para seguros AFIRME".

Favor de confirmar recepción.

Saludos.`,
}

// Mismo desglose que las tarjetas de ReportePreview: solo se listan las
// retenciones cuando el agrupamiento es persona física, si no el correo
// muestra un Subtotal+IVA que no cuadra con el Total sin explicación.
function construirResumenTexto(reporte: ReporteBono): string {
  const { resumen } = reporte
  const esPersonaFisica = resumen.regimenFiscal !== 'moral'

  const lineas = [
    `- Prima Base: ${formatCurrency(resumen.primaBase)}`,
    `- Bono (${formatPercent(resumen.pct)}): ${formatCurrency(resumen.montoPct)}`,
    `- Emisión Delegada: ${formatCurrency(resumen.emisionDelegada)}`,
    `- Subtotal: ${formatCurrency(resumen.subtotal)}`,
    `- IVA: ${formatCurrency(resumen.iva)}`,
  ]
  if (esPersonaFisica) {
    lineas.push(`- Retención IVA: -${formatCurrency(resumen.retencionIva)}`)
    lineas.push(`- Retención ISR: -${formatCurrency(resumen.retencionIsr)}`)
  }
  lineas.push(`- ${esPersonaFisica ? 'Neto a pagar' : 'Total'}: ${formatCurrency(resumen.total)}`)

  return lineas.join('\n')
}

function variablesDeReporte(reporte: ReporteBono, mesReporte: string): Record<string, string> {
  return {
    agrupamiento: reporte.agrupamiento,
    mes: mesReporte || 'Mes no especificado',
    primaBase: formatCurrency(reporte.resumen.primaBase),
    pct: formatPercent(reporte.resumen.pct),
    montoPct: formatCurrency(reporte.resumen.montoPct),
    emisionDelegada: formatCurrency(reporte.resumen.emisionDelegada),
    subtotal: formatCurrency(reporte.resumen.subtotal),
    iva: formatCurrency(reporte.resumen.iva),
    retencionIva: formatCurrency(reporte.resumen.retencionIva),
    retencionIsr: formatCurrency(reporte.resumen.retencionIsr),
    total: formatCurrency(reporte.resumen.total),
    resumen: construirResumenTexto(reporte),
  }
}

export function renderPlantilla(texto: string, reporte: ReporteBono, mesReporte: string): string {
  const vars = variablesDeReporte(reporte, mesReporte)
  return texto.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}
