'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import d from './dashboard.module.css'
import { ESTADOS, useContador } from './dashUtil'

interface Props {
  ticketsPorEstado: { estado: string; total: number }[]
  delay?: string
}

export default function GraficaEstados({ ticketsPorEstado, delay = '' }: Props) {
  const total = ticketsPorEstado.reduce((s, t) => s + t.total, 0)
  const n = useContador(total)
  const datos = ESTADOS
    .map(e => ({ ...e, total: ticketsPorEstado.find(t => t.estado === e.id)?.total || 0 }))
    .filter(e => e.total > 0)

  return (
    <section className={`${d.card} ${delay}`}>
      <div className={d.cardHead}>
        <div>
          <h3>Por etapa</h3>
          <p>Expedientes del periodo según su etapa actual</p>
        </div>
      </div>
      <div className={d.cardBody}>
        {total === 0 ? <div className={d.cardEmpty}>Sin expedientes en este periodo</div> : (
          <>
            <div className={d.donutWrap}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={datos} dataKey="total" nameKey="label" innerRadius={62} outerRadius={84} paddingAngle={2}
                    stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270}
                    animationDuration={900} animationEasing="ease-out">
                    {datos.map(e => <Cell key={e.id} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                    <div className={d.tip}><b>{payload[0].value}</b><span>{payload[0].name}</span></div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
              <div className={d.donutCenter}><b>{n.toLocaleString('es-MX')}</b><span>Expedientes</span></div>
            </div>
            <div className={d.legend}>
              {datos.map((e, i) => (
                <div key={e.id} className={d.legendRow} style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                  <i style={{ background: e.color, border: e.id === 'cancelado' ? '1px solid #d6d6d3' : undefined }} />
                  <span>{e.label}</span>
                  <b>{e.total.toLocaleString('es-MX')}</b>
                  <em>{Math.round((e.total / total) * 100)}%</em>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}