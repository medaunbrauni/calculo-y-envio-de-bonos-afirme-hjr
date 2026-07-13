import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseMatriz, ExcelValidationError } from './parseExcel'
import { readSampleWorkbook } from './__fixtures__/sampleWorkbook'

describe('parseMatriz', () => {
  it('lee la pestaña MATRIZ del Excel de muestra y detecta los agrupamientos', () => {
    const { rows, agrupamientos } = parseMatriz(readSampleWorkbook())

    expect(agrupamientos).toEqual(['AFLORES', 'AUREN', 'IVAN', 'JIRO', 'JIRO CHIH', 'JIRO TOL'])
    expect(rows.length).toBeGreaterThan(700)
  })

  it('marca RAMO/SUBRAMO vacíos como null (fila "(en blanco)")', () => {
    const { rows } = parseMatriz(readSampleWorkbook())
    const depositRow = rows.find((r) => r.ramo === null && r.agrupamiento === 'JIRO TOL')
    expect(depositRow).toBeDefined()
  })

  it('lanza ExcelValidationError si falta la pestaña MATRIZ', () => {
    // Un workbook mínimo válido pero sin la pestaña MATRIZ.
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['A']])
    XLSX.utils.book_append_sheet(wb, ws, 'OTRA')
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

    expect(() => parseMatriz(new Uint8Array(buffer))).toThrow(ExcelValidationError)
  })
})
