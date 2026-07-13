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
- Prima Base: {primaBase}
- Bono ({pct}): {montoPct}
- Emisión Delegada: {emisionDelegada}
- Subtotal: {subtotal}
- IVA: {iva}
- Total: {total}

Favor de confirmar recepción.

Saludos.`,
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
    total: formatCurrency(reporte.resumen.total),
  }
}

export function renderPlantilla(texto: string, reporte: ReporteBono, mesReporte: string): string {
  const vars = variablesDeReporte(reporte, mesReporte)
  return texto.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}
