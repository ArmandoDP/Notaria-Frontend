'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  titulo:  string
  filtro:  { campo: string, valor: string } | { campo: 'hoy' }
  onClose: () => void
}

export default function ModalTicketsKPI({ titulo, filtro, onClose }: Props) {
  const [tickets,  setTickets]  = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      let query = supabase
        .from('tickets')
        .select('id, numero, estado, created_at, sla_vence_at, tramites_config(nombre, color_hex), areas(nombre), partes(nombre_completo, rol)')
        .order('created_at', { ascending: false })
        .limit(20)

      if (filtro.campo === 'hoy') {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        query = query.gte('created_at', hoy.toISOString())
      } else {
        query = query.eq(filtro.campo, filtro.valor)
      }

      const { data } = await query
      setTickets(data || [])
      setCargando(false)
    }
    cargar()
  }, [])

  const ESTADO_LABEL: Record<string, { label: string, color: string, bg: string }> = {
    nuevo:         { label: 'Nuevo',        color: '#185FA5', bg: '#E6F1FB' },
    asignado:      { label: 'Asignado',     color: '#3B6D11', bg: '#EAF3DE' },
    folio_dba:     { label: 'Folio DBA',    color: '#854F0B', bg: '#FEF3C7' },
    escritura_dba: { label: 'Escritura',    color: '#0F6E56', bg: '#D1FAE5' },
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>

      <div className="rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="text-[15px] font-bold" style={{ color: '#111' }}>{titulo}</div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-none text-[14px]"
            style={{ background: '#F3F4F6', color: '#666' }}>
            ✕
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 64px)' }}>
          {cargando ? (
            <div className="flex items-center justify-center py-12 text-[13px]" style={{ color: '#9C9890' }}>
              Cargando...
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-[32px] mb-2">📭</div>
              <div className="text-[13px]" style={{ color: '#9C9890' }}>Sin tickets</div>
            </div>
          ) : (
            <div className="flex flex-col">
              {tickets.map((t, i) => {
                const cliente = t.partes?.[0]?.nombre_completo || '—'
                const estado  = ESTADO_LABEL[t.estado] || { label: t.estado, color: '#666', bg: '#F3F4F6' }
                return (
                  <a key={t.id} href={`/tickets/${t.id}`}
                    className="flex items-center gap-3 px-6 py-3 no-underline transition-all"
                    style={{
                      borderBottom: i < tickets.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F7F7F5'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: t.tramites_config?.color_hex || '#666' }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold font-mono" style={{ color: '#111' }}>
                          {t.numero}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: estado.bg, color: estado.color }}>
                          {estado.label}
                        </span>
                      </div>
                      <div className="text-[11px] truncate" style={{ color: '#666' }}>
                        {t.tramites_config?.nombre} · {cliente}
                      </div>
                      <div className="text-[10px]" style={{ color: '#9C9890' }}>
                        {t.areas?.nombre}
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#185FA5' }}>
                      Ver →
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}