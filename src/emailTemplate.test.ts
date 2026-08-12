import { describe, expect, it } from 'vitest'
import { parseMatriz } from './engine/parseExcel'
import { calculateReporte } from './engine/calculate'
import { readSampleWorkbook } from './engine/__fixtures__/sampleWorkbook'
import { PLANTILLA_DEFAULT, renderPlantilla } from './emailTemplate'

const { rows } = parseMatriz(readSampleWorkbook())

describe('renderPlantilla — resumen del correo', () => {
  it('persona moral: no incluye líneas de retención', () => {
    const reporte = calculateReporte(rows, 'AUREN', 0.07, 'moral')
    const cuerpo = renderPlantilla(PLANTILLA_DEFAULT.cuerpo, reporte, 'JUNIO 2026')

    expect(cuerpo).not.toContain('Retención IVA')
    expect(cuerpo).not.toContain('Retención ISR')
    expect(cuerpo).toContain('- Total:')
  })

  it('persona física RESICO: sí incluye las retenciones y usa "Neto a pagar"', () => {
    const reporte = calculateReporte(rows, 'AUREN', 0.07, 'fisica_resico')
    const cuerpo = renderPlantilla(PLANTILLA_DEFAULT.cuerpo, reporte, 'JUNIO 2026')

    expect(cuerpo).toContain('Retención IVA')
    expect(cuerpo).toContain('Retención ISR')
    expect(cuerpo).toContain('- Neto a pagar:')
    expect(cuerpo).not.toContain('- Total:')
  })
})
