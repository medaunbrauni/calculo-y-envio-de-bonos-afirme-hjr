export interface BrandingConfig {
  colorPrimario: string
  colorSecundario: string
  logoDataUrl?: string
}

export const DEFAULT_BRANDING: BrandingConfig = {
  colorPrimario: '#0b3d91',
  colorSecundario: '#c9a227',
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
