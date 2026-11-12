'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import d from './dashboard.module.css'
import { PERIODOS, PeriodoId } from './dashUtil'

interface Props {
  datos:   { fecha: string; detalle: string; total: number }[]
  periodo: PeriodoId
  delay?:  string
}

const AGRUPADO: Record<PeriodoId, string> = {
  hoy: 'por hora', '7d': 'por día', '30d': 'por día', '3m': 'por semana', '6m': 'por semana', todo: 'por mes',
}

export default function GraficaActividad({ datos, periodo, delay = '' }: Props) {
  const total = datos.reduce((s, x) => s + x.total, 0)
  const texto = PERIODOS.find(p => p.id === periodo)?.texto || ''
  return (
    <section className={`${d.card} ${delay}`}>
      <div className={d.cardHead}>
        <div>
          <h3>Expedientes ingresados</h3>
          <p>{total.toLocaleString('es-MX')} en {texto} · {AGRUPADO[periodo]}</p>
        </div>
      </div>
      <div className={d.cardBody} style={{ paddingLeft: 4 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={datos} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="relleno-actividad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#111" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#efefed" />
            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#6b6b6b' }} tickLine={false} axisLine={{ stroke: '#e6e6e4' }}
              interval="preserveStartEnd" minTickGap={18} />
            <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip cursor={{ stroke: '#111', strokeDasharray: '3 3' }}
              content={({ active, payload }: any) => active && payload?.length ? (
                <div className={d.tip}><b>{payload[0].value}</b><span>{payload[0].payload.detalle}</span></div>
              ) : null} />
            <Area type="monotone" dataKey="total" stroke="#111" strokeWidth={2} fill="url(#relleno-actividad)"
              dot={false} activeDot={{ r: 5, fill: '#111', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1000} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}