'use client'

import d from './dashboard.module.css'

interface Props {
  datos: { tramite: string; total: number }[]
  delay?: string
}

export default function GraficaTramites({ datos, delay = '' }: Props) {
  const max = Math.max(1, ...datos.map(x => x.total))
  return (
    <section className={`${d.card} ${delay}`}>
      <div className={d.cardHead}>
        <div>
          <h3>Trámites más frecuentes</h3>
          <p>Expedientes activos del periodo</p>
        </div>
      </div>
      <div className={d.cardBody}>
        {datos.length === 0 ? <div className={d.cardEmpty}>Sin expedientes activos</div> : (
          <div className={d.bars}>
            {datos.map((x, i) => (
              <div key={x.tramite} className={d.barRow} style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                <div className={d.barTop}><span title={x.tramite}>{x.tramite}</span><b>{x.total.toLocaleString('es-MX')}</b></div>
                <div className={d.barTrack}>
                  <i style={{ ['--w' as any]: `${(x.total / max) * 100}%`, background: i === 0 ? '#111' : '#6b6b6b', animationDelay: `${0.25 + i * 0.06}s` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}