'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  datos: { fecha: string, total: number }[]
}

export default function GraficaActividad({ datos }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[13px] font-bold mb-1" style={{ color: '#111' }}>Actividad — últimos 7 días</div>
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