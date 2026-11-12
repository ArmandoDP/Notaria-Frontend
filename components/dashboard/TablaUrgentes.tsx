'use client'

import { format, differenceInCalendarDays, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import d from './dashboard.module.css'

interface Props {
  tickets: any[]
  total:   number
  delay?:  string
  onVerTodos?: () => void
}

export default function TablaUrgentes({ tickets, total, delay = '', onVerTodos }: Props) {
  return (
    <section className={`${d.card} ${delay}`}>
      <div className={`${d.cardHead} ${d.cardHeadLine}`}>
        <div>
          <h3>Plazos en riesgo</h3>
          <p>Vencidos o que vencen en los próximos 3 días</p>
        </div>
        <span className={`${d.countBadge} ${total === 0 ? d.countBadgeOk : ''}`}>{total === 0 ? 'Todo en tiempo' : `${total} en riesgo`}</span>
      </div>
      {tickets.length === 0 ? <div className={d.cardEmpty}>Ningún expediente activo está por vencer.</div> : (
        <div className={d.rows}>
          {tickets.map((t, i) => {
            const vence = new Date(t.sla_vence_at)
            const vencido = isPast(vence)
            const dias = differenceInCalendarDays(vence, new Date())
            const cliente = t.partes?.find((p: any) => p.nombre_completo)?.nombre_completo || 'Sin cliente'
            const texto = vencido ? `Vencido hace ${Math.max(1, -dias)} d` : dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} d`
            return (
              <a key={t.id} href={`/tickets/${t.id}`} className={d.row} style={{ animationDelay: `${0.15 + i * 0.04}s` }}>
                <span className={`${d.rowMark} ${vencido ? d.rowMarkRed : dias <= 1 ? d.rowMarkDark : ''}`} />
                <div className={d.rowMain}>
                  <b><small>{t.numero}</small>{t.tramites_config?.nombre}</b>
                  <span>{cliente} · {t.areas?.nombre || 'Sin área'}</span>
                </div>
                <div className={d.rowSide}>
                  <b className={vencido ? d.textRed : ''}>{texto}</b>
                  <span>{format(vence, "d 'de' MMM", { locale: es })}</span>
                </div>
              </a>
            )
          })}
          {total > tickets.length && onVerTodos && (
            <button type="button" className={d.row} style={{ border: 'none', background: 'none', font: 'inherit', cursor: 'pointer', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700 }} onClick={onVerTodos}>
              Ver los {total} expedientes en riesgo
            </button>
          )}
        </div>
      )}
    </section>
  )
}