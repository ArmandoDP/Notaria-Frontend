'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  datos: { tramite: string, total: number }[]
}

const COLORES = ['#185FA5', '#854F0B', '#3B6D11', '#534AB7', '#A32D2D', '#0F6E56']

export default function GraficaTramites({ datos }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[13px] font-bold mb-1" style={{ color: '#111' }}>Top trámites activos</div>
      <div className="text-[11px] mb-4" style={{ color: '#9C9890' }}>Los 6 más frecuentes en este momento</div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="tramite" tick={{ fontSize: 9 }} width={120}
            tickFormatter={v => v.length > 20 ? v.slice(0, 20) + '…' : v} />
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '12px' }}
          />
          <Bar dataKey="total" radius={[0, 6, 6, 0]}>
            {datos.map((_, i) => (
              <Cell key={i} fill={COLORES[i % COLORES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}