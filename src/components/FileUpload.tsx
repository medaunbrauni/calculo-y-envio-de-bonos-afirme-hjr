import type { ChangeEvent } from 'react'

interface Props {
  status: 'idle' | 'loading' | 'success' | 'error'
  fileName: string | null
  error: string | null
  onFileSelected: (file: File) => void
}

export function FileUpload({ status, fileName, error, onFileSelected }: Props) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFileSelected(file)
    event.target.value = ''
  }

  return (
    <section className="file-upload">
      <label className="file-upload__label">
        <input type="file" accept=".xlsx" onChange={handleChange} />
        Subir Excel del mes (.xlsx)
      </label>

      {status === 'loading' && <p className="message message--info">Leyendo {fileName}…</p>}
      {status === 'success' && (
        <p className="message message--success">{fileName} cargado correctamente.</p>
      )}
      {status === 'error' && <p className="message message--error">{error}</p>}
    </section>
  )
}
