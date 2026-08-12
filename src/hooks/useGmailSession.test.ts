import { describe, expect, it } from 'vitest'
import { calcularExpiracion, tokenVigente, MARGEN_MS } from './useGmailSession'

describe('useGmailSession — expiración', () => {
  it('resta el margen de seguridad al calcular cuándo vence el token', () => {
    const ahora = 1_000_000
    expect(calcularExpiracion(3600, ahora)).toBe(ahora + 3600_000 - MARGEN_MS)
  })

  it('un token cuya expiración es futura sigue vigente', () => {
    expect(tokenVigente(2_000, 1_000)).toBe(true)
  })

  it('un token cuya expiración ya pasó no está vigente', () => {
    expect(tokenVigente(1_000, 2_000)).toBe(false)
  })
})
