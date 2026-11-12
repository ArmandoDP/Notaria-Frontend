'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import s from './tabs.module.css'
import { Ic } from '../ticketUi'

interface Pregunta {
  id?:       string
  pregunta:  string
  respuesta: string
  orden:     number
}

interface Props {
  ticketId:  string
  preguntas: Pregunta[]
  readOnly?: boolean
}

export default function TabPreguntas({ ticketId, preguntas: inicial, readOnly = false }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [preguntas, setPreguntas] = useState<Pregunta[]>(inicial)
  const [borradores, setBorradores] = useState<Record<number, string>>({})
  const [guardando, setGuardando] = useState<number | null>(null)
  const [guardado, setGuardado] = useState<number | null>(null)
  const [error, setError] = useState<number | null>(null)

  async function guardarRespuesta(i: number, respuesta: string) {
    setGuardando(i)
    setError(null)
    const p = preguntas[i]
    let nuevoId = p.id
    if (p.id) {
      const { error } = await supabase.from('ticket_preguntas')
        .update({ respuesta, updated_at: new Date().toISOString() }).eq('id', p.id)
      if (error) { setGuardando(null); setError(i); return }
    } else {
      const { data, error } = await supabase.from('ticket_preguntas')
        .insert({ ticket_id: ticketId, pregunta: p.pregunta, respuesta, orden: p.orden })
        .select().single()
      if (error) { setGuardando(null); setError(i); return }
      nuevoId = data?.id
    }
    setPreguntas(prev => prev.map((x, j) => (j === i ? { ...x, id: nuevoId, respuesta } : x)))
    setGuardando(null)
    setGuardado(i)
    setTimeout(() => setGuardado(g => (g === i ? null : g)), 2000)
  }

  if (preguntas.length === 0) {
    return <div className={s.wrap}><div className={s.empty}><b>Sin preguntas clave</b><span>Este trámite no tiene preguntas configuradas.</span></div></div>
  }

  const respondidas = preguntas.filter((p, i) => (borradores[i] ?? p.respuesta)?.trim()).length

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <div className={s.toolbarTitle}>
          Preguntas clave del trámite
          <small>{readOnly ? 'Respuestas registradas' : 'Se guardan solas al terminar de escribir'}</small>
        </div>
        <div className={s.progress}>
          {respondidas}/{preguntas.length}
          <span className={s.progBar}><i style={{ width: `${(respondidas / preguntas.length) * 100}%` }} /></span>
        </div>
      </div>

      <div className={s.qList}>
        {preguntas.map((p, i) => {
          const valor = borradores[i] ?? p.respuesta ?? ''
          const ok = !!valor.trim()
          return (
            <div key={i} className={s.q} style={{ animationDelay: `${i * 45}ms` }}>
              <div className={s.qHead}>
                <span className={`${s.qNum} ${ok ? s.qNumOk : ''}`}>{ok ? <Ic n="check" size={11} sw={3} /> : i + 1}</span>
                <p>{p.pregunta}</p>
              </div>
              <div className={s.qBody}>
                {readOnly ? (
                  <div style={{ fontSize: '.86rem', color: ok ? '#3a3a3a' : '#a3a3a3', fontStyle: ok ? 'normal' : 'italic' }}>
                    {ok ? valor : 'Sin respuesta'}
                  </div>
                ) : (
                  <>
                    <textarea
                      className={s.textarea}
                      rows={2}
                      value={valor}
                      placeholder="Respuesta del cliente"
                      onChange={e => setBorradores(b => ({ ...b, [i]: e.target.value }))}
                      onBlur={e => { if (e.target.value !== p.respuesta) guardarRespuesta(i, e.target.value) }}
                    />
                    <div className={s.qState}>
                      {guardando === i && <><span className={s.spin} /> Guardando…</>}
                      {guardado === i && <span className={s.saved}>✓ Guardado</span>}
                      {error === i && <span style={{ color: '#b42318', fontWeight: 700 }}>No se pudo guardar</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}