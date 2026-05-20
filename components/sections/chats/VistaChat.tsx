'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  conversacion:    any
  onMensajeEnviado: () => void
}

export default function VistaChat({ conversacion, onMensajeEnviado }: Props) {
  const supabase    = createClient()
  const [mensajes,  setMensajes]  = useState<any[]>([])
  const [texto,     setTexto]     = useState('')
  const [enviando,  setEnviando]  = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)

  // Cargar mensajes iniciales
  useEffect(() => {
    setMensajes([])
    supabase
      .from('mensajes_wa')
      .select('*')
      .eq('conversacion_id', conversacion.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMensajes(data)
      })
  }, [conversacion.id])

  // Realtime mensajes
  useEffect(() => {
    const channel = supabase
      .channel(`mensajes-${conversacion.id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'mensajes_wa',
        filter: `conversacion_id=eq.${conversacion.id}`,
      }, payload => {
        setMensajes(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversacion.id])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const msg = texto.trim()
    setTexto('')

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/twilio/enviar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          telefono:        conversacion.telefono,
          mensaje:         msg,
          conversacion_id: conversacion.id,
        }),
      })
      onMensajeEnviado()
    } catch (e) {
      console.error('Error enviando mensaje:', e)
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const area = conversacion.areas

  return (
    <div className="flex flex-col h-full">

      {/* Header del chat */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
          style={{ background: area?.color_hex || '#25D366' }}>
          {conversacion.nombre?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold" style={{ color: '#111' }}>
            {conversacion.nombre || conversacion.telefono}
          </div>
          <div className="text-[11px] font-mono" style={{ color: '#9C9890' }}>
            {conversacion.telefono}
            {area && (
              <span className="ml-2 px-1.5 py-0.5 rounded font-sans font-medium"
                style={{ background: `${area.color_hex}15`, color: area.color_hex }}>
                {area.nombre}
              </span>
            )}
          </div>
        </div>
        {conversacion.ticket_id && (
          <a href={`/tickets/${conversacion.ticket_id}`}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold no-underline transition-all"
            style={{ background: '#F3F4F6', color: '#666' }}>
            Ver ticket →
          </a>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {mensajes.length === 0 && (
          <div className="text-center py-8 text-[13px]" style={{ color: '#CCC' }}>
            Sin mensajes aún
          </div>
        )}
        {mensajes.map((m, i) => {
          const entrante = m.direccion === 'entrante'
          const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(mensajes[i-1].created_at).toDateString()

          return (
            <div key={m.id}>
              {showDate && (
                <div className="text-center text-[10px] my-2" style={{ color: '#9C9890' }}>
                  {format(new Date(m.created_at), "d 'de' MMMM", { locale: es })}
                </div>
              )}
              <div className={`flex ${entrante ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed"
                  style={{
                    background:        entrante ? '#fff' : '#DCF8C6',
                    color:             '#111',
                    borderRadius:      entrante ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                    boxShadow:         '0 1px 2px rgba(0,0,0,0.08)',
                    whiteSpace:        'pre-wrap',
                    wordBreak:         'break-word',
                  }}>
                  {m.contenido}
                  <div className="text-[9px] mt-1 text-right" style={{ color: '#9C9890' }}>
                    {format(new Date(m.created_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-2xl text-[13px] outline-none resize-none"
          style={{
            background: '#F7F7F5',
            border:     '1px solid rgba(0,0,0,0.08)',
            color:      '#111',
            maxHeight:  '120px',
          }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-none flex-shrink-0 transition-all"
          style={{
            background: texto.trim() ? '#25D366' : '#F3F4F6',
            color:      texto.trim() ? '#fff' : '#9CA3AF',
          }}>
          {enviando ? '...' : '➤'}
        </button>
      </div>
    </div>
  )
}