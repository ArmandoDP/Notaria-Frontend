'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  datos: { fecha: string, total: number }[]
  periodo: string
}

const PERIODO_LABEL: Record<string, string> = {
  hoy:  'hoy',
  '7d': 'últimos 7 días',
  '30d':'últimos 30 días',
  '3m': 'últimos 3 meses',
  '6m': 'últimos 6 meses',
  todo: 'todo el tiempo',
}

export default function GraficaActividad({ datos, periodo }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[13px] font-bold mb-1" style={{ color: '#111' }}>Actividad — {PERIODO_LABEL[periodo] || periodo}</div>
      <div className="text-[11px] mb-4" style={{ color: '#9C9890' }}>Tickets creados por día</div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '12px' }}
          />
          <Line type="monotone" dataKey="total" stroke="#185FA5" strokeWidth={2}
            dot={{ fill: '#185FA5', r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}