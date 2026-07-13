import { describe, expect, it } from 'vitest'
import { parseMatriz } from './parseExcel'
import { calculateReporte } from './calculate'
import { readSampleWorkbook } from './__fixtures__/sampleWorkbook'

// Valores esperados extraídos directamente de las hojas de pivot ya calculadas
// dentro del propio Excel de muestra (CHIHUAHUA BONO, TOLUCA BONO, IVAN BONO,
// AUREN BONO, ALE FLORES), NO de los 3 PDF "golden" — esos PDF son de un mes
// distinto (MAYO) al Excel de muestra (JUNIO) y no coinciden en cifras, solo
// sirven como referencia de formato/diseño.
const { rows } = parseMatriz(readSampleWorkbook())

describe('calculateReporte', () => {
  it('reproduce el pivot y resumen de la hoja "CHIHUAHUA BONO" (JIRO CHIH, 4%)', () => {
    const reporte = calculateReporte(rows, 'JIRO CHIH', 0.04)

    expect(reporte.totalGeneral.impPrimaNeta).toBeCloseTo(87614.81, 2)
    expect(reporte.totalGeneral.ramosNoParticipantes).toBeCloseTo(638.1, 2)
    expect(reporte.totalGeneral.asistencias).toBeCloseTo(15098.41, 2)
    expect(reporte.totalGeneral.primaDesc).toBeCloseTo(71878.3, 2)
    expect(reporte.totalGeneral.emiDel).toBeCloseTo(0, 2)

    expect(reporte.resumen.primaBase).toBeCloseTo(71878.3, 2)
    expect(reporte.resumen.montoPct).toBeCloseTo(2875.13, 2)
    expect(reporte.resumen.subtotal).toBeCloseTo(2875.13, 2)
    expect(reporte.resumen.iva).toBeCloseTo(460.02, 2)
    expect(reporte.resumen.total).toBeCloseTo(3335.15, 2)

    const autos = reporte.pivot.find((r) => r.ramo === 'AUTOS')
    expect(autos?.totals.impPrimaNeta).toBeCloseTo(82620.47, 2)
    expect(autos?.totals.primaDesc).toBeCloseTo(70857.76, 2)
    expect(autos?.subramos.map((s) => s.subramo)).toEqual([
      'AUTOS',
      'AUTOS FRONTERIZOS',
      'CAMIONES',
      'CAMIONES FRONTERIZOS',
    ])

    const blanco = reporte.pivot.find((r) => r.ramo === '(en blanco)')
    expect(blanco?.totals.primaDesc).toBeCloseTo(-2282.32, 2)
    // "(en blanco)" siempre debe quedar al final, aunque alfabéticamente no le toque.
    expect(reporte.pivot.at(-1)?.ramo).toBe('(en blanco)')
  })

  it('reproduce el resumen de "TOLUCA BONO" (JIRO TOL, 8%, con Emisión Delegada)', () => {
    const reporte = calculateReporte(rows, 'JIRO TOL', 0.08)

    expect(reporte.totalGeneral.primaDesc).toBeCloseTo(832205.54, 2)
    expect(reporte.totalGeneral.emiDel).toBeCloseTo(21700, 2)
    expect(reporte.resumen.montoPct).toBeCloseTo(66576.44, 2)
    expect(reporte.resumen.subtotal).toBeCloseTo(88276.44, 2)
    expect(reporte.resumen.iva).toBeCloseTo(14124.23, 2)
    expect(reporte.resumen.total).toBeCloseTo(102400.67, 2)
  })

  it('reproduce el resumen y desglose por sub-agente de "IVAN BONO" (IVAN, 7%)', () => {
    const reporte = calculateReporte(rows, 'IVAN', 0.07)

    expect(reporte.resumen.primaBase).toBeCloseTo(118331.35, 2)
    expect(reporte.resumen.total).toBeCloseTo(9608.51, 2)

    const porAgente = Object.fromEntries(reporte.porAgente.map((a) => [a.agente, a.primaDesc]))
    expect(porAgente['GERARDO ABEL ZARAGOZA CONTRERAS']).toBeCloseTo(105693.6, 2)
    expect(porAgente['IVAN LEON VILLA']).toBeCloseTo(493.63, 2)
    expect(porAgente['LUIS BONOLA VALDEZ']).toBeCloseTo(5794.66, 2)

    const sumaAgentes = reporte.porAgente.reduce((acc, a) => acc + a.primaDesc, 0)
    expect(sumaAgentes).toBeCloseTo(reporte.resumen.primaBase, 2)
  })

  it('reproduce el resumen y desglose por sub-agente de "AUREN BONO" (AUREN, 7%)', () => {
    const reporte = calculateReporte(rows, 'AUREN', 0.07)

    expect(reporte.resumen.primaBase).toBeCloseTo(181067.92, 2)
    expect(reporte.resumen.total).toBeCloseTo(14702.72, 2)

    const porAgente = Object.fromEntries(reporte.porAgente.map((a) => [a.agente, a.primaDesc]))
    expect(porAgente['OSCAR LUIS ROMERO RUIZ']).toBeCloseTo(47847.34, 2)
    expect(porAgente['IMPULSA DE MEXICO AGENTE DE SEGUROS Y FIANZAS SA DE CV']).toBeCloseTo(
      92210.55,
      2,
    )
  })

  it('reproduce el resumen de "ALE FLORES" (AFLORES, 4%, con Emisión Delegada)', () => {
    const reporte = calculateReporte(rows, 'AFLORES', 0.04)

    expect(reporte.totalGeneral.primaDesc).toBeCloseTo(73442.64, 2)
    expect(reporte.totalGeneral.emiDel).toBeCloseTo(50, 2)
    expect(reporte.resumen.subtotal).toBeCloseTo(2987.71, 2)
    expect(reporte.resumen.iva).toBeCloseTo(478.03, 2)
    expect(reporte.resumen.total).toBeCloseTo(3465.74, 2)
  })

  it('regresa un reporte vacío (totales en 0) para un agrupamiento inexistente', () => {
    const reporte = calculateReporte(rows, 'NO EXISTE', 0.1)
    expect(reporte.pivot).toEqual([])
    expect(reporte.totalGeneral.primaDesc).toBe(0)
    expect(reporte.resumen.total).toBe(0)
  })

  it('persona moral (default): sin retenciones, total = subtotal + IVA', () => {
    const reporte = calculateReporte(rows, 'JIRO CHIH', 0.04, 'moral')
    expect(reporte.resumen.retencionIva).toBe(0)
    expect(reporte.resumen.retencionIsr).toBe(0)
    expect(reporte.resumen.total).toBeCloseTo(reporte.resumen.subtotal + reporte.resumen.iva, 2)
  })

  it('persona física: aplica retención de ISR (10%) e IVA (2/3 del trasladado)', () => {
    const reporte = calculateReporte(rows, 'JIRO CHIH', 0.04, 'fisica')
    const { subtotal, iva, retencionIva, retencionIsr, total } = reporte.resumen

    expect(retencionIsr).toBeCloseTo(subtotal * 0.1, 2)
    expect(retencionIva).toBeCloseTo(subtotal * (2 / 3) * 0.16, 2)
    expect(total).toBeCloseTo(subtotal + iva - retencionIva - retencionIsr, 2)
    // Neto esperado para este fixture: subtotal 2875.13 * (1 + 0.16 - 0.10667 - 0.10)
    expect(total).toBeCloseTo(2740.96, 1)
  })

  it('persona física RESICO: aplica retención de ISR (1.25%) e IVA (2/3 del trasladado)', () => {
    const reporte = calculateReporte(rows, 'JIRO CHIH', 0.04, 'fisica_resico')
    const { subtotal, iva, retencionIva, retencionIsr, total } = reporte.resumen

    expect(retencionIsr).toBeCloseTo(subtotal * 0.0125, 2)
    expect(retencionIva).toBeCloseTo(subtotal * (2 / 3) * 0.16, 2)
    expect(total).toBeCloseTo(subtotal + iva - retencionIva - retencionIsr, 2)
    // Neto esperado para este fixture: subtotal 2875.13 * (1 + 0.16 - 0.10667 - 0.0125)
    expect(total).toBeCloseTo(2992.53, 1)
  })
})
