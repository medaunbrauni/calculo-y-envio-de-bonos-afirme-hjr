import type { MatrizRow } from './types'

export interface Totals {
  impPrimaNeta: number
  ramosNoParticipantes: number
  masDe10Ton: number
  asistencias: number
  primaDesc: number
  emiDel: number
}

export interface SubramoPivot {
  subramo: string
  totals: Totals
}

export interface RamoPivot {
  ramo: string
  totals: Totals
  subramos: SubramoPivot[]
}

export interface AgentePrimaDesc {
  agente: string
  primaDesc: number
}

export type RegimenFiscal = 'moral' | 'fisica' | 'fisica_resico'

export interface Resumen {
  primaBase: number
  pct: number
  montoPct: number
  emisionDelegada: number
  subtotal: number
  regimenFiscal: RegimenFiscal
  iva: number
  /** Retención de IVA (2/3 del IVA trasladado) — aplica a ambas variantes de persona física. 0 en persona moral. */
  retencionIva: number
  /** Retención de ISR: 10% (general) o 1.25% (RESICO) sobre el subtotal. 0 en persona moral. */
  retencionIsr: number
  /** Persona moral: subtotal + IVA. Persona física: neto a pagar después de retenciones. */
  total: number
}

export interface ReporteBono {
  agrupamiento: string
  pivot: RamoPivot[]
  totalGeneral: Totals
  resumen: Resumen
  porAgente: AgentePrimaDesc[]
}

const BLANK_LABEL = '(en blanco)'
const IVA_RATE = 0.16
// Retenciones aplicables cuando una persona moral paga honorarios/comisión a una
// persona física por servicios profesionales independientes en México:
// - IVA: Art. 1-A fracción II inciso a) LIVA — retención de 2/3 del IVA trasladado,
//   aplica igual sin importar el régimen de ISR de la persona física.
// - ISR: depende del régimen de la persona física —
//   * Régimen general (Art. 106 LISR): 10% sobre el pago, sin deducción.
//   * RESICO (Art. 113-J LISR, vigente desde 2022 para personas físicas con
//     ingresos ≤ 3.5 millones anuales): 1.25% sobre el pago.
const IVA_RETENCION_RATE = (2 / 3) * IVA_RATE
const ISR_RETENCION_RATE_GENERAL = 0.1
const ISR_RETENCION_RATE_RESICO = 0.0125

function tasaIsrRetencion(regimenFiscal: RegimenFiscal): number {
  switch (regimenFiscal) {
    case 'fisica':
      return ISR_RETENCION_RATE_GENERAL
    case 'fisica_resico':
      return ISR_RETENCION_RATE_RESICO
    default:
      return 0
  }
}

function emptyTotals(): Totals {
  return {
    impPrimaNeta: 0,
    ramosNoParticipantes: 0,
    masDe10Ton: 0,
    asistencias: 0,
    primaDesc: 0,
    emiDel: 0,
  }
}

function addRowToTotals(totals: Totals, row: MatrizRow): void {
  totals.impPrimaNeta += row.impPrimaNeta
  totals.ramosNoParticipantes += row.ramosNoParticipantes
  totals.masDe10Ton += row.masDe10Ton
  totals.asistencias += row.asistencias
  totals.primaDesc += row.primaDesc
  totals.emiDel += row.emiDel
}

function labelOf(value: string | null): string {
  return value ?? BLANK_LABEL
}

// Excel ordena las etiquetas de fila alfabéticamente pero siempre deja
// "(en blanco)" al final, sin importar el orden alfabético real.
function sortLabels(a: string, b: string): number {
  if (a === BLANK_LABEL && b !== BLANK_LABEL) return 1
  if (b === BLANK_LABEL && a !== BLANK_LABEL) return -1
  return a.localeCompare(b, 'es')
}

/**
 * Pivotea MATRIZ (ya filtrada por AGRUPAMIENTO) por RAMO -> SUBRAMO y calcula
 * el bloque resumen, replicando docs/business-logic.md secciones 2 y 3.
 * El desglose por sub-agente (porAgente) aplica para todos los agrupamientos.
 */
export function calculateReporte(
  allRows: MatrizRow[],
  agrupamiento: string,
  pct: number,
  regimenFiscal: RegimenFiscal = 'moral',
): ReporteBono {
  const rows = allRows.filter((row) => row.agrupamiento === agrupamiento)

  const ramoMap = new Map<string, { totals: Totals; subramos: Map<string, Totals> }>()
  const agenteMap = new Map<string, number>()
  const totalGeneral = emptyTotals()

  for (const row of rows) {
    addRowToTotals(totalGeneral, row)

    const ramoLabel = labelOf(row.ramo)
    const subramoLabel = labelOf(row.subramo)

    let ramoEntry = ramoMap.get(ramoLabel)
    if (!ramoEntry) {
      ramoEntry = { totals: emptyTotals(), subramos: new Map() }
      ramoMap.set(ramoLabel, ramoEntry)
    }
    addRowToTotals(ramoEntry.totals, row)

    let subramoTotals = ramoEntry.subramos.get(subramoLabel)
    if (!subramoTotals) {
      subramoTotals = emptyTotals()
      ramoEntry.subramos.set(subramoLabel, subramoTotals)
    }
    addRowToTotals(subramoTotals, row)

    const agenteLabel = row.nomAgente ?? '(sin agente)'
    agenteMap.set(agenteLabel, (agenteMap.get(agenteLabel) ?? 0) + row.primaDesc)
  }

  const pivot: RamoPivot[] = [...ramoMap.entries()]
    .sort(([a], [b]) => sortLabels(a, b))
    .map(([ramo, entry]) => ({
      ramo,
      totals: entry.totals,
      subramos: [...entry.subramos.entries()]
        .sort(([a], [b]) => sortLabels(a, b))
        .map(([subramo, totals]) => ({ subramo, totals })),
    }))

  const porAgente: AgentePrimaDesc[] = [...agenteMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([agente, primaDesc]) => ({ agente, primaDesc }))

  const primaBase = totalGeneral.primaDesc
  const montoPct = primaBase * pct
  const emisionDelegada = totalGeneral.emiDel
  const subtotal = montoPct + emisionDelegada
  const iva = subtotal * IVA_RATE

  const esPersonaFisica = regimenFiscal !== 'moral'
  const retencionIva = esPersonaFisica ? subtotal * IVA_RETENCION_RATE : 0
  const retencionIsr = subtotal * tasaIsrRetencion(regimenFiscal)
  const total = subtotal + iva - retencionIva - retencionIsr

  return {
    agrupamiento,
    pivot,
    totalGeneral,
    resumen: {
      primaBase,
      pct,
      montoPct,
      emisionDelegada,
      subtotal,
      regimenFiscal,
      iva,
      retencionIva,
      retencionIsr,
      total,
    },
    porAgente,
  }
}
