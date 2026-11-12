'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  format, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval,
  eachMonthOfInterval, addWeeks, subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import d from './dashboard.module.css'
import KPICard          from './KPICard'
import ModalTicketsKPI, { FiltroKPI } from './ModalTicketsKPI'
import GraficaEstados   from './GraficaEstados'
import GraficaAreas     from './GraficaAreas'
import GraficaActividad from './GraficaActividad'
import GraficaTramites  from './GraficaTramites'
import TablaUrgentes    from './TablaUrgentes'
import AIResumenDia     from './AIResumenDia'
import { ACTIVOS, Ic, PERIODOS, PeriodoId, rangoPeriodo, traerTodo } from './dashUtil'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

type Datos = {
  tickets:   { id: string; estado: string; created_at: string; area: string; tramite: string }[]
  anterior:  number | null
  enRiesgo:  number
  vencidos:  number
  urgentes:  any[]
  docs:      any[]
}

const VACIO: Datos = { tickets: [], anterior: null, enRiesgo: 0, vencidos: 0, urgentes: [], docs: [] }

/** Agrupa las fechas según el periodo: por hora, día, semana o mes. */
function serieActividad(fechas: Date[], periodo: PeriodoId, desde: Date | null) {
  const ahora = new Date()
  if (periodo === 'hoy') {
    const horas = Array.from({ length: ahora.getHours() + 1 }, (_, h) => ({ fecha: `${h}h`, detalle: `${h}:00 – ${h}:59`, total: 0 }))
    fechas.forEach(f => { if (horas[f.getHours()]) horas[f.getHours()].total++ })
    return horas
  }
  if (periodo === '7d' || periodo === '30d') {
    const dias = eachDayOfInterval({ start: desde!, end: ahora })
    const mapa = new Map(dias.map(x => [format(x, 'yyyy-MM-dd'), 0]))
    fechas.forEach(f => { const k = format(f, 'yyyy-MM-dd'); if (mapa.has(k)) mapa.set(k, mapa.get(k)! + 1) })
    return dias.map(x => ({
      fecha: format(x, periodo === '7d' ? 'EEE d' : 'd MMM', { locale: es }),
      detalle: format(x, "EEEE d 'de' MMMM", { locale: es }),
      total: mapa.get(format(x, 'yyyy-MM-dd')) || 0,
    }))
  }
  if (periodo === '3m' || periodo === '6m') {
    const semanas = eachWeekOfInterval({ start: desde!, end: ahora }, { weekStartsOn: 1 })
    const mapa = new Map(semanas.map(x => [x.getTime(), 0]))
    fechas.forEach(f => { const k = startOfWeek(f, { weekStartsOn: 1 }).getTime(); if (mapa.has(k)) mapa.set(k, mapa.get(k)! + 1) })
    return semanas.map(x => ({
      fecha: format(x, 'd MMM', { locale: es }),
      detalle: `Semana del ${format(x, "d 'de' MMM", { locale: es })} al ${format(addWeeks(x, 1).getTime() - 86400000, "d 'de' MMM", { locale: es })}`,
      total: mapa.get(x.getTime()) || 0,
    }))
  }
  const inicio = fechas.length ? startOfMonth(fechas.reduce((a, b) => (a < b ? a : b))) : startOfMonth(subMonths(ahora, 11))
  const meses = eachMonthOfInterval({ start: inicio, end: ahora })
  const mapa = new Map(meses.map(x => [format(x, 'yyyy-MM'), 0]))
  fechas.forEach(f => { const k = format(f, 'yyyy-MM'); if (mapa.has(k)) mapa.set(k, mapa.get(k)! + 1) })
  return meses.map(x => ({
    fecha: format(x, 'MMM yy', { locale: es }),
    detalle: format(x, "MMMM 'de' yyyy", { locale: es }),
    total: mapa.get(format(x, 'yyyy-MM')) || 0,
  }))
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const [periodo, setPeriodo] = useState<PeriodoId>('30d')
  const [datos, setDatos] = useState<Datos>(VACIO)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ titulo: string; descripcion: string; filtro: FiltroKPI } | null>(null)
  const solicitud = useRef(0)

  const rango = useMemo(() => rangoPeriodo(periodo), [periodo])
  const periodoTexto = PERIODOS.find(p => p.id === periodo)?.texto || ''

  // ─── Carga de datos (ignora respuestas viejas si cambias de periodo rápido) ───
  useEffect(() => {
    const id = ++solicitud.current
    setCargando(true)
    setError('')
    const { desde, anteriorDesde } = rangoPeriodo(periodo)
    const desdeISO = desde?.toISOString() || null
    const limiteRiesgo = new Date(Date.now() + 3 * 86400000).toISOString()

    async function cargar() {
      try {
        const [tickets, anterior, riesgo, vencidos, urgentes, docs] = await Promise.all([
          traerTodo<any>((a, b) => {
            let q = supabase.from('tickets').select('id, estado, created_at, areas(nombre), tramites_config(nombre)')
            if (desdeISO) q = q.gte('created_at', desdeISO)
            return q.order('created_at', { ascending: true }).range(a, b)
          }),
          anteriorDesde && desdeISO
            ? supabase.from('tickets').select('id', { count: 'exact', head: true }).gte('created_at', anteriorDesde.toISOString()).lt('created_at', desdeISO)
            : Promise.resolve({ count: null }),
          supabase.from('tickets').select('id', { count: 'exact', head: true }).in('estado', ACTIVOS).lte('sla_vence_at', limiteRiesgo),
          supabase.from('tickets').select('id', { count: 'exact', head: true }).in('estado', ACTIVOS).lt('sla_vence_at', new Date().toISOString()),
          supabase.from('tickets')
            .select('id, numero, estado, sla_vence_at, tramites_config(nombre), areas(nombre), partes(nombre_completo)')
            .in('estado', ACTIVOS).lte('sla_vence_at', limiteRiesgo)
            .order('sla_vence_at', { ascending: true }).limit(8),
          (() => {
            let q = supabase.from('documentos')
              .select('id, estado, updated_at, nombre_archivo, doc_tipos_config(nombre), tickets(id, numero, tramites_config(nombre))')
              .not('archivo_url', 'is', null)
            if (desdeISO) q = q.gte('updated_at', desdeISO)
            return q.order('updated_at', { ascending: false }).limit(8)
          })(),
        ])
        if (id !== solicitud.current) return
        setDatos({
          tickets: tickets.map((t: any) => ({
            id: t.id, estado: t.estado, created_at: t.created_at,
            area: t.areas?.nombre || 'Sin área', tramite: t.tramites_config?.nombre || 'Sin trámite',
          })),
          anterior: (anterior as any).count ?? null,
          enRiesgo: riesgo.count || 0,
          vencidos: vencidos.count || 0,
          urgentes: urgentes.data || [],
          docs: docs.data || [],
        })
      } catch (e: any) {
        if (id === solicitud.current) setError(e?.message || 'No se pudieron cargar los datos')
      } finally {
        if (id === solicitud.current) setCargando(false)
      }
    }
    cargar()
  }, [periodo])

  // ─── Cálculos ───
  const porEstado = useMemo(() => {
    const m: Record<string, number> = {}
    datos.tickets.forEach(t => { m[t.estado] = (m[t.estado] || 0) + 1 })
    return m
  }, [datos.tickets])

  const activos = useMemo(() => datos.tickets.filter(t => ACTIVOS.includes(t.estado)), [datos.tickets])
  const topAreas = useMemo(() => {
    const m: Record<string, number> = {}
    activos.forEach(t => { m[t.area] = (m[t.area] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([area, total]) => ({ area, total }))
  }, [activos])
  const topTramites = useMemo(() => {
    const m: Record<string, number> = {}
    activos.forEach(t => { m[t.tramite] = (m[t.tramite] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tramite, total]) => ({ tramite, total }))
  }, [activos])
  const actividad = useMemo(
    () => serieActividad(datos.tickets.map(t => new Date(t.created_at)), periodo, rango.desde),
    [datos.tickets, periodo, rango.desde],
  )

  // ─── Selector de periodo con indicador deslizante ───
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pastilla, setPastilla] = useState({ x: 0, w: 0 })
  useIsoLayoutEffect(() => {
    const medir = () => {
      const el = refs.current[periodo]
      if (el) setPastilla({ x: el.offsetLeft, w: el.offsetWidth })
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [periodo])

  const sufijo = periodo === 'todo' ? 'en todo el historial' : periodo === 'hoy' ? 'creados hoy' : `en ${periodoTexto.replace('los ', '')}`
  const KPIS: { titulo: string; valor: number; sub: string; filtro: FiltroKPI; alerta?: boolean; anterior?: number | null }[] = [
    { titulo: 'Ingresados',    valor: datos.tickets.length,      sub: periodoTexto === 'hoy' ? 'Expedientes de hoy' : `Expedientes ${sufijo}`, filtro: { tipo: 'periodo' }, anterior: datos.anterior },
    { titulo: 'Sin asignar',   valor: porEstado.nuevo || 0,         sub: 'En etapa Nuevo',      filtro: { tipo: 'estado', estado: 'nuevo' } },
    { titulo: 'Asignados',     valor: porEstado.asignado || 0,      sub: 'En proceso',          filtro: { tipo: 'estado', estado: 'asignado' } },
    { titulo: 'Folio DBA',     valor: porEstado.folio_dba || 0,     sub: 'Con folio asignado',  filtro: { tipo: 'estado', estado: 'folio_dba' } },
    { titulo: 'Escritura DBA', valor: porEstado.escritura_dba || 0, sub: 'En escritura',        filtro: { tipo: 'estado', estado: 'escritura_dba' } },
    { titulo: 'En riesgo',     valor: datos.enRiesgo,               sub: `${datos.vencidos} vencidos · todos los activos`, filtro: { tipo: 'riesgo' }, alerta: datos.enRiesgo > 0 },
  ]

  return (
    <div className={d.page}>
      {cargando && <div className={d.loadingBar}><i /></div>}

      <div className={d.head}>
        <div>
          <h1>Tablero de control</h1>
          <p>{(() => { const f = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }); return f.charAt(0).toUpperCase() + f.slice(1) })()}</p>
        </div>
        <div className={d.periods} role="tablist" aria-label="Periodo">
          <span className={d.periodPill} style={{ width: pastilla.w, transform: `translateX(${pastilla.x}px)` }} />
          {PERIODOS.map(p => (
            <button
              key={p.id}
              ref={el => { refs.current[p.id] = el }}
              type="button"
              role="tab"
              aria-selected={periodo === p.id}
              className={`${d.period} ${periodo === p.id ? d.periodOn : ''}`}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={d.card} style={{ padding: '12px 16px', marginBottom: 16, color: '#b42318', fontSize: '.84rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Ic n="alert" size={15} /> {error}
        </div>
      )}

      <div className={`${d.content} ${cargando ? d.contentBusy : ''}`} aria-busy={cargando}>
        <div className={d.kpis}>
          {KPIS.map(k => (
            <KPICard
              key={k.titulo}
              titulo={k.titulo}
              valor={k.valor}
              subtitulo={k.sub}
              alerta={k.alerta}
              anterior={k.anterior}
              onClick={() => setModal({
                titulo: k.titulo,
                descripcion: k.filtro.tipo === 'riesgo' ? 'Vencidos o que vencen en 3 días' : `Creados ${periodo === 'todo' ? 'en todo el historial' : `en ${periodoTexto}`}`,
                filtro: k.filtro,
              })}
            />
          ))}
        </div>

        <AIResumenDia datos={{
          periodoTexto, ingresados: datos.tickets.length, anterior: datos.anterior, porEstado,
          enRiesgo: datos.enRiesgo, vencidos: datos.vencidos, topAreas, topTramites,
        }} />

        <div style={{ marginBottom: 16 }}>
          <GraficaActividad datos={actividad} periodo={periodo} delay={d.d1} />
        </div>

        <div className={d.grid3}>
          <GraficaEstados ticketsPorEstado={Object.entries(porEstado).map(([estado, total]) => ({ estado, total }))} delay={d.d2} />
          <GraficaAreas datos={topAreas} delay={d.d3} />
          <GraficaTramites datos={topTramites} delay={d.d4} />
        </div>

        <div className={d.grid2}>
          <TablaUrgentes
            tickets={datos.urgentes}
            total={datos.enRiesgo}
            delay={d.d5}
            onVerTodos={() => setModal({ titulo: 'En riesgo', descripcion: 'Vencidos o que vencen en 3 días', filtro: { tipo: 'riesgo' } })}
          />

          <section className={`${d.card} ${d.d6}`}>
            <div className={`${d.cardHead} ${d.cardHeadLine}`}>
              <div>
                <h3>Documentos recientes</h3>
                <p>Últimos archivos recibidos {periodo === 'todo' ? '' : `en ${periodoTexto}`}</p>
              </div>
            </div>
            {datos.docs.length === 0 ? <div className={d.cardEmpty}>Sin documentos en este periodo.</div> : (
              <div className={d.rows}>
                {datos.docs.map((doc: any, i: number) => {
                  const ok = doc.estado === 'validado'
                  const malo = ['rechazado', 'revision_requerida', 'revisar'].includes(doc.estado)
                  return (
                    <a key={doc.id} href={doc.tickets?.id ? `/tickets/${doc.tickets.id}` : '#'} className={d.row} style={{ animationDelay: `${0.2 + i * 0.04}s` }}>
                      <span className={`${d.docIc} ${ok ? d.docIcOk : malo ? d.docIcBad : ''}`}>
                        <Ic n={ok ? 'check' : malo ? 'x' : 'doc'} size={14} sw={ok || malo ? 2.4 : 1.8} />
                      </span>
                      <div className={d.rowMain}>
                        <b>{doc.doc_tipos_config?.nombre || doc.nombre_archivo || 'Archivo sin clasificar'}</b>
                        <span>{doc.tickets?.numero} · {doc.tickets?.tramites_config?.nombre}</span>
                      </div>
                      <div className={d.rowSide}>
                        <span>{format(new Date(doc.updated_at), "d MMM, HH:mm", { locale: es })}</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {modal && (
        <ModalTicketsKPI
          titulo={modal.titulo}
          descripcion={modal.descripcion}
          filtro={modal.filtro}
          desde={rango.desde?.toISOString() || null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}