import type { FechaMovimiento, MatrizRow } from './types'

const MESES_ES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
]

const ABREVIATURAS_MES: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
}

const FECHA_TEXTO_RE = /^(\d{1,2})\/([a-zA-Z]{3})\/(\d{4})$/

/** FECHAMOVIMIENTO en MATRIZ viene como texto "dd/mmm/yyyy" (ej. "01/jun/2026") o como fecha real de Excel. */
export function parseFechaMovimiento(value: unknown): FechaMovimiento | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getFullYear(), month: value.getMonth() + 1 }
  }
  if (typeof value === 'string') {
    const match = FECHA_TEXTO_RE.exec(value.trim())
    if (!match) return null
    const month = ABREVIATURAS_MES[match[2].toLowerCase()]
    if (!month) return null
    return { year: Number(match[3]), month }
  }
  return null
}

/** Mes/año que más se repite en FECHAMOVIMIENTO — usado como default sugerido para el header del reporte. */
export function calcularMesPredominante(rows: MatrizRow[]): string {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!row.fecha) continue
    const key = `${row.fecha.year}-${row.fecha.month}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let mejorClave: string | null = null
  let mejorConteo = 0
  for (const [key, count] of counts) {
    if (count > mejorConteo) {
      mejorConteo = count
      mejorClave = key
    }
  }
  if (!mejorClave) return ''

  const [yearStr, monthStr] = mejorClave.split('-')
  return `${MESES_ES[Number(monthStr) - 1]} ${yearStr}`
}
