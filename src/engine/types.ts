export interface FechaMovimiento {
  year: number
  month: number // 1-12
}

export interface MatrizRow {
  fecha: FechaMovimiento | null
  ramo: string | null
  subramo: string | null
  agrupamiento: string | null
  nomAgente: string | null
  impPrimaNeta: number
  ramosNoParticipantes: number
  masDe10Ton: number
  asistencias: number
  primaDesc: number
  emiDel: number
}

export interface ParseResult {
  rows: MatrizRow[]
  agrupamientos: string[]
}
