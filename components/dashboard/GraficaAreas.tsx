'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  datos: { area: string, total: number }[]
}

export default function GraficaAreas({ datos }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[13px] font-bold mb-1" style={{ color: '#111' }}>Tickets activos por área</div>
      <div className="text-[11px] mb-4" style={{ color: '#9C9890' }}>Estados: nuevo, asignado, folio DBA</div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="area" tick={{ fontSize: 10 }} width={90} />
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '12px' }}
          />
          <Bar dataKey="total" radius={[0, 6, 6, 0]}>
            {datos.map((_, i) => (
              <Cell key={i} fill={`hsl(${220 + i * 18}, 60%, ${45 + i * 3}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}