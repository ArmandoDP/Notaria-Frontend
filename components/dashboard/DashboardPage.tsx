'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import KPICard         from './KPICard'
import ModalTicketsKPI from './ModalTicketsKPI'
import GraficaEstados  from './GraficaEstados'
import GraficaAreas    from './GraficaAreas'
import GraficaActividad from './GraficaActividad'
import GraficaTramites from './GraficaTramites'
import TablaUrgentes   from './TablaUrgentes'
import AIResumenDia    from './AIResumenDia'

interface Props {
  kpis:              any
  ticketsPorArea:    any[]
  ticketsPorTramite: any[]
  actividadSemanal:  any[]
  urgentesDetalle:   any[]
  ultimosDocs:       any[]
}

export default function DashboardPage({
  kpis, ticketsPorArea, ticketsPorTramite,
  actividadSemanal, urgentesDetalle, ultimosDocs,
}: Props) {
  const [modalKPI, setModalKPI] = useState<{ titulo: string, filtro: any } | null>(null)

  // Procesar datos para gráficas
  const estadosData = useMemo(() => {
    const map: Record<string, number> = {}
    const estados = ['nuevo', 'asignado', 'folio_dba', 'escritura_dba']
    estados.forEach(e => { map[e] = 0 })
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

  const actividadData = useMemo(() => {
    const map: Record<string, number> = {}
    // Inicializar últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = format(d, 'd MMM', { locale: es })
      map[key] = 0
    }
    actividadSemanal.forEach((t: any) => {
      const key = format(new Date(t.created_at), 'd MMM', { locale: es })
      if (map[key] !== undefined) map[key]++
    })
    return Object.entries(map).map(([fecha, total]) => ({ fecha, total }))
  }, [actividadSemanal])

  const KPIS = [
    {
      titulo:    'Nuevos hoy',
      valor:     kpis.ticketsHoy,
      icono:     '📥',
      color:     '#185FA5',
      subtitulo: 'Tickets creados hoy',
      filtro:    { campo: 'hoy' as const },
    },
    {
      titulo:    'Sin asignar',
      valor:     kpis.ticketsNuevos,
      icono:     '🔴',
      color:     '#E24B4A',
      subtitulo: 'Requieren atención',
      filtro:    { campo: 'estado', valor: 'nuevo' },
    },
    {
      titulo:    'Asignados',
      valor:     kpis.ticketsAsignados,
      icono:     '🟡',
      color:     '#854F0B',
      subtitulo: 'En proceso',
      filtro:    { campo: 'estado', valor: 'asignado' },
    },
    {
      titulo:    'Folio DBA',
      valor:     kpis.ticketsFolioDBA,
      icono:     '📋',
      color:     '#854F0B',
      subtitulo: 'Esperando folio',
      filtro:    { campo: 'estado', valor: 'folio_dba' },
    },
    {
      titulo:    'Escritura DBA',
      valor:     kpis.ticketsEscritura,
      icono:     '✅',
      color:     '#0F6E56',
      subtitulo: 'Listos para escritura',
      filtro:    { campo: 'estado', valor: 'escritura_dba' },
    },
    {
      titulo:    'SLA en riesgo',
      valor:     kpis.ticketsUrgentes,
      icono:     '⚠️',
      color:     '#E24B4A',
      subtitulo: 'Vencen en 3 días',
      filtro:    { campo: 'estado', valor: 'nuevo' }, // se filtra por fecha en modal
    },
  ]

  const tramitesData = useMemo(() => {
  const map: Record<string, number> = {}
  ticketsPorTramite.forEach((t: any) => {
    const nombre = t.tramites_config?.nombre || 'Sin trámite'
    map[nombre] = (map[nombre] || 0) + 1
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tramite, total]) => ({ tramite, total }))
  }, [ticketsPorTramite])
    
  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-black" style={{ color: '#111' }}>Dashboard</h1>
          <div className="text-[12px]" style={{ color: '#9C9890' }}>
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {KPIS.map((k, i) => (
          <KPICard
            key={i}
            titulo={k.titulo}
            valor={k.valor}
            icono={k.icono}
            color={k.color}
            subtitulo={k.subtitulo}
            onClick={() => setModalKPI({ titulo: k.titulo, filtro: k.filtro })}
          />
        ))}
      </div>

      {/* AI Resumen */}
      <div className="mb-6">
        <AIResumenDia kpis={kpis} />
      </div>

      {/* Gráficas fila 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <GraficaEstados ticketsPorEstado={estadosData} />
        <GraficaAreas datos={areasData} />
        <GraficaTramites datos={tramitesData} />
      </div>

      {/* Actividad */}
      <div className="mb-4">
        <GraficaActividad datos={actividadData} />
      </div>

      {/* Tabla urgentes */}
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
                style={{
                  borderBottom: i < ultimosDocs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  background: 'transparent',
                }}
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

      {/* Modal KPI */}
      {modalKPI && (
        <ModalTicketsKPI
          titulo={modalKPI.titulo}
          filtro={modalKPI.filtro}
          onClose={() => setModalKPI(null)}
        />
      )}
    </div>
  )
}