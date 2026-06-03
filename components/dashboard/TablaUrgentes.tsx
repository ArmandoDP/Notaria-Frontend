'use client'

import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  tickets: any[]
}

export default function TablaUrgentes({ tickets }: Props) {
  if (tickets.length === 0) return null

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      <div className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[14px]">⚠️</span>
        <div>
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>SLA en riesgo</div>
          <div className="text-[11px]" style={{ color: '#9C9890' }}>Vencen en los próximos 3 días</div>
        </div>
      </div>

      <div className="flex flex-col">
        {tickets.map((t, i) => {
          const diasRestantes = differenceInDays(new Date(t.sla_vence_at), new Date())
          const vencido       = diasRestantes < 0
          const cliente       = t.partes?.[0]?.nombre_completo || '—'

          return (
            <a key={t.id} href={`/tickets/${t.id}`}
              className="flex items-center gap-3 px-5 py-3 no-underline transition-all"
              style={{
                borderBottom: i < tickets.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FFFBF0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

              <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                style={{ background: vencido ? '#E24B4A' : diasRestantes <= 1 ? '#F0B429' : '#F0C040' }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold font-mono" style={{ color: '#111' }}>
                    {t.numero}
                  </span>
                  <span className="text-[10px] truncate" style={{ color: '#666' }}>
                    {t.tramites_config?.nombre}
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: '#9C9890' }}>
                  {cliente} · {t.areas?.nombre}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-bold"
                  style={{ color: vencido ? '#E24B4A' : diasRestantes <= 1 ? '#F0B429' : '#854F0B' }}>
                  {vencido ? `Vencido hace ${Math.abs(diasRestantes)}d` : diasRestantes === 0 ? 'Vence hoy' : `${diasRestantes}d restantes`}
                </div>
                <div className="text-[10px]" style={{ color: '#9C9890' }}>
                  {format(new Date(t.sla_vence_at), "d MMM", { locale: es })}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}