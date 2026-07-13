import { useRef, useState } from 'react'
import type { BrandingConfig } from '../pdf/branding'

interface Props {
  branding: BrandingConfig
  onChange: (branding: BrandingConfig) => void
}

const MAX_LOGO_BYTES = 1_000_000 // 1MB — de sobra para un logo PNG, cuida no saturar localStorage

export function BrandingSettings({ branding, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleLogoChange(file: File | undefined) {
    setError(null)
    if (!file) return

    if (file.type !== 'image/png') {
      setError('El logo debe ser un archivo PNG.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('El logo pesa demasiado (máximo 1MB). Usa una versión más ligera.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onChange({ ...branding, logoDataUrl: reader.result as string })
    }
    reader.onerror = () => setError('No se pudo leer el archivo del logo.')
    reader.readAsDataURL(file)
  }

  function handleQuitarLogo() {
    onChange({ ...branding, logoDataUrl: undefined })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <section className="branding-settings">
      <h3>Personalización de marca</h3>
      <p className="branding-settings__hint">
        Estos colores y logo se usan en el PDF generado (y se guardan para los próximos meses).
      </p>

      <div className="branding-settings__row">
        <label className="branding-settings__color">
          Color primario
          <input
            type="color"
            value={branding.colorPrimario}
            onChange={(e) => onChange({ ...branding, colorPrimario: e.target.value })}
          />
        </label>

        <label className="branding-settings__color">
          Color secundario
          <input
            type="color"
            value={branding.colorSecundario}
            onChange={(e) => onChange({ ...branding, colorSecundario: e.target.value })}
          />
        </label>

        <label className="branding-settings__logo">
          Logo (PNG)
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={(e) => handleLogoChange(e.target.files?.[0])}
          />
        </label>

        {branding.logoDataUrl && (
          <div className="branding-settings__preview">
            <img src={branding.logoDataUrl} alt="Logo actual" />
            <button type="button" onClick={handleQuitarLogo}>
              Quitar logo
            </button>
          </div>
        )}
      </div>

      {error && <p className="message message--error">{error}</p>}
    </section>
  )
}
