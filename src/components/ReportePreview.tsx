import { Fragment } from 'react'
import type { RegimenFiscal, ReporteBono } from '../engine/calculate'
import { formatCurrency, formatPercent } from '../format'
import { esPctValido } from '../validation'

interface Props {
  reporte: ReporteBono
  pct: number | undefined
  onPctChange: (pct: number) => void
  mesReporte: string
  regimenFiscal: RegimenFiscal
  onRegimenFiscalChange: (regimen: RegimenFiscal) => void
}

export function ReportePreview({
  reporte,
  pct,
  onPctChange,
  mesReporte,
  regimenFiscal,
  onRegimenFiscalChange,
}: Props) {
  const { resumen, pivot, totalGeneral, porAgente } = reporte
  const esPersonaFisica = regimenFiscal !== 'moral'

  return (
    <section className="reporte-preview">
      <h2>
        {reporte.agrupamiento}
        {mesReporte ? ` — ${mesReporte}` : ''}
      </h2>

      <div className="reporte-preview__controles">
        <label className="pct-editor">
          % de bono
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            placeholder="ej. 0.08 para 8%"
            value={pct ?? ''}
            onChange={(e) => onPctChange(Number(e.target.value))}
          />
        </label>

        <label className="regimen-fiscal-editor">
          Régimen fiscal del agente
          <select
            value={regimenFiscal}
            onChange={(e) => onRegimenFiscalChange(e.target.value as RegimenFiscal)}
          >
            <option value="moral">Persona Moral</option>
            <option value="fisica">Persona Física (régimen general)</option>
            <option value="fisica_resico">Persona Física (RESICO)</option>
          </select>
        </label>
      </div>

      {regimenFiscal === 'fisica' && (
        <p className="message message--info">
          Persona física, régimen general: retención de ISR 10% (Art. 106 LISR) e IVA 2/3 del IVA
          trasladado (Art. 1-A LIVA).
        </p>
      )}
      {regimenFiscal === 'fisica_resico' && (
        <p className="message message--info">
          Persona física, RESICO: retención de ISR 1.25% (Art. 113-J LISR) e IVA 2/3 del IVA
          trasladado (Art. 1-A LIVA).
        </p>
      )}

      {!esPctValido(pct) ? (
        <p className="message message--error">
          {pct !== undefined && !Number.isNaN(pct)
            ? 'El % de bono debe ser un valor entre 0 y 1 (ej. 0.08 para 8%). Revisa si escribiste "8" en vez de "0.08".'
            : 'Captura el % de bono negociado para este agrupamiento antes de generar el reporte.'}
        </p>
      ) : (
        <div className="cards">
          <Card label="Prima Base" value={formatCurrency(resumen.primaBase)} />
          <Card label={formatPercent(resumen.pct)} value={formatCurrency(resumen.montoPct)} />
          <Card label="Emisión Delegada" value={formatCurrency(resumen.emisionDelegada)} />
          <Card label="Subtotal" value={formatCurrency(resumen.subtotal)} />
          <Card label="IVA" value={formatCurrency(resumen.iva)} />
          {esPersonaFisica && (
            <>
              <Card label="Retención IVA" value={`-${formatCurrency(resumen.retencionIva)}`} />
              <Card label="Retención ISR" value={`-${formatCurrency(resumen.retencionIsr)}`} />
            </>
          )}
          <Card
            label={esPersonaFisica ? 'Neto a pagar' : 'Total'}
            value={formatCurrency(resumen.total)}
            highlight
          />
        </div>
      )}

      <table className="pivot-table">
        <thead>
          <tr>
            <th>Ramo / Subramo</th>
            <th>Prima Neta</th>
            <th>Ramos no participantes</th>
            <th>{'>10 Ton'}</th>
            <th>Asistencias</th>
            <th>Prima - Desc</th>
            <th>Emi Del</th>
          </tr>
        </thead>
        <tbody>
          {pivot.map((ramo) => (
            <Fragment key={ramo.ramo}>
              <tr className="pivot-table__ramo">
                <td>{ramo.ramo}</td>
                <td>{formatCurrency(ramo.totals.impPrimaNeta)}</td>
                <td>{formatCurrency(ramo.totals.ramosNoParticipantes)}</td>
                <td>{formatCurrency(ramo.totals.masDe10Ton)}</td>
                <td>{formatCurrency(ramo.totals.asistencias)}</td>
                <td>{formatCurrency(ramo.totals.primaDesc)}</td>
                <td>{formatCurrency(ramo.totals.emiDel)}</td>
              </tr>
              {ramo.subramos.map((subramo) => (
                <tr key={`${ramo.ramo}-${subramo.subramo}`} className="pivot-table__subramo">
                  <td>{subramo.subramo}</td>
                  <td>{formatCurrency(subramo.totals.impPrimaNeta)}</td>
                  <td>{formatCurrency(subramo.totals.ramosNoParticipantes)}</td>
                  <td>{formatCurrency(subramo.totals.masDe10Ton)}</td>
                  <td>{formatCurrency(subramo.totals.asistencias)}</td>
                  <td>{formatCurrency(subramo.totals.primaDesc)}</td>
                  <td>{formatCurrency(subramo.totals.emiDel)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total general</td>
            <td>{formatCurrency(totalGeneral.impPrimaNeta)}</td>
            <td>{formatCurrency(totalGeneral.ramosNoParticipantes)}</td>
            <td>{formatCurrency(totalGeneral.masDe10Ton)}</td>
            <td>{formatCurrency(totalGeneral.asistencias)}</td>
            <td>{formatCurrency(totalGeneral.primaDesc)}</td>
            <td>{formatCurrency(totalGeneral.emiDel)}</td>
          </tr>
        </tfoot>
      </table>

      {porAgente.length > 0 && (
        <table className="subagente-table">
          <caption>Desglose por sub-agente ({reporte.agrupamiento})</caption>
          <thead>
            <tr>
              <th>Agente</th>
              <th>Prima - Desc</th>
            </tr>
          </thead>
          <tbody>
            {porAgente.map((a) => (
              <tr key={a.agente}>
                <td>{a.agente}</td>
                <td>{formatCurrency(a.primaDesc)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total general</td>
              <td>{formatCurrency(porAgente.reduce((acc, a) => acc + a.primaDesc, 0))}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  )
}

function Card({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={highlight ? 'card card--highlight' : 'card'}>
      <span className="card__label">{label}</span>
      <span className="card__value">{value}</span>
    </div>
  )
}
