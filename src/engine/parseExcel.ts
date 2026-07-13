import * as XLSX from 'xlsx'
import type { MatrizRow, ParseResult } from './types'
import { parseFechaMovimiento } from './mesReporte'

const SHEET_NAME = 'MATRIZ'

// Columnas mínimas que el motor de cálculo necesita leer de MATRIZ (Flujo A:
// se asume que AD-AM ya vienen calculadas en el Excel, ver docs/business-logic.md).
const REQUIRED_COLUMNS = [
  'FECHAMOVIMIENTO',
  'RAMO',
  'SUBRAMO',
  'AGRUPAMIENTO',
  'NOM_AGENTE',
  'IMP_PRIMA_NETA',
  'RAMOS NO PARTICIPANTES',
  '>10 TON',
  'ASISTENCIAS',
  'PRIMA - DESC',
  'EMI DEL',
] as const

export class ExcelValidationError extends Error {}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

export function parseMatriz(data: ArrayBuffer | Uint8Array): ParseResult {
  const buffer = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheet = workbook.Sheets[SHEET_NAME]
  if (!sheet) {
    throw new ExcelValidationError(
      `No se encontró la pestaña "${SHEET_NAME}" en el archivo. Verifica que subiste el Excel correcto.`,
    )
  }

  const table: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  })
  if (table.length === 0) {
    throw new ExcelValidationError(`La pestaña "${SHEET_NAME}" está vacía.`)
  }

  const headerRow = table[0].map((h) => (h === null ? '' : String(h).trim()))
  const columnIndex = new Map<string, number>()
  headerRow.forEach((header, index) => columnIndex.set(header, index))

  const missing = REQUIRED_COLUMNS.filter((column) => !columnIndex.has(column))
  if (missing.length > 0) {
    throw new ExcelValidationError(
      `Faltan columnas en la pestaña "${SHEET_NAME}": ${missing.join(', ')}.`,
    )
  }

  const idx = Object.fromEntries(
    REQUIRED_COLUMNS.map((column) => [column, columnIndex.get(column)!]),
  ) as Record<(typeof REQUIRED_COLUMNS)[number], number>

  const rows: MatrizRow[] = []
  const agrupamientos = new Set<string>()

  for (let r = 1; r < table.length; r++) {
    const raw = table[r]
    const isEmptyRow = raw.every((cell) => cell === null || cell === '')
    if (isEmptyRow) continue

    const agrupamiento = toText(raw[idx.AGRUPAMIENTO])
    if (agrupamiento) agrupamientos.add(agrupamiento)

    rows.push({
      fecha: parseFechaMovimiento(raw[idx.FECHAMOVIMIENTO]),
      ramo: toText(raw[idx.RAMO]),
      subramo: toText(raw[idx.SUBRAMO]),
      agrupamiento,
      nomAgente: toText(raw[idx.NOM_AGENTE]),
      impPrimaNeta: toNumber(raw[idx.IMP_PRIMA_NETA]),
      ramosNoParticipantes: toNumber(raw[idx['RAMOS NO PARTICIPANTES']]),
      masDe10Ton: toNumber(raw[idx['>10 TON']]),
      asistencias: toNumber(raw[idx.ASISTENCIAS]),
      primaDesc: toNumber(raw[idx['PRIMA - DESC']]),
      emiDel: toNumber(raw[idx['EMI DEL']]),
    })
  }

  return { rows, agrupamientos: [...agrupamientos].sort() }
}
