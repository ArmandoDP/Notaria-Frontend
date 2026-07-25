'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Area, TramiteConfig } from '@/types/database'
import { formatDistanceToNow, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

const COLUMNAS = [
  { id: 'nuevo',         label: 'Nuevo',         color: '#534AB7', bg: 'rgba(83,74,183,0.1)'   },
  { id: 'asignado',      label: 'Asignado',       color: '#185FA5', bg: 'rgba(24,95,165,0.1)'   },
  { id: 'folio_dba',     label: 'Folio DBA',      color: '#854F0B', bg: 'rgba(133,79,11,0.1)'   },
  { id: 'escritura_dba', label: 'Escritura DBA',  color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'   },
  { id: 'cancelado',     label: 'Cancelado',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  { id: 'completado',    label: 'Completado',     color: '#3B6D11', bg: 'rgba(59,109,17,0.1)' },
]

const ESTATUS_PRIORIDAD: Record<string, { dot: string, prioridad: number }> = {
  demorado:   { dot: '#E24B4A', prioridad: 1 },
  pendiente:  { dot: '#F59E0B', prioridad: 2 },
  no_pagado:  { dot: '#8B5CF6', prioridad: 3 },
  en_proceso: { dot: '#EAB308', prioridad: 4 },
  ok:         { dot: '#10B981', prioridad: 5 },
  pagado:     { dot: '#3B82F6', prioridad: 5 },
}

function getEstatusPrioritario(observaciones: any[]) {
  if (!observaciones || observaciones.length === 0) return null
  const sorted = [...observaciones].sort((a, b) => {
    const pa = ESTATUS_PRIORIDAD[a.estatus]?.prioridad ?? 99
    const pb = ESTATUS_PRIORIDAD[b.estatus]?.prioridad ?? 99
    return pa - pb
  })
  return ESTATUS_PRIORIDAD[sorted[0].estatus] || null
}

interface Props {
  ticketsIniciales: Ticket[]
  areas:            Area[]
  tramites:         Pick<TramiteConfig, 'id' | 'nombre' | 'color_hex'>[]
}

export default function KanbanBoard({ ticketsIniciales, areas, tramites }: Props) {
  const [tickets,       setTickets]       = useState<Ticket[]>(ticketsIniciales)
  const [filtroArea,    setFiltroArea]    = useState<string>('todas')
  const [filtroTramite, setFiltroTramite] = useState<string>('todos')
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos')
  const supabase = createClient()

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('kanban-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('tickets')
              .select('*, tramites_config(nombre, color_hex), areas(nombre, color_hex), partes(*), observaciones(estatus)')
              .eq('id', payload.new.id).single()
            if (data) setTickets(prev => [data as any, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('tickets')
              .select('*, tramites_config(nombre, color_hex), areas(nombre, color_hex), partes(*), observaciones(estatus)')
              .eq('id', payload.new.id).single()
            if (data) setTickets(prev => prev.map(t => t.id === payload.new.id ? data as any : t))
          }
          if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(t => t.id !== (payload.old as any).id))
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Filtros
  const ticketsFiltrados = tickets.filter(t => {
    if (filtroArea    !== 'todas' && (t as any).area_id    !== filtroArea)    return false
    if (filtroTramite !== 'todos' && (t as any).tramite_id !== filtroTramite) return false
    if (filtroEstatus !== 'todos') {
      const obs = (t as any).observaciones || []
      if (filtroEstatus === 'sin_obs') return obs.length === 0
      const p = getEstatusPrioritario(obs)
      if (!p) return false
      const prioridades: Record<string, number> = {
        demorado: 1, pendiente: 2, no_pagado: 3, en_proceso: 4, ok: 5
      }
      if (p.prioridad !== prioridades[filtroEstatus]) return false
    }
    return true
  })

  const activos    = tickets.filter(t => (t as any).estado !== 'cancelado').length
  const sinFolio   = tickets.filter(t => !(t as any).folio_dba).length
  const foliosDBA  = tickets.filter(t => (t as any).estado === 'folio_dba').length
  const escrituras = tickets.filter(t => (t as any).estado === 'escritura_dba').length

  return (
    <div>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Activos',    val: activos,    sub: 'En sistema',         color: '#534AB7', bg: 'rgba(83,74,183,0.06)'  },
          { label: 'Sin folio',  val: sinFolio,   sub: 'Sin folio asignado', color: '#92650A', bg: 'rgba(184,130,10,0.06)' },
          { label: 'Folios DBA', val: foliosDBA,  sub: 'En proceso',         color: '#854F0B', bg: 'rgba(133,79,11,0.1)'   },
          { label: 'Escrituras', val: escrituras, sub: 'En proceso',         color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'   },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>{s.label}</div>
            <div className="text-[28px] font-bold leading-none tracking-tight" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[11px] mt-1.5 font-medium" style={{ color: s.color, opacity: 0.7 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: '#111' }}>Kanban de trabajo</h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#9C9890' }}>
            {ticketsFiltrados.length} tickets · Actualización en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Filtro área */}
          <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-medium border-none outline-none cursor-pointer"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#444', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <option value="todas">Todas las áreas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>

          {/* Filtro trámite */}
          <select value={filtroTramite} onChange={e => setFiltroTramite(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-medium border-none outline-none cursor-pointer"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#444', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <option value="todos">Todos los trámites</option>
            {tramites.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>

          {/* Filtro estatus observaciones */}
          <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-medium border-none outline-none cursor-pointer"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#444', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <option value="todos">Todos los estatus</option>
            <option value="demorado">🔴 Demorado</option>
            <option value="pendiente">🟠 Pendiente</option>
            <option value="no_pagado">🟣 No pagado</option>
            <option value="en_proceso">🟡 En proceso</option>
            <option value="ok">🟢 OK / Pagado</option>
            <option value="sin_obs">⚪ Sin observaciones</option>
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
          const colTickets = ticketsFiltrados.filter(t => (t as any).estado === col.id)
          return (
            <div key={col.id} className="flex-shrink-0 w-[200px]">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-t-2xl mb-0.5"
                style={{ background: 'rgba(255,255,255,0.7)' }}>
                <span className="text-[11.5px] font-bold" style={{ color: '#333' }}>{col.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: col.bg, color: col.color }}>
                  {colTickets.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 rounded-b-2xl rounded-tr-2xl min-h-[120px]"
                style={{ background: 'rgba(0,0,0,0.03)' }}>
                {colTickets.length === 0 && (
                  <div className="text-center py-6 text-[11px]" style={{ color: 'rgba(0,0,0,0.2)' }}>Sin tickets</div>
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
  const cancelado          = (ticket as any).estado === 'cancelado'
  const completado         = (ticket as any).estado === 'completado'
  const vencido            = !cancelado && isPast(new Date(ticket.sla_vence_at))
  const tramite            = (ticket as any).tramites_config
  const area               = (ticket as any).areas
  const partes             = ((ticket as any).partes as any[]) || []
  const observaciones      = ((ticket as any).observaciones as any[]) || []
  const primero            = partes.find((p: any) => p.nombre_completo)?.nombre_completo
  const slaLabel           = formatDistanceToNow(new Date(ticket.sla_vence_at), { locale: es, addSuffix: true })
  const estatusPrioritario = getEstatusPrioritario(observaciones)

  return (
    <a href={`/tickets/${ticket.id}`}
      className="block rounded-xl p-3 no-underline transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        background: '#fff',
        border:     '1px solid rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${tramite?.color_hex || '#ddd'}`,
        boxShadow:  '0 1px 3px rgba(0,0,0,0.04)',
      }}>

      {/* Overlay cancelado */}
      {cancelado && (
        <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(1px)' }}>
          <span className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>
            Cancelado
          </span>
        </div>
      )}

      {/* Overlay verde para completados */}
      {completado && (
        <div className="absolute inset-0 z-10 rounded-xl flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(16,90,40,0.6)', backdropFilter: 'blur(1px)' }}>
          <span className="text-[22px]">✅</span>
          <span className="text-[9px] font-black tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            Completado
          </span>
        </div>
      )}
      {/* Número + bolita estatus */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] font-bold tracking-wider" style={{ color: '#C0BAB2', fontFamily: 'monospace' }}>
          {ticket.numero}
        </div>
        {estatusPrioritario && !cancelado && (
          <div style={{
            width:        7,
            height:       7,
            borderRadius: '50%',
            background:   estatusPrioritario.dot,
            animation:    'pulse-dot 1.5s ease-in-out infinite',
            boxShadow:    `0 0 6px ${estatusPrioritario.dot}`,
            flexShrink:   0,
          }} />
        )}
      </div>

      <div className="text-[11.5px] font-semibold leading-snug mb-1" style={{ color: '#1A1917' }}>
        {tramite?.nombre || 'Trámite'}
      </div>
      {primero && (
        <div className="text-[10.5px] mb-2.5 truncate" style={{ color: '#AAA' }}>{primero}</div>
      )}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate"
          style={{ background: `${area?.color_hex}18`, color: area?.color_hex || '#666' }}>
          {area?.nombre || '—'}
        </span>
        {!cancelado && (
          <span className="text-[9.5px] font-medium flex-shrink-0" style={{ color: vencido ? '#E24B4A' : '#B0ADAA' }}>
            {vencido ? '⚠ ' : ''}{slaLabel}
          </span>
        )}
      </div>
    </a>
  )
}