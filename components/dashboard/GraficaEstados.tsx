'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  ticketsPorEstado: { estado: string, total: number }[]
}

const COLORES: Record<string, string> = {
  nuevo:         '#185FA5',
  asignado:      '#3B6D11',
  folio_dba:     '#854F0B',
  escritura_dba: '#0F6E56',
}

const LABELS: Record<string, string> = {
  nuevo:         'Nuevo',
  asignado:      'Asignado',
  folio_dba:     'Folio DBA',
  escritura_dba: 'Escritura DBA',
}

export default function GraficaEstados({ ticketsPorEstado }: Props) {
  const total = ticketsPorEstado.reduce((s, t) => s + t.total, 0)

  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[13px] font-bold mb-1" style={{ color: '#111' }}>Tickets por estado</div>
      <div className="text-[11px] mb-4" style={{ color: '#9C9890' }}>{total} activos en total</div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={ticketsPorEstado} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
            dataKey="total" nameKey="estado" paddingAngle={3}>
            {ticketsPorEstado.map((entry, i) => (
              <Cell key={i} fill={COLORES[entry.estado] || '#9C9890'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [value, LABELS[name] || name]}
            contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '12px' }}
          />
          <Legend
            formatter={(value) => LABELS[value] || value}
            wrapperStyle={{ fontSize: '11px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}