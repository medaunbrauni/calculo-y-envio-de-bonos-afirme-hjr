import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ReporteBono } from '../engine/calculate'
import { formatCurrency, formatPercent } from '../format'
import { DEFAULT_BRANDING, hexToRgb, type BrandingConfig } from './branding'

export interface GenerarPdfOptions {
  mesReporte: string
  branding?: BrandingConfig
  fechaGeneracion?: Date
}

const MARGIN = 40
const SUBRAMO_INDENT = '     '

function pintarEncabezado(
  doc: jsPDF,
  reporte: ReporteBono,
  options: GenerarPdfOptions,
  primario: [number, number, number],
): void {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...primario)
  doc.rect(0, 0, pageWidth, 70, 'F')

  let textX = MARGIN
  const branding = options.branding ?? DEFAULT_BRANDING
  if (branding.logoDataUrl) {
    try {
      doc.addImage(branding.logoDataUrl, 'PNG', MARGIN, 12, 46, 46)
      textX = MARGIN + 58
    } catch {
      // Logo inválido/corrupto: seguimos sin logo, no debe bloquear la generación del PDF.
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(`BONO AFIRME ${reporte.agrupamiento}`, textX, 32)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const fecha = (options.fechaGeneracion ?? new Date()).toLocaleDateString('es-MX')
  const mes = options.mesReporte || 'Mes no especificado'
  doc.text(`${mes}  ·  Generado el ${fecha}`, textX, 50)

  doc.setTextColor(20, 20, 20)
}

function pintarCards(
  doc: jsPDF,
  reporte: ReporteBono,
  primario: [number, number, number],
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const esPersonaFisica = reporte.resumen.regimenFiscal !== 'moral'
  const cards = [
    { label: 'Prima Base', value: formatCurrency(reporte.resumen.primaBase) },
    { label: formatPercent(reporte.resumen.pct), value: formatCurrency(reporte.resumen.montoPct) },
    { label: 'Emisión Delegada', value: formatCurrency(reporte.resumen.emisionDelegada) },
    { label: 'Subtotal', value: formatCurrency(reporte.resumen.subtotal) },
    { label: 'IVA', value: formatCurrency(reporte.resumen.iva) },
    ...(esPersonaFisica
      ? [
          { label: 'Retención IVA', value: `-${formatCurrency(reporte.resumen.retencionIva)}` },
          { label: 'Retención ISR', value: `-${formatCurrency(reporte.resumen.retencionIsr)}` },
        ]
      : []),
    {
      label: esPersonaFisica ? 'Neto a pagar' : 'Total',
      value: formatCurrency(reporte.resumen.total),
      highlight: true,
    },
  ]

  const startY = 95
  const height = 50
  const gap = 8
  const maxPorFila = 6
  const filas: (typeof cards)[] = []
  for (let i = 0; i < cards.length; i += maxPorFila) {
    filas.push(cards.slice(i, i + maxPorFila))
  }

  filas.forEach((fila, filaIndex) => {
    const y = startY + filaIndex * (height + gap)
    const width = (pageWidth - MARGIN * 2 - gap * (fila.length - 1)) / fila.length

    fila.forEach((card, i) => {
      const x = MARGIN + i * (width + gap)
      if (card.highlight) {
        doc.setFillColor(...primario)
        doc.setTextColor(255, 255, 255)
      } else {
        doc.setFillColor(244, 245, 247)
        doc.setTextColor(30, 30, 30)
      }
      doc.roundedRect(x, y, width, height, 4, 4, 'F')
      doc.setFontSize(7.5)
      doc.text(card.label, x + 6, y + 16, { maxWidth: width - 12 })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.text(card.value, x + 6, y + 34, { maxWidth: width - 12 })
      doc.setFont('helvetica', 'normal')
    })
  })

  doc.setTextColor(20, 20, 20)
  return startY + filas.length * height + (filas.length - 1) * gap
}

function pintarTablaPivot(
  doc: jsPDF,
  reporte: ReporteBono,
  startY: number,
  primario: [number, number, number],
): number {
  const head = [
    ['Ramo / Subramo', 'Prima Neta', 'No Particip.', '>10 Ton', 'Asistencias', 'Prima - Desc', 'Emi Del'],
  ]

  const body: string[][] = []
  for (const ramo of reporte.pivot) {
    body.push([
      ramo.ramo,
      formatCurrency(ramo.totals.impPrimaNeta),
      formatCurrency(ramo.totals.ramosNoParticipantes),
      formatCurrency(ramo.totals.masDe10Ton),
      formatCurrency(ramo.totals.asistencias),
      formatCurrency(ramo.totals.primaDesc),
      formatCurrency(ramo.totals.emiDel),
    ])
    for (const subramo of ramo.subramos) {
      body.push([
        `${SUBRAMO_INDENT}${subramo.subramo}`,
        formatCurrency(subramo.totals.impPrimaNeta),
        formatCurrency(subramo.totals.ramosNoParticipantes),
        formatCurrency(subramo.totals.masDe10Ton),
        formatCurrency(subramo.totals.asistencias),
        formatCurrency(subramo.totals.primaDesc),
        formatCurrency(subramo.totals.emiDel),
      ])
    }
  }
  body.push([
    'Total general',
    formatCurrency(reporte.totalGeneral.impPrimaNeta),
    formatCurrency(reporte.totalGeneral.ramosNoParticipantes),
    formatCurrency(reporte.totalGeneral.masDe10Ton),
    formatCurrency(reporte.totalGeneral.asistencias),
    formatCurrency(reporte.totalGeneral.primaDesc),
    formatCurrency(reporte.totalGeneral.emiDel),
  ])

  autoTable(doc, {
    startY: startY + 20,
    margin: { left: MARGIN, right: MARGIN },
    head,
    body,
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: primario, textColor: 255 },
    columnStyles: { 0: { cellWidth: 150 } },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const raw = data.row.raw as string[]
      const firstCell = String(raw[0])
      const isDetailRow = firstCell.startsWith(SUBRAMO_INDENT)
      if (!isDetailRow) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [244, 245, 247]
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable.finalY as number
}

function pintarTablaSubagente(doc: jsPDF, reporte: ReporteBono, startY: number, primario: [number, number, number]): number {
  if (reporte.porAgente.length === 0) return startY

  const total = reporte.porAgente.reduce((acc, a) => acc + a.primaDesc, 0)
  const body = reporte.porAgente.map((a) => [a.agente, formatCurrency(a.primaDesc)])
  body.push(['Total general', formatCurrency(total)])

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Desglose por sub-agente (${reporte.agrupamiento})`, MARGIN, startY + 20)
  doc.setFont('helvetica', 'normal')

  autoTable(doc, {
    startY: startY + 28,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Agente', 'Prima - Desc']],
    body,
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: primario, textColor: 255 },
    didParseCell: (data) => {
      const raw = data.row.raw as string[]
      if (data.section === 'body' && raw[0] === 'Total general') {
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable.finalY as number
}

function pintarPies(doc: jsPDF): void {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(`Página ${i} de ${pages}`, pageWidth - MARGIN, pageHeight - 20, { align: 'right' })
  }
}

export function generateReportePdf(reporte: ReporteBono, options: GenerarPdfOptions): jsPDF {
  const branding = options.branding ?? DEFAULT_BRANDING
  const primario = hexToRgb(branding.colorPrimario)

  const doc = new jsPDF({ unit: 'pt', format: 'letter' })

  pintarEncabezado(doc, reporte, options, primario)
  const afterCardsY = pintarCards(doc, reporte, primario)
  const afterPivotY = pintarTablaPivot(doc, reporte, afterCardsY, primario)
  pintarTablaSubagente(doc, reporte, afterPivotY, primario)
  pintarPies(doc)

  return doc
}

export function nombreArchivoPdf(reporte: ReporteBono, mesReporte: string): string {
  const mesSlug = (mesReporte || 'reporte').trim().replace(/\s+/g, '_').toUpperCase()
  const agrupamientoSlug = reporte.agrupamiento.trim().replace(/\s+/g, '_').toUpperCase()
  return `BONO_${mesSlug}_${agrupamientoSlug}.pdf`
}
