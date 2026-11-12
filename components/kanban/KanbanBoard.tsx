'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Area, TramiteConfig } from '@/types/database'
import { formatDistanceToNowStrict, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import k from './kanban.module.css'

const COLUMNAS = [
  { id: 'nuevo',         label: 'Nuevo',         color: '#534AB7', bg: 'rgba(83,74,183,0.12)'   },
  { id: 'asignado',      label: 'Asignado',      color: '#185FA5', bg: 'rgba(24,95,165,0.12)'   },
  { id: 'folio_dba',     label: 'Folio DBA',     color: '#854F0B', bg: 'rgba(133,79,11,0.12)'   },
  { id: 'escritura_dba', label: 'Escritura DBA', color: '#0F6E56', bg: 'rgba(15,110,86,0.12)'   },
  { id: 'cancelado',     label: 'Cancelado',     color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  { id: 'completado',    label: 'Completado',    color: '#3B6D11', bg: 'rgba(59,109,17,0.12)'   },
]
const FINALES = ['completado', 'cancelado']
const SIGUIENTE: Record<string, string> = {
  nuevo: 'asignado', asignado: 'folio_dba', folio_dba: 'escritura_dba', escritura_dba: 'completado',
}
const PALABRAS_MENORES = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'a', 'en', 'para', 'por', 'con']

function inicialesTramite(nombre?: string) {
  const palabras = (nombre || 'Trámite').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/)
    .filter(p => p && !PALABRAS_MENORES.includes(p.toLowerCase()))
  return ((palabras[0]?.[0] || 'T') + (palabras[1]?.[0] || '')).toUpperCase()
}

function inicialesPersona(nombre?: string) {
  const p = (nombre || '').trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'
}
const nombreColumna = (id: string) => COLUMNAS.find(c => c.id === id)?.label || id

const ESTATUS_OBS: Record<string, { tono: 'rojo' | 'negro' | 'gris'; label: string; prioridad: number }> = {
  demorado:   { tono: 'rojo',  label: 'Demorado',   prioridad: 1 },
  pendiente:  { tono: 'negro', label: 'Pendiente',  prioridad: 2 },
  no_pagado:  { tono: 'gris',  label: 'No pagado',  prioridad: 3 },
  en_proceso: { tono: 'gris',  label: 'En proceso', prioridad: 4 },
  ok:         { tono: 'gris',  label: 'OK',         prioridad: 5 },
  pagado:     { tono: 'gris',  label: 'Pagado',     prioridad: 5 },
}

const POR_PAGINA = 40

const SELECT_TICKET = '*, tramites_config(nombre, color_hex), areas(nombre, color_hex), partes(*), observaciones(estatus)'

function estatusPrioritario(observaciones: any[]) {
  if (!observaciones?.length) return null
  const clave = [...observaciones]
    .sort((a, b) => (ESTATUS_OBS[a.estatus]?.prioridad ?? 99) - (ESTATUS_OBS[b.estatus]?.prioridad ?? 99))[0]?.estatus
  return ESTATUS_OBS[clave] ? { clave, ...ESTATUS_OBS[clave] } : null
}

function estaVencido(t: any) {
  return !FINALES.includes(t.estado) && t.sla_vence_at && new Date(t.sla_vence_at).getTime() < Date.now()
}

// Cambios con animación (View Transitions en Chrome/Edge); en otros navegadores, cambio normal
function conTransicion(fn: () => void) {
  const doc = document as any
  const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reducir || document.hidden) { fn(); return }
  doc.startViewTransition(() => flushSync(fn))
}

function useContador(valor: number) {
  const [mostrado, setMostrado] = useState(valor)
  const anterior = useRef(0)
  useEffect(() => {
    const de = anterior.current
    anterior.current = valor
    const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducir || document.hidden || de === valor) { setMostrado(valor); return }
    const inicio = performance.now()
    const duracion = 700
    let raf = 0
    const paso = () => {
      const p = Math.min(1, Math.max(0, (performance.now() - inicio) / duracion))
      setMostrado(Math.round(de + (valor - de) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    // Seguro: pase lo que pase, termina mostrando el valor real
    const seguro = setTimeout(() => setMostrado(valor), duracion + 150)
    return () => { cancelAnimationFrame(raf); clearTimeout(seguro); setMostrado(valor) }
  }, [valor])
  return mostrado
}

type Especial = 'vencidos' | 'sin_folio' | null

interface Props {
  ticketsIniciales: Ticket[]
  areas: Area[]
  tramites: Pick<TramiteConfig, 'id' | 'nombre' | 'color_hex'>[]
}

export default function KanbanBoard({ ticketsIniciales, areas, tramites }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [tickets,       setTickets]       = useState<any[]>(ticketsIniciales as any[])
  const [filtroArea,    setFiltroArea]    = useState('todas')
  const [filtroTramite, setFiltroTramite] = useState('todos')
  const [filtroEstatus, setFiltroEstatus] = useState('todos')
  const [especial,      setEspecial]      = useState<Especial>(null)
  const [busqueda,      setBusqueda]      = useState('')
  const [recientes,     setRecientes]     = useState<string[]>([])
  const [limites,       setLimites]       = useState<Record<string, number>>({})
  const [, setTick] = useState(0)

  // Arrastrar y soltar
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sobre,       setSobre]       = useState<string | null>(null)
  const [guardando,   setGuardando]   = useState<string[]>([])
  const [confirmar,   setConfirmar]   = useState<{ ticket: any; destino: string } | null>(null)
  const [moverMenu,   setMoverMenu]   = useState<any | null>(null)
  const [etapaVisible, setEtapaVisible] = useState(COLUMNAS[0].id)
  const columnasRef = useRef<HTMLDivElement>(null)
  const refsCol = useRef<Record<string, HTMLElement | null>>({})
  const [aviso,       setAviso]       = useState<{ texto: string; error?: boolean } | null>(null)
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ticketsRef = useRef(tickets)
  useEffect(() => { ticketsRef.current = tickets }, [tickets])

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  function mostrarAviso(texto: string, error = false) {
    if (avisoTimer.current) clearTimeout(avisoTimer.current)
    setAviso({ texto, error })
    avisoTimer.current = setTimeout(() => setAviso(null), error ? 5000 : 3000)
  }

  function marcarReciente(id: string) {
    setRecientes(prev => [...prev, id])
    setTimeout(() => setRecientes(prev => prev.filter(x => x !== id)), 3500)
  }

  // Tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('kanban-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, async (payload: any) => {
        if (payload.eventType === 'DELETE') {
          conTransicion(() => setTickets(prev => prev.filter(t => t.id !== payload.old.id)))
          return
        }
        const { data } = await supabase.from('tickets').select(SELECT_TICKET).eq('id', payload.new.id).single()
        if (!data) return
        if (payload.eventType === 'INSERT') {
          conTransicion(() => setTickets(prev => (prev.some(t => t.id === data.id) ? prev : [data, ...prev])))
          marcarReciente(data.id)
        } else {
          const antes = ticketsRef.current.find(t => t.id === data.id)
          if (antes && antes.estado !== data.estado) {
            conTransicion(() => setTickets(prev => prev.map(t => (t.id === data.id ? data : t))))
            marcarReciente(data.id)
          } else {
            setTickets(prev => prev.map(t => (t.id === data.id ? data : t)))
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ─── Mover ticket ───
  function pedirMover(ticket: any, destino: string) {
    if (!ticket || ticket.estado === destino || guardando.includes(ticket.id)) return
    if (FINALES.includes(destino)) setConfirmar({ ticket, destino })
    else moverTicket(ticket, destino)
  }

  // Pestañas de etapas: saltar a una columna y saber cuál se está viendo
  function irAEtapa(id: string) {
    const el = refsCol.current[id]
    const cont = columnasRef.current
    if (el && cont) cont.scrollTo({ left: el.offsetLeft - cont.offsetLeft, behavior: 'smooth' })
    setEtapaVisible(id)
  }
  function alDesplazarColumnas() {
    const cont = columnasRef.current
    if (!cont) return
    let mejor = COLUMNAS[0].id
    let distancia = Infinity
    for (const c of COLUMNAS) {
      const el = refsCol.current[c.id]
      if (!el) continue
      const d = Math.abs(el.offsetLeft - cont.offsetLeft - cont.scrollLeft)
      if (d < distancia) { distancia = d; mejor = c.id }
    }
    if (mejor !== etapaVisible) setEtapaVisible(mejor)
  }

  function soltarEn(destino: string, id: string) {
    setSobre(null); setArrastrando(null)
    const ticket = ticketsRef.current.find(t => t.id === id)
    if (!ticket || ticket.estado === destino || guardando.includes(id)) return
    if (FINALES.includes(destino)) setConfirmar({ ticket, destino })
    else moverTicket(ticket, destino)
  }

  async function moverTicket(ticket: any, destino: string) {
    const previo = ticket.estado
    conTransicion(() => setTickets(prev => prev.map(t => (t.id === ticket.id ? { ...t, estado: destino } : t))))
    setGuardando(prev => [...prev, ticket.id])

    const { data, error } = await supabase
      .from('tickets')
      .update({ estado: destino })
      .eq('id', ticket.id)
      .select('id')

    setGuardando(prev => prev.filter(x => x !== ticket.id))

    if (error || !data?.length) {
      conTransicion(() => setTickets(prev => prev.map(t => (t.id === ticket.id ? { ...t, estado: previo } : t))))
      mostrarAviso(error ? `No se pudo mover ${ticket.numero}: ${error.message}` : `No tienes permiso para mover ${ticket.numero}`, true)
      return
    }
    mostrarAviso(`${ticket.numero} se movió a ${nombreColumna(destino)}`)
  }

  // ─── Filtros ───
  const q = busqueda.trim().toLowerCase()
  const filtrados = tickets.filter(t => {
    if (filtroArea !== 'todas' && t.area_id !== filtroArea) return false
    if (filtroTramite !== 'todos' && t.tramite_id !== filtroTramite) return false
    if (especial === 'vencidos' && !estaVencido(t)) return false
    if (especial === 'sin_folio' && (t.folio_dba || FINALES.includes(t.estado))) return false
    if (filtroEstatus !== 'todos') {
      const obs = t.observaciones || []
      if (filtroEstatus === 'sin_obs') { if (obs.length) return false }
      else if (estatusPrioritario(obs)?.prioridad !== ESTATUS_OBS[filtroEstatus]?.prioridad) return false
    }
    if (q) {
      const texto = [t.numero, t.folio_dba, t.tramites_config?.nombre, ...(t.partes || []).map((p: any) => p.nombre_completo)]
        .filter(Boolean).join(' ').toLowerCase()
      if (!texto.includes(q)) return false
    }
    return true
  })

  const hayFiltros = filtroArea !== 'todas' || filtroTramite !== 'todos' || filtroEstatus !== 'todos' || !!especial || !!q
  const cambiar = (fn: () => void) => conTransicion(() => { fn(); setLimites({}) })
  function limpiar() {
    conTransicion(() => {
      setFiltroArea('todas'); setFiltroTramite('todos'); setFiltroEstatus('todos'); setEspecial(null); setBusqueda('')
    })
  }

  // ─── Indicadores ───
  const activos    = tickets.filter(t => !FINALES.includes(t.estado)).length
  const vencidos   = tickets.filter(estaVencido).length
  const sinFolio   = tickets.filter(t => !t.folio_dba && !FINALES.includes(t.estado)).length
  const foliosDBA  = tickets.filter(t => t.estado === 'folio_dba').length
  const escrituras = tickets.filter(t => t.estado === 'escritura_dba').length

  const usarNombres = filtrados.length <= 300
  const ticketArrastrado = arrastrando ? tickets.find(t => t.id === arrastrando) : null

  return (
    <div className={k.board}>
      {/* Encabezado */}
      <div className={k.head}>
        <div className={k.title}>
          <h1>Tablero de solicitudes</h1>
          <p><span className={k.live} />{filtrados.length} tickets · en tiempo real<span className={k.hideSm}> · arrastra una tarjeta para cambiarla de etapa</span></p>
        </div>
        <div className={k.tools}>
          <label className={k.search}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar número, cliente o trámite" aria-label="Buscar" />
          </label>
          <select className={`${k.select} ${filtroArea !== 'todas' ? k.selectOn : ''}`} value={filtroArea}
            onChange={e => { const v = e.target.value; cambiar(() => setFiltroArea(v)) }} aria-label="Área">
            <option value="todas">Todas las áreas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select className={`${k.select} ${filtroTramite !== 'todos' ? k.selectOn : ''}`} value={filtroTramite}
            onChange={e => { const v = e.target.value; cambiar(() => setFiltroTramite(v)) }} aria-label="Trámite">
            <option value="todos">Todos los trámites</option>
            {tramites.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <select className={`${k.select} ${filtroEstatus !== 'todos' ? k.selectOn : ''}`} value={filtroEstatus}
            onChange={e => { const v = e.target.value; cambiar(() => setFiltroEstatus(v)) }} aria-label="Estatus">
            <option value="todos">Todos los estatus</option>
            <option value="demorado">Demorado</option>
            <option value="pendiente">Pendiente</option>
            <option value="no_pagado">No pagado</option>
            <option value="en_proceso">En proceso</option>
            <option value="ok">OK / Pagado</option>
            <option value="sin_obs">Sin observaciones</option>
          </select>
          {hayFiltros && <button className={k.clear} onClick={limpiar}>Limpiar filtros</button>}
        </div>
        <a href="/nueva" className={k.newBtn} title="Nueva solicitud">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          <span>Nueva solicitud</span>
        </a>
      </div>

      {/* Indicadores */}
      <div className={k.kpis}>
        <Kpi label="Activos" valor={activos} sub="En proceso" delay={0} onClick={limpiar} />
        <Kpi label="Vencidos" valor={vencidos} sub={vencidos ? 'Requieren atención' : 'Todo en tiempo'} alerta={vencidos > 0} delay={40}
          activo={especial === 'vencidos'} onClick={() => cambiar(() => setEspecial(especial === 'vencidos' ? null : 'vencidos'))} />
        <Kpi label="Sin folio" valor={sinFolio} sub="Sin folio asignado" delay={80}
          activo={especial === 'sin_folio'} onClick={() => cambiar(() => setEspecial(especial === 'sin_folio' ? null : 'sin_folio'))} />
        <Kpi label="Folios DBA" valor={foliosDBA} sub="En proceso" delay={120} />
        <Kpi label="Escrituras" valor={escrituras} sub="En proceso" delay={160} />
      </div>

      {/* Pestañas de etapas (pantallas medianas y chicas) */}
      <div className={k.stageTabs} role="tablist" aria-label="Etapas">
        {COLUMNAS.map(col => (
          <button
            key={col.id}
            role="tab"
            aria-selected={etapaVisible === col.id}
            className={`${k.stageTab} ${etapaVisible === col.id ? k.stageTabOn : ''}`}
            onClick={() => irAEtapa(col.id)}
          >
            {col.label}
            <b>{filtrados.filter(t => t.estado === col.id).length}</b>
          </button>
        ))}
      </div>

      {/* Columnas */}
      <div className={k.columns} ref={columnasRef} onScroll={alDesplazarColumnas}>
        {COLUMNAS.map((col, ci) => {
          const delCol = filtrados.filter(t => t.estado === col.id)
          const vencCol = delCol.filter(estaVencido).length
          const final = FINALES.includes(col.id)
          const paso = ['nuevo', 'asignado', 'folio_dba', 'escritura_dba'].indexOf(col.id) + 1
          const esDestino = !!ticketArrastrado && ticketArrastrado.estado !== col.id
          const encima = sobre === col.id && esDestino
          const limite = limites[col.id] || POR_PAGINA
          return (
            <section
              key={col.id}
              ref={el => { refsCol.current[col.id] = el }}
              className={`${k.col} ${encima ? k.colDrop : ''}`}
              style={{ animationDelay: `${ci * 50}ms`, ['--col' as any]: col.color }}
              onDragOver={e => {
                if (!esDestino) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (sobre !== col.id) setSobre(col.id)
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobre(x => (x === col.id ? null : x))
              }}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain')
                if (id) soltarEn(col.id, id)
              }}
            >
              <header className={k.stage}>
                <span className={`${k.stageNum} ${final ? k.stageFinal : ''}`}>
                  {paso > 0 ? paso : col.id === 'completado' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  )}
                </span>
                <div className={k.stageText}>
                  <b>{col.label}</b>
                  <small>
                    {final ? (col.id === 'completado' ? 'Trámites terminados' : 'No continuaron')
                      : vencCol ? <><em>{vencCol} vencido{vencCol !== 1 ? 's' : ''}</em> · {delCol.length - vencCol} en tiempo</> : 'Todo en tiempo'}
                  </small>
                </div>
                <span className={k.stageCount}>{delCol.length}</span>
                {paso > 0 && paso < 4 && (
                  <span className={k.arrow} aria-hidden>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </span>
                )}
              </header>

              {encima && <div className={k.dropHint}>Soltar para mover a {col.label}</div>}

              <div className={k.colBody}>
                {delCol.length === 0 && !encima && <div className={k.colEmpty}>Sin tickets en esta etapa</div>}
                {delCol.slice(0, limite).map((t, i) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    indice={i}
                    nuevo={recientes.includes(t.id)}
                    nombreTransicion={usarNombres && arrastrando !== t.id}
                    arrastrando={arrastrando === t.id}
                    guardando={guardando.includes(t.id)}
                    onDragStart={id => requestAnimationFrame(() => setArrastrando(id))}
                    onDragEnd={() => { setArrastrando(null); setSobre(null) }}
                    onSiguiente={SIGUIENTE[t.estado] ? () => pedirMover(t, SIGUIENTE[t.estado]) : undefined}
                    onMover={() => setMoverMenu(t)}
                  />
                ))}
                {delCol.length > limite && (
                  <button
                    className={k.more}
                    onClick={() => setLimites(l => ({ ...l, [col.id]: limite + POR_PAGINA }))}
                  >
                    Ver {Math.min(POR_PAGINA, delCol.length - limite)} más · quedan {delCol.length - limite}
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Confirmación para Cancelado / Completado */}
      {confirmar && (
        <div className={k.overlay} onClick={() => setConfirmar(null)}>
          <div className={k.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={k.modalBody}>
              <div className={k.modalIc} style={{
                background: confirmar.destino === 'cancelado' ? '#fdf1f0' : '#f1f1ef',
                color: confirmar.destino === 'cancelado' ? '#b42318' : '#111',
              }}>
                {confirmar.destino === 'cancelado' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                )}
              </div>
              <b>{confirmar.destino === 'cancelado' ? '¿Cancelar este trámite?' : '¿Marcar como completado?'}</b>
              <p>
                {confirmar.ticket.numero} · {confirmar.ticket.tramites_config?.nombre || 'Trámite'}
                {(confirmar.ticket.partes || []).find((p: any) => p.nombre_completo)?.nombre_completo
                  ? ` de ${(confirmar.ticket.partes || []).find((p: any) => p.nombre_completo).nombre_completo}` : ''}
                {' '}pasará a <strong>{nombreColumna(confirmar.destino)}</strong>.
              </p>
            </div>
            <div className={k.modalFoot}>
              <button className={k.btnGhost} onClick={() => setConfirmar(null)}>No, dejarlo</button>
              <button
                autoFocus
                style={{ background: confirmar.destino === 'cancelado' ? '#b42318' : '#111', color: '#fff' }}
                onClick={() => { const c = confirmar; setConfirmar(null); moverTicket(c.ticket, c.destino) }}
              >
                {confirmar.destino === 'cancelado' ? 'Sí, cancelar' : 'Sí, completar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {moverMenu && (
        <div className={k.overlay} onClick={() => setMoverMenu(null)}>
          <div className={k.sheet} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Mover {moverMenu.numero}</h3>
            <p>{moverMenu.tramites_config?.nombre || 'Trámite'} · ahora en {nombreColumna(moverMenu.estado)}</p>
            {COLUMNAS.filter(c => c.id !== moverMenu.estado).map(c => {
              const n = ['nuevo', 'asignado', 'folio_dba', 'escritura_dba'].indexOf(c.id) + 1
              return (
                <button key={c.id} className={k.sheetItem} onClick={() => { const t = moverMenu; setMoverMenu(null); pedirMover(t, c.id) }}>
                  <span>{n > 0 ? n : c.id === 'completado' ? '✓' : '✕'}</span>
                  {c.label}
                  <small>{filtrados.filter(t => t.estado === c.id).length} tickets</small>
                </button>
              )
            })}
            <button className={k.sheetCancel} onClick={() => setMoverMenu(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {aviso && (
        <div className={`${k.toast} ${aviso.error ? k.toastError : ''}`} role="status">
          {aviso.error ? '⚠' : '✓'} {aviso.texto}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, valor, sub, alerta, delay, activo, onClick }: {
  label: string; valor: number; sub: string; alerta?: boolean; delay: number; activo?: boolean; onClick?: () => void
}) {
  const n = useContador(valor)
  const contenido = (<><small>{label}</small><strong>{n}</strong><span>{sub}</span></>)
  const clases = [k.kpi, alerta ? k.kpiAlert : '', activo ? k.kpiOn : ''].join(' ')
  const style = { animationDelay: `${delay}ms` }
  if (!onClick) return <div className={clases} style={style}>{contenido}</div>
  return <button className={clases} style={style} onClick={onClick} aria-pressed={!!activo}>{contenido}</button>
}

function TicketCard({ ticket, indice, nuevo, nombreTransicion, arrastrando, guardando, onDragStart, onDragEnd, onSiguiente, onMover }: {
  ticket: any
  indice: number
  nuevo: boolean
  nombreTransicion: boolean
  arrastrando: boolean
  guardando: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onSiguiente?: () => void
  onMover: () => void
}) {
  const cancelado  = ticket.estado === 'cancelado'
  const completado = ticket.estado === 'completado'
  const final      = cancelado || completado
  const tramite    = ticket.tramites_config
  const area       = ticket.areas
  const cliente    = (ticket.partes || []).find((p: any) => p.nombre_completo)?.nombre_completo as string | undefined
  const obs        = estatusPrioritario(ticket.observaciones || [])

  // Tiempo del plazo (SLA)
  const vence   = ticket.sla_vence_at ? new Date(ticket.sla_vence_at) : null
  const creado  = ticket.created_at ? new Date(ticket.created_at) : null
  const vencido = !final && !!vence && vence.getTime() < Date.now()
  const pronto  = !final && !vencido && !!vence && differenceInHours(vence, new Date()) < 24
  const textoSla = vence ? formatDistanceToNowStrict(vence, { locale: es }) : ''
  let avance = vencido ? 1 : 0
  if (!vencido && vence && creado && vence > creado) {
    avance = Math.min(1, Math.max(0.03, (Date.now() - creado.getTime()) / (vence.getTime() - creado.getTime())))
  }
  const colorBarra = vencido ? '#b42318' : pronto || avance > 0.75 ? '#111111' : '#a3a3a3'
  const siguiente = onSiguiente ? COLUMNAS.find(c => c.id === SIGUIENTE[ticket.estado]) : null

  const clases = [
    k.card,
    vencido ? k.late : '',
    completado ? k.done : '',
    cancelado ? k.cancel : '',
    nuevo ? k.fresh : '',
    arrastrando ? k.dragging : '',
    guardando ? k.saving : '',
  ].join(' ')

  return (
    <a
      href={`/tickets/${ticket.id}`}
      className={clases}
      draggable={!guardando}
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', ticket.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(ticket.id)
      }}
      onDragEnd={onDragEnd}
      style={{
        animationDelay: `${Math.min(indice, 10) * 35}ms`,
        viewTransitionName: nombreTransicion ? `tk-${ticket.id}` : undefined,
      } as React.CSSProperties}
    >
      {!guardando && (
        <button className={k.moveBtn} onClick={e => { e.preventDefault(); e.stopPropagation(); onMover() }}>
          Mover
        </button>
      )}

      {siguiente && !guardando && (
        <button
          className={k.next}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onSiguiente?.() }}
          title={`Mover a ${siguiente.label}`}
          aria-label={`Mover a ${siguiente.label}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      )}

      <div className={k.cHead}>
        <span className={k.tile}>{inicialesTramite(tramite?.nombre)}</span>
        <div className={k.cTitle}>
          <div className={k.tramite}>{tramite?.nombre || 'Trámite'}</div>
          <span className={k.num}>{ticket.numero}{ticket.folio_dba ? ` · Folio ${ticket.folio_dba}` : ''}</span>
        </div>
      </div>

      {cliente && (
        <div className={k.client}>
          <span className={k.avatar}>{inicialesPersona(cliente)}</span>
          <span>{cliente.toLowerCase()}</span>
        </div>
      )}

      <div className={k.chips}>
        <span className={k.chip}>{area?.nombre || 'Sin área'}</span>
        {!final && obs && (
          <span
            className={[k.chip, obs.tono === 'rojo' ? `${k.chipRed} ${k.urgent}` : obs.tono === 'negro' ? k.chipDark : ''].join(' ')}
            title="Observaciones"
          >
            <i />{obs.label}
          </span>
        )}
      </div>

      {final ? (
        <span className={k.finalTag}>{completado ? '✓ Completado' : 'Cancelado'}</span>
      ) : vence && (
        <div className={`${k.time} ${vencido ? k.timeLate : pronto ? k.timeSoon : ''}`} title={`Vence: ${vence.toLocaleString('es-MX')}`}>
          <div className={k.timeRow}>
            <span>{vencido ? `Vencido hace ${textoSla}` : `Vence en ${textoSla}`}</span>
            <span>{vence.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div className={k.track}><i style={{ width: `${Math.round(avance * 100)}%`, background: colorBarra }} /></div>
        </div>
      )}
    </a>
  )
}