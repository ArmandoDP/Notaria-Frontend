'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Area, TramiteConfig } from '@/types/database'
import { formatDistanceToNow, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

const COLUMNAS = [
  { id: 'nuevo',      label: 'Nuevo',       color: '#534AB7', bg: '#EEEDFE' },
  { id: 'en_proceso', label: 'En proceso',  color: '#185FA5', bg: '#E6F1FB' },
  { id: 'pend_docs',  label: 'Pend. docs',  color: '#854F0B', bg: '#FAEEDA' },
  { id: 'firma',      label: 'Firma',       color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'completo',   label: 'Completo',    color: '#3B6D11', bg: '#EAF3DE' },
  { id: 'demorado',   label: 'Demorado',    color: '#A32D2D', bg: '#FCEBEB' },
  { id: 'entregado',  label: 'Entregado',   color: '#166534', bg: '#F0FDF4' },
]

interface Props {
  ticketsIniciales: Ticket[]
  areas:            Area[]
  tramites:         Pick<TramiteConfig, 'id' | 'nombre' | 'color_hex'>[]
}

export default function KanbanBoard({ ticketsIniciales, areas, tramites }: Props) {
  const [tickets,       setTickets]       = useState<Ticket[]>(ticketsIniciales)
  const [filtroArea,    setFiltroArea]    = useState<string>('todas')
  const [filtroTramite, setFiltroTramite] = useState<string>('todos')
  const supabase = createClient()

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('kanban-tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table:  'tickets',
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('tickets')
            .select('*, tramites_config(nombre, color_hex), areas(nombre, color_hex), partes(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) setTickets(prev => [data, ...prev])
        }
        if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t =>
            t.id === payload.new.id ? { ...t, ...payload.new } : t
          ))
        }
        if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Filtros
  const ticketsFiltrados = tickets.filter(t => {
    if (filtroArea    !== 'todas' && t.area_id    !== filtroArea)    return false
    if (filtroTramite !== 'todos' && t.tramite_id !== filtroTramite) return false
    return true
  })

  // Stats
  const activos   = tickets.filter(t => !['entregado','cancelado'].includes(t.estado)).length
  const preDBA    = tickets.filter(t => !t.folio_dba && !['cancelado','entregado'].includes(t.estado)).length
  const demorados = tickets.filter(t => t.estado === 'demorado').length
  const entregados = tickets.filter(t => t.estado === 'entregado').length

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Activos',    val: activos,   sub: 'En sistema',        color: '#534AB7', bg: 'rgba(83,74,183,0.06)'  },
          { label: 'Pre-DBA',    val: preDBA,    sub: 'Sin folio asignado', color: '#92650A', bg: 'rgba(184,130,10,0.06)' },
          { label: 'Demorados',  val: demorados, sub: 'Requieren atención', color: '#A32D2D', bg: 'rgba(226,75,74,0.06)'  },
          { label: 'Entregados', val: entregados,sub: 'Total histórico',    color: '#166534', bg: 'rgba(99,153,34,0.06)'  },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
              {s.label}
            </div>
            <div className="text-[28px] font-bold leading-none tracking-tight" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className="text-[11px] mt-1.5 font-medium" style={{ color: s.color, opacity: 0.7 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: '#111' }}>
            Kanban de trabajo
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#9C9890' }}>
            {ticketsFiltrados.length} tickets · Actualización en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro área */}
          <select
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-medium border-none outline-none cursor-pointer"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#444', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <option value="todas">Todas las áreas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>

          {/* Filtro trámite */}
          <select
            value={filtroTramite}
            onChange={e => setFiltroTramite(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-medium border-none outline-none cursor-pointer"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#444', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <option value="todos">Todos los trámites</option>
            {tramites.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>

          {/* Botón nueva solicitud */}
          <a href="/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white no-underline transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#111', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
            <span className="text-[14px]">+</span>
            Nueva solicitud
          </a>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNAS.map(col => {
          const colTickets = ticketsFiltrados.filter(t => t.estado === col.id)
          return (
            <div key={col.id} className="flex-shrink-0 w-[200px]">
              {/* Col header */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-t-2xl mb-0.5"
                style={{ background: 'rgba(255,255,255,0.7)' }}>
                <span className="text-[11.5px] font-bold" style={{ color: '#333' }}>{col.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: col.bg, color: col.color }}>
                  {colTickets.length}
                </span>
              </div>

              {/* Tickets */}
              <div className="flex flex-col gap-2 p-2 rounded-b-2xl rounded-tr-2xl min-h-[120px]"
                style={{ background: 'rgba(0,0,0,0.03)' }}>
                {colTickets.length === 0 && (
                  <div className="text-center py-6 text-[11px]" style={{ color: 'rgba(0,0,0,0.2)' }}>
                    Sin tickets
                  </div>
                )}
                {colTickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const vencido   = isPast(new Date(ticket.sla_vence_at))
  const tramite   = ticket.tramites_config as any
  const area      = ticket.areas as any
  const partes    = (ticket.partes as any[]) || []
  const primero   = partes[0]?.nombre_completo

  const slaLabel = formatDistanceToNow(new Date(ticket.sla_vence_at), { locale: es, addSuffix: true })

  return (
    <a href={`/tickets/${ticket.id}`}
      className="block rounded-xl p-3 no-underline transition-all duration-200 hover:-translate-y-0.5 group"
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${tramite?.color_hex || '#ddd'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>

      <div className="text-[9px] font-bold tracking-wider mb-1.5" style={{ color: '#C0BAB2', fontFamily: 'monospace' }}>
        {ticket.numero}
      </div>

      <div className="text-[11.5px] font-semibold leading-snug mb-1" style={{ color: '#1A1917' }}>
        {tramite?.nombre || 'Trámite'}
      </div>

      {primero && (
        <div className="text-[10.5px] mb-2.5 truncate" style={{ color: '#AAA' }}>
          {primero}
        </div>
      )}

      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate"
          style={{ background: `${area?.color_hex}18`, color: area?.color_hex || '#666' }}>
          {area?.nombre || '—'}
        </span>
        <span className="text-[9.5px] font-medium flex-shrink-0"
          style={{ color: vencido ? '#E24B4A' : '#B0ADAA' }}>
          {vencido ? '⚠ ' : ''}{slaLabel}
        </span>
      </div>
    </a>
  )
}