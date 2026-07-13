import { useEffect, useMemo, useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { AgrupamientoSelector } from './components/AgrupamientoSelector'
import { ReportePreview } from './components/ReportePreview'
import { GenerarPdfButton } from './components/GenerarPdfButton'
import { EmailComposer } from './components/EmailComposer'
import { BrandingSettings } from './components/BrandingSettings'
import { useMatrizWorkbook } from './hooks/useMatrizWorkbook'
import { useLocalStorage } from './hooks/useLocalStorage'
import { calculateReporte, type RegimenFiscal } from './engine/calculate'
import { calcularMesPredominante } from './engine/mesReporte'
import { PLANTILLA_DEFAULT } from './emailTemplate'
import { DEFAULT_BRANDING, type BrandingConfig } from './pdf/branding'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function App() {
  const workbook = useMatrizWorkbook()
  const [selected, setSelected] = useState<string | null>(null)
  const [mesReporte, setMesReporte] = useState('')
  const [pctPorAgrupamiento, setPctPorAgrupamiento] = useLocalStorage<Record<string, number>>(
    'bonos-afirme:pct-por-agrupamiento',
    {},
  )
  const [destinatariosPorAgrupamiento, setDestinatariosPorAgrupamiento] = useLocalStorage<
    Record<string, string[]>
  >('bonos-afirme:destinatarios-por-agrupamiento:v2', {})
  const [regimenPorAgrupamiento, setRegimenPorAgrupamiento] = useLocalStorage<
    Record<string, RegimenFiscal>
  >('bonos-afirme:regimen-fiscal-por-agrupamiento', {})
  const [plantilla] = useLocalStorage('bonos-afirme:plantilla-correo', PLANTILLA_DEFAULT)
  const [branding, setBranding] = useLocalStorage<BrandingConfig>(
    'bonos-afirme:branding',
    DEFAULT_BRANDING,
  )

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', branding.colorPrimario)
    document.documentElement.style.setProperty('--brand-secondary', branding.colorSecundario)
  }, [branding])

  useEffect(() => {
    if (workbook.status === 'success' && workbook.rows.length > 0) {
      // Sugerencia a partir de FECHAMOVIMIENTO; el usuario puede corregirla libremente
      // (el mes que "reporta" el archivo no siempre es el de las fechas de movimiento).
      setMesReporte(calcularMesPredominante(workbook.rows))
    }
  }, [workbook.status, workbook.rows])

  const pct = selected ? pctPorAgrupamiento[selected] : undefined
  const regimenFiscal: RegimenFiscal = (selected && regimenPorAgrupamiento[selected]) || 'moral'

  const reporte = useMemo(() => {
    if (!selected) return null
    // El pivot/tabla no depende del %; si aún no se captura, se calcula con 0
    // y el resumen (que sí depende del %) se oculta en ReportePreview.
    const pctValido = pct !== undefined && Number.isFinite(pct) ? pct : 0
    return calculateReporte(workbook.rows, selected, pctValido, regimenFiscal)
  }, [workbook.rows, selected, pct, regimenFiscal])

  function handleFileSelected(file: File) {
    setSelected(null)
    void workbook.loadFile(file)
  }

  function handlePctChange(value: number) {
    if (!selected) return
    setPctPorAgrupamiento((prev) => ({ ...prev, [selected]: value }))
  }

  function handleDestinatariosChange(value: string[]) {
    if (!selected) return
    setDestinatariosPorAgrupamiento((prev) => ({ ...prev, [selected]: value }))
  }

  function handleRegimenFiscalChange(value: RegimenFiscal) {
    if (!selected) return
    setRegimenPorAgrupamiento((prev) => ({ ...prev, [selected]: value }))
  }

  return (
    <main>
      <h1>Bonos AFIRME</h1>
      <p>Sube el Excel mensual (pestaña MATRIZ) para generar los reportes de bono.</p>

      <BrandingSettings branding={branding} onChange={setBranding} />

      <FileUpload
        status={workbook.status}
        fileName={workbook.fileName}
        error={workbook.error}
        onFileSelected={handleFileSelected}
      />

      {workbook.status === 'success' && (
        <>
          <label className="mes-reporte">
            Mes de producción que cubre este reporte (sugerido a partir de FECHAMOVIMIENTO —
            edítalo si no es correcto)
            <input
              type="text"
              placeholder="MAYO 2026"
              value={mesReporte}
              onChange={(e) => setMesReporte(e.target.value)}
            />
          </label>

          <AgrupamientoSelector
            agrupamientos={workbook.agrupamientos}
            selected={selected}
            onSelect={setSelected}
          />
        </>
      )}

      {selected && reporte && (
        <div key={selected}>
          <ReportePreview
            reporte={reporte}
            pct={pct}
            onPctChange={handlePctChange}
            mesReporte={mesReporte}
            regimenFiscal={regimenFiscal}
            onRegimenFiscalChange={handleRegimenFiscalChange}
          />
          <GenerarPdfButton reporte={reporte} pct={pct} mesReporte={mesReporte} branding={branding} />
          <EmailComposer
            reporte={reporte}
            pct={pct}
            mesReporte={mesReporte}
            destinatarios={destinatariosPorAgrupamiento[selected] ?? []}
            onDestinatariosChange={handleDestinatariosChange}
            plantilla={plantilla}
            branding={branding}
            clientId={GOOGLE_CLIENT_ID}
          />
        </div>
      )}
    </main>
  )
}

export default App
