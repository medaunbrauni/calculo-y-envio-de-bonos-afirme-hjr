import { describe, expect, it } from 'vitest'
import { parseMatriz } from './parseExcel'
import { calcularMesPredominante, parseFechaMovimiento } from './mesReporte'
import { readSampleWorkbook } from './__fixtures__/sampleWorkbook'

describe('parseFechaMovimiento', () => {
  it('parsea texto "dd/mmm/yyyy" con abreviatura de mes en español', () => {
    expect(parseFechaMovimiento('01/jun/2026')).toEqual({ year: 2026, month: 6 })
    expect(parseFechaMovimiento('15/dic/2025')).toEqual({ year: 2025, month: 12 })
  })

  it('acepta objetos Date', () => {
    expect(parseFechaMovimiento(new Date(2026, 4, 10))).toEqual({ year: 2026, month: 5 })
  })

  it('regresa null para valores no reconocidos', () => {
    expect(parseFechaMovimiento(null)).toBeNull()
    expect(parseFechaMovimiento('no es una fecha')).toBeNull()
  })
})

describe('calcularMesPredominante', () => {
  it('detecta JUNIO 2026 en el Excel de muestra', () => {
    const { rows } = parseMatriz(readSampleWorkbook())
    expect(calcularMesPredominante(rows)).toBe('JUNIO 2026')
  })

  it('regresa cadena vacía si no hay filas con fecha reconocible', () => {
    expect(calcularMesPredominante([])).toBe('')
  })
})
