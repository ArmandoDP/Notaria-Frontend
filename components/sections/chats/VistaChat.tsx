'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import s from './wa.module.css'
import BurbujaMensaje from './BurbujaMensaje'
import Composer from './Composer'
import { calcularVentana, etiquetaDia, iniciales, apiPost, ESTATUS_CONFIG } from './waUtils'

interface Props {
  conversacion: any
  onMensajeEnviado?: () => void
  onCambiarEstatus: (estatus: string) => void
}

export default function VistaChat({ conversacion, onCambiarEstatus }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [mensajes, setMensajes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [respondiendo, setRespondiendo] = useState<any | null>(null)
  const [ahora, setAhora] = useState(Date.now())
  const threadRef = useRef<HTMLDivElement>(null)
  const pegadoAbajo = useRef(true)

  const area = conversacion.areas
  const estatus = conversacion.estatus || 'pendiente'
  const nombreCliente = conversacion.nombre || conversacion.telefono

  // Cargar mensajes
  useEffect(() => {
    let vivo = true
    setMensajes([]); setCargando(true); setRespondiendo(null); pegadoAbajo.current = true
    supabase.from('mensajes_wa').select('*')
      .eq('conversacion_id', conversacion.id)
      .order('created_at', { ascending: true })
      .then(({ data }: any) => {
        if (!vivo) return
        setMensajes(data || [])
        setCargando(false)
      })
    return () => { vivo = false }
  }, [conversacion.id])

  // Tiempo real: mensajes nuevos y cambios de palomitas
  useEffect(() => {
    const filtro = `conversacion_id=eq.${conversacion.id}`
    const channel = supabase
      .channel(`mensajes-${conversacion.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_wa', filter: filtro },
        (payload: any) => setMensajes(prev => (prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes_wa', filter: filtro },
        (payload: any) => setMensajes(prev => prev.map(m => (m.id === payload.new.id ? { ...m, ...payload.new } : m))))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversacion.id])

  // Marcar como leído al abrir y cuando llegan mensajes nuevos del cliente
  const entrantes = mensajes.filter(m => m.direccion === 'entrante').length
  useEffect(() => {
    if (cargando) return
    const t = setTimeout(() => {
      apiPost('/api/meta/marcar-leido', { conversacion_id: conversacion.id }).catch(() => {})
    }, 600)
    return () => clearTimeout(t)
  }, [conversacion.id, entrantes, cargando])

  // Reloj para la ventana de 24 h
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Scroll al fondo si el usuario ya estaba abajo
  useEffect(() => {
    const el = threadRef.current
    if (el && pegadoAbajo.current) el.scrollTop = el.scrollHeight
  }, [mensajes])

  const ultimoEntrante = useMemo(() => {
    const ultimoMsg = [...mensajes].reverse().find(m => m.direccion === 'entrante')?.created_at
    const candidatos = [ultimoMsg, conversacion.ultimo_entrante_at].filter(Boolean) as string[]
    return candidatos.sort().pop() || null
  }, [mensajes, conversacion.ultimo_entrante_at])

  const ventana = calcularVentana(ultimoEntrante, ahora)
  const porWamid = useMemo(() => {
    const mapa = new Map<string, any>()
    mensajes.forEach(m => m.wa_message_id && mapa.set(m.wa_message_id, m))
    return mapa
  }, [mensajes])

  const filas: ({ dia: string } | { m: any })[] = []
  let diaActual = ''
  mensajes.forEach(m => {
    const dia = etiquetaDia(m.created_at)
    if (dia !== diaActual) { filas.push({ dia }); diaActual = dia }
    filas.push({ m })
  })

  return (
    <>
      <header className={s.convHead}>
        <div className={s.avatar} style={{ background: area?.color_hex || '#5b6ec9', width: 42, height: 42, fontSize: '0.9rem' }}>
          {iniciales(conversacion.nombre)}
        </div>
        <div className={s.who}>
          <b>{nombreCliente}</b>
          <span>{conversacion.telefono}{area ? ` · ${area.nombre}` : ''}</span>
        </div>

        <span className={`${s.windowChip} ${ventana.estado === 'closing' ? s.closing : ventana.estado === 'closed' ? s.closed : ''}`}>
          {ventana.texto}
        </span>

        <select
          className={s.estSelect}
          value={estatus}
          onChange={e => onCambiarEstatus(e.target.value)}
          style={{ background: (ESTATUS_CONFIG[estatus] || ESTATUS_CONFIG.pendiente).bg, color: (ESTATUS_CONFIG[estatus] || ESTATUS_CONFIG.pendiente).color }}
          aria-label="Estado de la conversación"
        >
          {Object.entries(ESTATUS_CONFIG).map(([clave, cfg]) => <option key={clave} value={clave}>{cfg.label}</option>)}
        </select>

        {conversacion.ticket_id && (
          <a className={s.ticketLink} href={`/tickets/${conversacion.ticket_id}`} title="Ver ticket">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" /></svg>
          </a>
        )}
      </header>

      <div
        className={s.thread}
        ref={threadRef}
        onScroll={e => {
          const el = e.currentTarget
          pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
      >
        {cargando && <div className={s.day}>Cargando mensajes…</div>}
        {!cargando && !mensajes.length && <div className={s.sys}>Todavía no hay mensajes en esta conversación</div>}

        {filas.map((f, i) =>
          'dia' in f ? (
            <div key={`d-${i}`} className={s.day}>{f.dia}</div>
          ) : (
            <BurbujaMensaje
              key={f.m.id}
              m={f.m}
              citado={f.m.responde_a ? porWamid.get(f.m.responde_a) : undefined}
              nombreCliente={nombreCliente}
              onResponder={setRespondiendo}
            />
          )
        )}

        {!cargando && ventana.estado === 'closed' && mensajes.length > 0 && (
          <div className={s.sys}>La ventana de 24 h está cerrada · solo se pueden enviar plantillas aprobadas</div>
        )}
      </div>

      <Composer
        conversacion={conversacion}
        ventanaAbierta={ventana.estado !== 'closed'}
        respondiendo={respondiendo}
        onCancelarRespuesta={() => setRespondiendo(null)}
      />
    </>
  )
}