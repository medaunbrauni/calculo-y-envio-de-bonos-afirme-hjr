import { useEffect, useState } from 'react'

const KEY = 'bonos-afirme:tema'

function leerTemaGuardado(): 'light' | 'dark' | null {
  const guardado = window.localStorage.getItem(KEY)
  return guardado === 'light' || guardado === 'dark' ? guardado : null
}

function temaInicial(): 'light' | 'dark' {
  return leerTemaGuardado() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

/** Botón claro/oscuro explícito, guardado; hasta que el usuario lo toque, sigue al sistema. */
export function useTheme() {
  const [tema, setTema] = useState<'light' | 'dark'>(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      window.localStorage.setItem(KEY, tema)
    } catch {
      // localStorage puede no estar disponible; no es crítico.
    }
  }, [tema])

  function alternar() {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { tema, alternar }
}
