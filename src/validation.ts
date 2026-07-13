/** El % de bono se captura como fracción (0.08 = 8%); fuera de [0,1] es casi
 * siempre un error de captura (ej. escribir "8" en vez de "0.08"). */
export function esPctValido(pct: number | undefined): pct is number {
  return pct !== undefined && Number.isFinite(pct) && pct >= 0 && pct <= 1
}
