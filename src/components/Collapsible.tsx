import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}

export function Collapsible({ title, defaultOpen = true, className, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={className ? `collapsible ${className}` : 'collapsible'}>
      <button
        type="button"
        className="collapsible__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="collapsible__chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="collapsible__body">{children}</div>}
    </section>
  )
}
