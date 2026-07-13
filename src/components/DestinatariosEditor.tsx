import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

export function DestinatariosEditor({ value, onChange }: Props) {
  const [nuevo, setNuevo] = useState('')

  function agregar() {
    const email = nuevo.trim()
    if (!email || !email.includes('@')) return
    if (value.includes(email)) {
      setNuevo('')
      return
    }
    onChange([...value, email])
    setNuevo('')
  }

  function quitar(email: string) {
    onChange(value.filter((e) => e !== email))
  }

  return (
    <div className="destinatarios-editor">
      <span className="destinatarios-editor__label">Destinatarios</span>

      {value.length > 0 && (
        <ul className="destinatarios-editor__chips">
          {value.map((email) => (
            <li key={email} className="destinatarios-editor__chip">
              {email}
              <button
                type="button"
                aria-label={`Quitar ${email}`}
                onClick={() => quitar(email)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="destinatarios-editor__add">
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregar()
            }
          }}
        />
        <button type="button" onClick={agregar}>
          Agregar
        </button>
      </div>

      {value.length === 0 && (
        <p className="message message--info">
          Agrega al menos un correo destinatario para este agrupamiento.
        </p>
      )}
    </div>
  )
}
