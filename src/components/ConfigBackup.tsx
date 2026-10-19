import { useRef, useState } from 'react'
import type { BrandingConfig } from '../pdf/branding'
import type { RegimenFiscal } from '../engine/calculate'

export interface ConfigGuardada {
  branding: BrandingConfig
  destinatarios: Record<string, string[]>
  pct: Record<string, number>
  regimen: Record<string, RegimenFiscal>
}

interface Props {
  config: ConfigGuardada
  onImport: (config: ConfigGuardada) => void
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Respaldo manual de la configuración en un .json. localStorage se pierde si el
 * navegador borra los datos de sitios al cerrarse (común en equipos corporativos).
 */
export function ConfigBackup({ config, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

  function exportar() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'configuracion-bonos-afirme.json'
    a.click()
    URL.revokeObjectURL(url)
    setMensaje({ tipo: 'success', texto: 'Configuración exportada. Guarda el archivo en un lugar seguro.' })
  }

  async function importar(file: File | undefined) {
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    try {
      const data: unknown = JSON.parse(await file.text())
      if (
        !esObjeto(data) ||
        !esObjeto(data.branding) ||
        !esObjeto(data.destinatarios) ||
        !esObjeto(data.pct) ||
        !esObjeto(data.regimen)
      ) {
        throw new Error('formato')
      }
      onImport(data as unknown as ConfigGuardada)
      setMensaje({ tipo: 'success', texto: 'Configuración importada correctamente.' })
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'El archivo no es una configuración válida. Usa el .json generado con "Exportar".',
      })
    }
  }

  return (
    <div className="config-backup">
      <p className="branding-settings__hint">
        Respalda destinatarios, % , régimen fiscal, colores y logo en un archivo, para recuperarlos si el
        navegador los borra.
      </p>
      <div className="config-backup__row">
        <button type="button" onClick={exportar}>
          Exportar configuración
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Importar configuración
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void importar(e.target.files?.[0])}
        />
      </div>
      {mensaje && <p className={`message message--${mensaje.tipo}`}>{mensaje.texto}</p>}
    </div>
  )
}
