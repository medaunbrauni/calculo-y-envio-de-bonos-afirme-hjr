import { useCallback, useState } from 'react'
import { ExcelValidationError, parseMatriz } from '../engine/parseExcel'
import type { MatrizRow } from '../engine/types'

interface State {
  status: 'idle' | 'loading' | 'success' | 'error'
  fileName: string | null
  rows: MatrizRow[]
  agrupamientos: string[]
  error: string | null
}

const initialState: State = {
  status: 'idle',
  fileName: null,
  rows: [],
  agrupamientos: [],
  error: null,
}

export function useMatrizWorkbook() {
  const [state, setState] = useState<State>(initialState)

  const loadFile = useCallback(async (file: File) => {
    setState({ ...initialState, status: 'loading', fileName: file.name })
    try {
      const buffer = await file.arrayBuffer()
      const { rows, agrupamientos } = parseMatriz(buffer)
      if (agrupamientos.length === 0) {
        throw new ExcelValidationError(
          'No se encontró ningún AGRUPAMIENTO en el archivo. Verifica que el Excel tenga datos.',
        )
      }
      setState({ status: 'success', fileName: file.name, rows, agrupamientos, error: null })
    } catch (err) {
      const message =
        err instanceof ExcelValidationError
          ? err.message
          : 'No se pudo leer el archivo. Verifica que sea un .xlsx válido.'
      setState({ status: 'error', fileName: file.name, rows: [], agrupamientos: [], error: message })
    }
  }, [])

  const reset = useCallback(() => setState(initialState), [])

  return { ...state, loadFile, reset }
}
