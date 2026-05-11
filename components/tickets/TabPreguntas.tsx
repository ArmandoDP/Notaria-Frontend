'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Pregunta {
  id?:        string
  pregunta:   string
  respuesta:  string
  orden:      number
}

interface Props {
  ticketId:  string
  preguntas: Pregunta[]
  readOnly?: boolean
}

export default function TabPreguntas({ ticketId, preguntas: inicial, readOnly = false }: Props) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(inicial)
  const [guardando, setGuardando] = useState<number | null>(null)
  const [guardado,  setGuardado]  = useState<number | null>(null)
  const supabase = createClient()

  async function guardarRespuesta(i: number, respuesta: string) {
    setGuardando(i)
    const p = preguntas[i]

    if (p.id) {
      await supabase.from('ticket_preguntas')
        .update({ respuesta, updated_at: new Date().toISOString() })
        .eq('id', p.id)
    } else {
      const { data } = await supabase.from('ticket_preguntas')
        .insert({
          ticket_id: ticketId,
          pregunta:  p.pregunta,
          respuesta,
          orden:     p.orden,
        })
        .select()
        .single()
      if (data) {
        const n = [...preguntas]
        n[i] = { ...n[i], id: data.id }
        setPreguntas(n)
      }
    }

    const n = [...preguntas]
    n[i] = { ...n[i], respuesta }
    setPreguntas(n)
    setGuardando(null)
    setGuardado(i)
    setTimeout(() => setGuardado(null), 2000)
  }

  if (preguntas.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] bg-white rounded-2xl"
        style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
        Este trámite no tiene preguntas clave configuradas
      </div>
    )
  }

  const respondidas = preguntas.filter(p => p.respuesta?.trim()).length

  return (
    <div className="flex flex-col gap-3">

      {/* Header con progreso */}
      <div className="bg-white rounded-2xl px-5 py-3 flex items-center justify-between"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div>
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>
            Preguntas clave del trámite
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
            {readOnly ? 'Respuestas del asesor' : 'El asesor debe responder estas preguntas antes de proceder'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-bold"
            style={{ color: respondidas === preguntas.length ? '#065F46' : '#92400E' }}>
            {respondidas}/{preguntas.length}
          </div>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width:      `${(respondidas / preguntas.length) * 100}%`,
                background: respondidas === preguntas.length ? '#065F46' : '#F0B429',
              }} />
          </div>
        </div>
      </div>

      {/* Lista de preguntas */}
      {preguntas.map((p, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          {/* Pregunta */}
          <div className="flex items-start gap-3 px-4 py-3"
            style={{ background: '#FAFAF8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
              style={{ background: p.respuesta?.trim() ? '#065F46' : '#9CA3AF' }}>
              {p.respuesta?.trim() ? '✓' : i + 1}
            </div>
            <p className="text-[13px] font-medium leading-relaxed flex-1" style={{ color: '#111' }}>
              {p.pregunta}
            </p>
          </div>

          {/* Respuesta */}
          <div className="px-4 py-3">
            {readOnly ? (
              <p className="text-[13px] leading-relaxed"
                style={{ color: p.respuesta?.trim() ? '#333' : '#CCC', fontStyle: p.respuesta?.trim() ? 'normal' : 'italic' }}>
                {p.respuesta?.trim() || 'Sin respuesta'}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  defaultValue={p.respuesta || ''}
                  onBlur={e => {
                    if (e.target.value !== p.respuesta) {
                      guardarRespuesta(i, e.target.value)
                    }
                  }}
                  rows={2}
                  placeholder="Escribe la respuesta del cliente..."
                  className="w-full text-[13px] outline-none resize-none rounded-xl px-3 py-2 transition-all"
                  style={{
                    background: '#F7F7F5',
                    border:     '1px solid rgba(0,0,0,0.08)',
                    color:      '#333',
                  }}
                />
                <div className="flex justify-end items-center gap-2 h-4">
                  {guardando === i && (
                    <span className="text-[11px]" style={{ color: '#9C9890' }}>Guardando...</span>
                  )}
                  {guardado === i && (
                    <span className="text-[11px] font-medium" style={{ color: '#065F46' }}>✓ Guardado</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}