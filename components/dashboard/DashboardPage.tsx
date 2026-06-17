'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, subDays, subWeeks, subMonths, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import KPICard          from './KPICard'
import ModalTicketsKPI  from './ModalTicketsKPI'
import GraficaEstados   from './GraficaEstados'
import GraficaAreas     from './GraficaAreas'
import GraficaActividad from './GraficaActividad'
import GraficaTramites  from './GraficaTramites'
import TablaUrgentes    from './TablaUrgentes'
import AIResumenDia     from './AIResumenDia'

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy',      getDesdeFecha: () => startOfDay(new Date()) },
  { id: '7d',     label: '7 días',   getDesdeFecha: () => subDays(new Date(), 7)  },
  { id: '30d',    label: '30 días',  getDesdeFecha: () => subDays(new Date(), 30) },
  { id: '3m',     label: '3 meses',  getDesdeFecha: () => subMonths(new Date(), 3)},
  { id: '6m',     label: '6 meses',  getDesdeFecha: () => subMonths(new Date(), 6)},
  { id: 'todo',   label: 'Todo',     getDesdeFecha: () => new Date('2020-01-01')  },
]

export default function DashboardPage() {
  const supabase = createClient()

  const [periodo,           setPeriodo]           = useState('30d')
  const [cargando,          setCargando]          = useState(true)
  const [modalKPI,          setModalKPI]          = useState<{ titulo: string, filtro: any } | null>(null)

  // Datos
  const [kpis,              setKpis]              = useState({ ticketsHoy: 0, ticketsNuevos: 0, ticketsAsignados: 0, ticketsFolioDBA: 0, ticketsEscritura: 0, ticketsUrgentes: 0 })
  const [ticketsPorArea,    setTicketsPorArea]    = useState<any[]>([])
  const [ticketsPorTramite, setTicketsPorTramite] = useState<any[]>([])
  const [actividadSemanal,  setActividadSemanal]  = useState<any[]>([])
  const [urgentesDetalle,   setUrgentesDetalle]   = useState<any[]>([])
  const [ultimosDocs,       setUltimosDocs]       = useState<any[]>([])

  useEffect(() => {
    cargarDatos()
  }, [periodo])

  async function cargarDatos() {
    setCargando(true)
    const periodoObj  = PERIODOS.find(p => p.id === periodo) || PERIODOS[1]
    const desdeFecha  = periodoObj.getDesdeFecha().toISOString()
    const hoy         = startOfDay(new Date()).toISOString()

    const [
      { count: ticketsHoy },
      { count: ticketsNuevos },
      { count: ticketsAsignados },
      { count: ticketsFolioDBA },
      { count: ticketsEscritura },
      { count: ticketsUrgentes },
      { data: porArea },
      { data: porTramite },
      { data: actividad },
      { data: urgentes },
      { data: docs },
    ] = await Promise.all([
      supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', hoy),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'nuevo').gte('created_at', desdeFecha),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'asignado').gte('created_at', desdeFecha),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'folio_dba').gte('created_at', desdeFecha),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'escritura_dba').gte('created_at', desdeFecha),
      supabase.from('tickets').select('*', { count: 'exact', head: true })
        .in('estado', ['nuevo', 'asignado', 'folio_dba'])
        .lte('sla_vence_at', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('tickets').select('areas(nombre), estado').in('estado', ['nuevo', 'asignado', 'folio_dba']).gte('created_at', desdeFecha),
      supabase.from('tickets').select('tramites_config(nombre), estado').in('estado', ['nuevo', 'asignado', 'folio_dba']).gte('created_at', desdeFecha),
      supabase.from('tickets').select('created_at').gte('created_at', desdeFecha).order('created_at'),
      supabase.from('tickets')
        .select('id, numero, estado, sla_vence_at, tramites_config(nombre, color_hex), areas(nombre), partes(nombre_completo, rol)')
        .in('estado', ['nuevo', 'asignado', 'folio_dba'])
        .lte('sla_vence_at', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())
        .order('sla_vence_at').limit(10),
      supabase.from('documentos')
        .select('id, estado, updated_at, doc_tipos_config(nombre), tickets(numero, tramites_config(nombre, color_hex))')
        .neq('estado', 'pendiente').gte('updated_at', desdeFecha)
        .order('updated_at', { ascending: false }).limit(8),
    ])

    setKpis({
      ticketsHoy:       ticketsHoy       || 0,
      ticketsNuevos:    ticketsNuevos    || 0,
      ticketsAsignados: ticketsAsignados || 0,
      ticketsFolioDBA:  ticketsFolioDBA  || 0,
      ticketsEscritura: ticketsEscritura || 0,
      ticketsUrgentes:  ticketsUrgentes  || 0,
    })
    setTicketsPorArea(porArea        || [])
    setTicketsPorTramite(porTramite  || [])
    setActividadSemanal(actividad    || [])
    setUrgentesDetalle(urgentes      || [])
    setUltimosDocs(docs              || [])
    setCargando(false)
  }

  // Procesar datos
  const estadosData = useMemo(() => {
    const map: Record<string, number> = { nuevo: 0, asignado: 0, folio_dba: 0, escritura_dba: 0 }
    ticketsPorArea.forEach((t: any) => { if (map[t.estado] !== undefined) map[t.estado]++ })
    return Object.entries(map).filter(([, v]) => v > 0).map(([estado, total]) => ({ estado, total }))
  }, [ticketsPorArea])

  const areasData = useMemo(() => {
    const map: Record<string, number> = {}
    ticketsPorArea.forEach((t: any) => {
      const nombre = t.areas?.nombre || 'Sin área'
      map[nombre] = (map[nombre] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([area, total]) => ({ area, total }))
  }, [ticketsPorArea])

  const tramitesData = useMemo(() => {
    const map: Record<string, number> = {}
    ticketsPorTramite.forEach((t: any) => {
      const nombre = t.tramites_config?.nombre || 'Sin trámite'
      map[nombre] = (map[nombre] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tramite, total]) => ({ tramite, total }))
  }, [ticketsPorTramite])

  const actividadData = useMemo(() => {
    const map: Record<string, number> = {}
    const dias = periodo === 'hoy' ? 1 : periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '3m' ? 90 : periodo === '6m' ? 180 : 30
    const diasMostrar = Math.min(dias, 30)
    for (let i = diasMostrar - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      map[format(d, 'd MMM', { locale: es })] = 0
    }
    actividadSemanal.forEach((t: any) => {
      const key = format(new Date(t.created_at), 'd MMM', { locale: es })
      if (map[key] !== undefined) map[key]++
    })
    return Object.entries(map).map(([fecha, total]) => ({ fecha, total }))
  }, [actividadSemanal, periodo])

  const KPIS = [
    { titulo: 'Nuevos hoy',    valor: kpis.ticketsHoy,       icono: '📥', color: '#185FA5', subtitulo: 'Tickets creados hoy',     filtro: { campo: 'hoy' as const } },
    { titulo: 'Sin asignar',   valor: kpis.ticketsNuevos,    icono: '🔴', color: '#E24B4A', subtitulo: 'Requieren atención',       filtro: { campo: 'estado', valor: 'nuevo' } },
    { titulo: 'Asignados',     valor: kpis.ticketsAsignados, icono: '🟡', color: '#854F0B', subtitulo: 'En proceso',               filtro: { campo: 'estado', valor: 'asignado' } },
    { titulo: 'Folio DBA',     valor: kpis.ticketsFolioDBA,  icono: '📋', color: '#854F0B', subtitulo: 'Esperando folio',          filtro: { campo: 'estado', valor: 'folio_dba' } },
    { titulo: 'Escritura DBA', valor: kpis.ticketsEscritura, icono: '✅', color: '#0F6E56', subtitulo: 'Listos para escritura',    filtro: { campo: 'estado', valor: 'escritura_dba' } },
    { titulo: 'SLA en riesgo', valor: kpis.ticketsUrgentes,  icono: '⚠️', color: '#E24B4A', subtitulo: 'Vencen en 3 días',        filtro: { campo: 'estado', valor: 'nuevo' } },
  ]

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header con filtro de periodo */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-black" style={{ color: '#111' }}>Dashboard</h1>
          <div className="text-[12px]" style={{ color: '#9C9890' }}>
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>

        {/* Selector de periodo */}
        <div className="flex items-center gap-1 p-1 rounded-2xl"
          style={{ background: '#F3F4F6' }}>
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => setPeriodo(p.id)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none transition-all"
              style={{
                background: periodo === p.id ? '#fff' : 'transparent',
                color:      periodo === p.id ? '#111' : '#9C9890',
                boxShadow:  periodo === p.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#111', borderTopColor: 'transparent' }} />
            <div className="text-[13px]" style={{ color: '#9C9890' }}>Cargando datos...</div>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {KPIS.map((k, i) => (
              <KPICard key={i} titulo={k.titulo} valor={k.valor} icono={k.icono}
                color={k.color} subtitulo={k.subtitulo}
                onClick={() => setModalKPI({ titulo: k.titulo, filtro: k.filtro })} />
            ))}
          </div>

          {/* AI Resumen */}
          <div className="mb-6">
            <AIResumenDia kpis={kpis} />
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GraficaEstados  ticketsPorEstado={estadosData} />
            <GraficaAreas    datos={areasData} />
            <GraficaTramites datos={tramitesData} />
          </div>

          <div className="mb-4">
            <GraficaActividad datos={actividadData} />
          </div>

          <div className="mb-4">
            <TablaUrgentes tickets={urgentesDetalle} />
          </div>

          {/* Últimos documentos */}
          {ultimosDocs.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden mb-6"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="text-[13px] font-bold" style={{ color: '#111' }}>Últimos documentos subidos</div>
                <div className="text-[11px]" style={{ color: '#9C9890' }}>Actividad reciente de clientes</div>
              </div>
              <div className="flex flex-col">
                {ultimosDocs.map((d: any, i: number) => (
                  <a key={d.id} href={`/tickets/${d.tickets?.id || ''}`}
                    className="flex items-center gap-3 px-5 py-3 no-underline transition-all"
                    style={{ borderBottom: i < ultimosDocs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F7F7F5'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] flex-shrink-0"
                      style={{ background: d.estado === 'validado' ? '#EAF3DE' : d.estado === 'rechazado' ? '#FEE2E2' : '#E6F1FB' }}>
                      {d.estado === 'validado' ? '✅' : d.estado === 'rechazado' ? '❌' : '📎'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: '#111' }}>
                        {d.doc_tipos_config?.nombre}
                      </div>
                      <div className="text-[11px]" style={{ color: '#9C9890' }}>
                        {d.tickets?.numero} · {d.tickets?.tramites_config?.nombre}
                      </div>
                    </div>
                    <div className="text-[10px] flex-shrink-0" style={{ color: '#9C9890' }}>
                      {format(new Date(d.updated_at), "d MMM HH:mm", { locale: es })}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal KPI */}
      {modalKPI && (
        <ModalTicketsKPI titulo={modalKPI.titulo} filtro={modalKPI.filtro}
          onClose={() => setModalKPI(null)} />
      )}
    </div>
  )
}