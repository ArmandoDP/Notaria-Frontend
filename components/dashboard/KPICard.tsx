'use client'

import d from './dashboard.module.css'
import { Ic, useContador } from './dashUtil'

interface Props {
  titulo:     string
  valor:      number
  subtitulo?: string
  alerta?:    boolean
  anterior?:  number | null
  onClick?:   () => void
}

export default function KPICard({ titulo, valor, subtitulo, alerta, anterior, onClick }: Props) {
  const n = useContador(valor)
  let delta: { texto: string; sube: boolean } | null = null
  if (anterior !== undefined && anterior !== null) {
    if (anterior === 0) delta = valor > 0 ? { texto: 'nuevo', sube: true } : null
    else {
      const pct = Math.round(((valor - anterior) / anterior) * 100)
      delta = { texto: `${pct > 0 ? '+' : ''}${pct}%`, sube: pct > 0 }
    }
  }

  return (
    <button type="button" className={`${d.kpi} ${alerta ? d.kpiRed : ''}`} onClick={onClick}>
      <small>
        {titulo}
        {delta
          ? <span className={`${d.delta} ${delta.sube ? d.deltaUp : ''}`} title="Contra el periodo anterior">
              <Ic n={delta.sube ? 'up' : 'down'} size={10} sw={2.6} />{delta.texto}
            </span>
          : <span className={d.arrowGo}><Ic n="arrow" size={13} /></span>}
      </small>
      <strong>{n.toLocaleString('es-MX')}</strong>
      {subtitulo && <span>{subtitulo}</span>}
    </button>
  )
}