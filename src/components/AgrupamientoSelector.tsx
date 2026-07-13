interface Props {
  agrupamientos: string[]
  selected: string | null
  onSelect: (agrupamiento: string) => void
}

export function AgrupamientoSelector({ agrupamientos, selected, onSelect }: Props) {
  return (
    <section className="agrupamiento-selector">
      <h2>Agrupamientos detectados</h2>
      <div className="agrupamiento-selector__list">
        {agrupamientos.map((agrupamiento) => (
          <button
            key={agrupamiento}
            type="button"
            className={
              agrupamiento === selected
                ? 'agrupamiento-card agrupamiento-card--selected'
                : 'agrupamiento-card'
            }
            onClick={() => onSelect(agrupamiento)}
          >
            {agrupamiento}
          </button>
        ))}
      </div>
    </section>
  )
}
