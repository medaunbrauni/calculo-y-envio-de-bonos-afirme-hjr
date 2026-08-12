import { useState } from 'react'

const KEY = 'bonos-afirme:gmail-session'
// Margen de seguridad para no usar un token a punto de vencer.
export const MARGEN_MS = 60_000

interface Session {
  accessToken: string
  expiresAt: number
}

export function calcularExpiracion(expiresInSeconds: number, ahora: number): number {
  return ahora + expiresInSeconds * 1000 - MARGEN_MS
}

export function tokenVigente(expiresAt: number, ahora: number): boolean {
  return expiresAt > ahora
}

function leerSesionValida(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return tokenVigente(parsed.expiresAt, Date.now()) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Token de acceso a Gmail compartido en toda la app (no por-componente), para
 * no pedir "Conectar con Gmail" al cambiar de agrupamiento. Vive en sessionStorage
 * (se pierde al cerrar la pestaña) — nunca en localStorage, es un dato sensible.
 */
export function useGmailSession() {
  const [session, setSession] = useState<Session | null>(leerSesionValida)

  function guardar(accessToken: string, expiresInSeconds: number) {
    const value: Session = { accessToken, expiresAt: calcularExpiracion(expiresInSeconds, Date.now()) }
    setSession(value)
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // sessionStorage puede no estar disponible (modo privado, cuota llena); no es crítico.
    }
  }

  const accessToken = session && tokenVigente(session.expiresAt, Date.now()) ? session.accessToken : null

  return { accessToken, guardar }
}
