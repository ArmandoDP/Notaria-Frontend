'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  conversacion:     any
  onMensajeEnviado: () => void
  onCambiarEstatus: (estatus: string) => void
}

const ESTATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  atendido:  { label: 'Atendido',  color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  demorado:  { label: 'Demorado',  color: '#991B1B', bg: '#FEE2E2', dot: '#E24B4A' },
}

function formatFecha(date: Date): string {
  if (isToday(date))     return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, "d 'de' MMMM yyyy", { locale: es })
}

export default function VistaChat({ conversacion, onMensajeEnviado, onCambiarEstatus }: Props) {
  const supabase  = createClient()
  const [mensajes, setMensajes] = useState<any[]>([])
  const [texto,    setTexto]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const area    = conversacion.areas
  const estatus = conversacion.estatus || 'pendiente'
  const est     = ESTATUS_CONFIG[estatus as keyof typeof ESTATUS_CONFIG]

  useEffect(() => {
    setMensajes([])
    supabase.from('mensajes_wa').select('*')
      .eq('conversacion_id', conversacion.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMensajes(data) })
  }, [conversacion.id])

  useEffect(() => {
    const channel = supabase
      .channel(`mensajes-${conversacion.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes_wa',
        filter: `conversacion_id=eq.${conversacion.id}`,
      }, payload => { setMensajes(prev => [...prev, payload.new]) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversacion.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const msg = texto.trim()
    setTexto('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/twilio/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono:        conversacion.telefono,
          mensaje:         msg,
          conversacion_id: conversacion.id,
        }),
      })
      onMensajeEnviado()
    } catch (e) {
      console.error('Error enviando:', e)
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTexto(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  // Agrupar mensajes por fecha
  const grupos: { fecha: string, mensajes: any[] }[] = []
  mensajes.forEach(m => {
    const fecha = formatFecha(new Date(m.created_at))
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.fecha === fecha) {
      ultimo.mensajes.push(m)
    } else {
      grupos.push({ fecha, mensajes: [m] })
    }
  })

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#EBF0F7' }}>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-0">
        <div className="rounded-2xl overflow-hidden"
          style={{
            background:     'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            boxShadow:      '0 4px 24px rgba(0,0,0,0.08)',
            border:         '1px solid rgba(255,255,255,0.6)',
          }}>

          {/* Fila principal */}
          <div className="flex items-center gap-3 px-4 py-3">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
                style={{ background: area?.color_hex || '#25D366' }}>
                {conversacion.nombre?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ background: est.dot }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold truncate" style={{ color: '#111' }}>
                  {conversacion.nombre || conversacion.telefono}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                  style={{ background: est.bg, color: est.color }}>
                  {est.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono" style={{ color: '#9C9890' }}>
                  {conversacion.telefono}
                </span>
                {area && (
                  <>
                    <span style={{ color: '#D1D5DB', fontSize: 10 }}>·</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: area.color_hex }} />
                      <span className="text-[11px]" style={{ color: area.color_hex }}>{area.nombre}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {conversacion.ticket_id && (
                <a href={`/tickets/${conversacion.ticket_id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold no-underline transition-all"
                  style={{ background: '#F0F4FF', color: '#1B5FA5', border: '1px solid rgba(27,95,165,0.15)' }}>
                  📋 Ver ticket
                </a>
              )}
              <button onClick={() => setInfoOpen(!infoOpen)}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-none transition-all"
                style={{ background: infoOpen ? '#F0F4FF' : '#F7F7F5', color: '#666' }}>
                ℹ
              </button>
            </div>
          </div>

          {/* Fila de estatus */}
          <div className="flex items-center gap-1.5 px-4 pb-2.5">
            <span className="text-[10px] font-medium mr-1" style={{ color: '#9C9890' }}>Estado:</span>
            {Object.entries(ESTATUS_CONFIG).map(([key, cfg]) => {
              const activo = estatus === key
              return (
                <button key={key} onClick={() => onCambiarEstatus(key)}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-all"
                  style={{
                    background: activo ? cfg.bg : '#F3F4F6',
                    color:      activo ? cfg.color : '#9C9890',
                    border:     activo ? `1px solid ${cfg.dot}40` : '1px solid transparent',
                  }}>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Info panel — colapsable */}
      {infoOpen && (
        <div className="flex-shrink-0 px-4 py-3 flex gap-4 flex-wrap"
          style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { label: 'Teléfono',    value: conversacion.telefono },
            { label: 'Área',        value: area?.nombre || '—'   },
            { label: 'Estado',      value: est.label             },
            { label: 'Mensajes',    value: `${mensajes.length}`  },
          ].map(r => (
            <div key={r.label}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#9C9890' }}>{r.label}</div>
              <div className="text-[12px] font-semibold" style={{ color: '#111' }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto py-4" style={{ paddingLeft: '10%', paddingRight: '10%', paddingTop: infoOpen ? '200px' : '160px' }}>
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px]"
              style={{ background: 'rgba(255,255,255,0.8)' }}>💬</div>
            <div className="text-[13px] font-medium" style={{ color: '#9C9890' }}>Sin mensajes aún</div>
          </div>
        ) : (
          <>
            {grupos.map(grupo => (
              <div key={grupo.fecha}>
                {/* Separador de fecha */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                  <span className="px-3 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.8)', color: '#9C9890', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {grupo.fecha}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                </div>

                {/* Mensajes del grupo */}
                <div className="flex flex-col gap-1">
                  {grupo.mensajes.map((m, i) => {
                    const entrante = m.direccion === 'entrante'
                    const prevMsg  = grupo.mensajes[i - 1]
                    const mismoDir = prevMsg && prevMsg.direccion === m.direccion
                    const esUltimo = !grupo.mensajes[i + 1] || grupo.mensajes[i + 1].direccion !== m.direccion

                    return (
                      <div key={m.id}
                        className={`flex ${entrante ? 'justify-start' : 'justify-end'} ${mismoDir ? 'mt-0.5' : 'mt-2'}`}>
                        <div className="max-w-[72%]">
                          <div className="px-3.5 py-2 text-[13px] leading-relaxed relative"
                            style={{
                              background:   entrante ? '#fff' : '#D9F7BE',
                              color:        '#111',
                              borderRadius: entrante
                                ? (mismoDir ? '16px 16px 16px 4px' : esUltimo ? '4px 16px 16px 4px' : '4px 16px 16px 16px')
                                : (mismoDir ? '16px 16px 4px 16px' : esUltimo ? '16px 4px 4px 16px' : '16px 16px 16px 4px'),
                              boxShadow:    '0 1px 2px rgba(0,0,0,0.08)',
                              whiteSpace:   'pre-wrap',
                              wordBreak:    'break-word',
                            }}>
                            {m.contenido}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[9px]" style={{ color: entrante ? '#9C9890' : '#6B9E6B' }}>
                                {format(new Date(m.created_at), 'HH:mm')}
                              </span>
                              {!entrante && (
                                <span className="text-[9px]" style={{ color: '#6B9E6B' }}>✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input flotante */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 pt-2">
        <div className="flex items-end gap-2 px-3 py-2 rounded-2xl"
          style={{
            background:   'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            border:       '1px solid rgba(0,0,0,0.08)',
            boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
          }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 text-[13px] outline-none resize-none bg-transparent py-1.5 px-2"
            style={{ color: '#111', maxHeight: '120px', display: 'block' }}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border-none flex-shrink-0 transition-all mb-0.5"
            style={{
              background: texto.trim() && !enviando ? '#25D366' : 'rgba(0,0,0,0.06)',
              color:      texto.trim() && !enviando ? '#fff' : '#9CA3AF',
              boxShadow:  texto.trim() && !enviando ? '0 4px 12px rgba(37,211,102,0.3)' : 'none',
            }}>
            {enviando ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}