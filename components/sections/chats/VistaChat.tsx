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
  const [editando, setEditando] = useState(false)
  const [formNombre, setFormNombre] = useState('')
  const [formTel, setFormTel] = useState('')
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [errorContacto, setErrorContacto] = useState<string | null>(null)
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

  // ─── Editar contacto ───
  function abrirEdicion() {
    setFormNombre(conversacion.nombre && conversacion.nombre !== conversacion.telefono ? conversacion.nombre : '')
    setFormTel((conversacion.telefono || '').replace(/\D/g, '').slice(-10))
    setErrorContacto(null)
    setEditando(true)
  }

  async function guardarContacto() {
    const digitos = formTel.replace(/\D/g, '').slice(-10)
    if (digitos.length !== 10) { setErrorContacto('El teléfono debe tener 10 dígitos.'); return }
    const telefono = `+52${digitos}`
    setGuardandoContacto(true)
    setErrorContacto(null)
    if (telefono !== conversacion.telefono) {
      const { data: otra } = await supabase.from('conversaciones_wa').select('id, nombre')
        .eq('telefono', telefono).eq('area_id', conversacion.area_id).eq('activa', true).neq('id', conversacion.id).limit(1)
      if (otra && otra.length) {
        setGuardandoContacto(false)
        setErrorContacto(`Ese número ya tiene otra conversación en esta área (${otra[0].nombre || telefono}).`)
        return
      }
    }
    const { error } = await supabase.from('conversaciones_wa')
      .update({ nombre: formNombre.trim() || telefono, telefono })
      .eq('id', conversacion.id)
    setGuardandoContacto(false)
    if (error) { setErrorContacto(`No se pudo guardar: ${error.message}`); return }
    setEditando(false)
  }

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
          <b>
            {nombreCliente}
            <button type="button" className={s.editBtn} onClick={abrirEdicion} title="Editar contacto" aria-label="Editar contacto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            </button>
          </b>
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

      {editando && (
        <div className={s.overlay} onClick={() => !guardandoContacto && setEditando(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={s.modalHead}>
              <div>
                <b>Editar contacto</b>
                <span>Corrige el nombre o el número del cliente</span>
              </div>
              <button className={s.roundBtn} onClick={() => setEditando(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.field}>
                <label htmlFor="ed-nombre">Nombre</label>
                <input id="ed-nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Nombre del cliente" autoFocus />
              </div>
              <div className={s.field}>
                <label htmlFor="ed-tel">Teléfono (10 dígitos)</label>
                <input id="ed-tel" value={formTel} onChange={e => setFormTel(e.target.value)} inputMode="tel" placeholder="4611234567" />
              </div>
              {formTel.replace(/\D/g, '').slice(-10) !== (conversacion.telefono || '').replace(/\D/g, '').slice(-10) && (
                <div className={s.aviso}>
                  Al cambiar el número, los mensajes nuevos se mandarán al número corregido. El historial se queda en esta conversación.
                </div>
              )}
              {errorContacto && <div className={s.errorText}>{errorContacto}</div>}
            </div>
            <div className={s.modalFoot}>
              <button className={s.btnGhost} onClick={() => setEditando(false)} disabled={guardandoContacto}>Cancelar</button>
              <button className={s.btnGreen} onClick={guardarContacto} disabled={guardandoContacto}>
                {guardandoContacto ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Composer
        conversacion={conversacion}
        ventanaAbierta={ventana.estado !== 'closed'}
        respondiendo={respondiendo}
        onCancelarRespuesta={() => setRespondiendo(null)}
      />
    </>
  )
}