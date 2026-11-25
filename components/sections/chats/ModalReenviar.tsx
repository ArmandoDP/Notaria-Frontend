'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import s from './wa.module.css'
import { apiPost, ApiError, calcularVentana, iniciales } from './waUtils'

interface Props {
  mensajes:       any[]
  conversaciones: any[]
  onClose:        () => void
  onListo:        () => void
}

const MAX = 5

export default function ModalReenviar({ mensajes, conversaciones, onClose, onListo }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [elegidas, setElegidas] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [resultados, setResultados] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const buscarRef = useRef<HTMLInputElement>(null)

  useEffect(() => { buscarRef.current?.focus() }, [])
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && !enviando) onClose() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [enviando])

  const ahora = Date.now()
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return conversaciones
      .filter(c => !q || [c.nombre, c.telefono, c.areas?.nombre].some(v => (v || '').toLowerCase().includes(q)))
      .map(c => ({ ...c, abierta: calcularVentana(c.ultimo_entrante_at, ahora).estado !== 'closed' }))
      .sort((a, b) => Number(b.abierta) - Number(a.abierta))
      .slice(0, 80)
  }, [conversaciones, busqueda])

  const porId = useMemo(() => new Map(conversaciones.map(c => [c.id, c])), [conversaciones])

  function alternar(id: string) {
    setError(null)
    if (elegidas.includes(id)) setElegidas(elegidas.filter(x => x !== id))
    else if (elegidas.length >= MAX) setError(`Puedes reenviar a máximo ${MAX} conversaciones a la vez.`)
    else setElegidas([...elegidas, id])
  }

  async function reenviar() {
    if (!elegidas.length || enviando) return
    setEnviando(true)
    setError(null)
    try {
      const res = await apiPost('/api/meta/reenviar', { mensajes: mensajes.map(m => m.id), destinos: elegidas })
      const r: any[] = res.resultados || []
      if (r.every(x => x.ok)) { onListo(); return }
      setResultados(r)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo reenviar')
    } finally {
      setEnviando(false)
    }
  }

  const resumen = mensajes.length === 1
    ? (mensajes[0].contenido || mensajes[0].media_nombre || 'Archivo').slice(0, 60)
    : `${mensajes.length} mensajes`

  return (
    <div className={s.overlay} onClick={() => !enviando && onClose()}>
      <div className={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={s.modalHead}>
          <div>
            <b>Reenviar a…</b>
            <span>{resumen}</span>
          </div>
          <button className={s.roundBtn} onClick={onClose} disabled={enviando} aria-label="Cerrar">✕</button>
        </div>

        {resultados ? (
          <>
            <div className={s.modalBody}>
              {resultados.map(r => {
                const c = porId.get(r.conversacion_id)
                return (
                  <div key={r.conversacion_id} className={s.fwdResult}>
                    {r.ok
                      ? <span className={s.okIc}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg></span>
                      : <span className={s.badIc}>!</span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ display: 'block' }}>{c?.nombre || c?.telefono || 'Conversación'}</b>
                      <small style={{ color: r.ok ? '#54656f' : '#ea5545' }}>{r.ok ? 'Reenviado' : r.error}</small>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={s.modalFoot}>
              <button className={s.btnGreen} onClick={onListo}>Listo</button>
            </div>
          </>
        ) : (
          <>
            <div className={s.modalBody}>
              <input ref={buscarRef} className={s.fwdSearch} value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar conversación o número" />
              {elegidas.length > 0 && (
                <div className={s.fwdChips} style={{ marginBottom: 8 }}>
                  {elegidas.map(id => (
                    <span key={id} className={s.fwdChip}>
                      {porId.get(id)?.nombre || porId.get(id)?.telefono}
                      <button type="button" onClick={() => alternar(id)} aria-label="Quitar">✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div className={s.fwdList}>
                {lista.length === 0 && <div className={s.lockedNote} style={{ padding: 20 }}>Sin resultados</div>}
                {lista.map(c => {
                  const on = elegidas.includes(c.id)
                  return (
                    <button key={c.id} type="button" className={s.fwdRow} disabled={!c.abierta} onClick={() => alternar(c.id)}
                      title={c.abierta ? undefined : 'La ventana de 24 h está cerrada: primero envía una plantilla en esa conversación'}>
                      <span className={`${s.selDot} ${on ? s.selDotOn : ''}`}>
                        {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                      </span>
                      <div className={s.avatar} style={{ background: c.areas?.color_hex || '#5b6ec9' }}>{iniciales(c.nombre)}</div>
                      <div className={s.fwdMain}>
                        <b>{c.nombre || c.telefono}</b>
                        <small className={c.abierta ? '' : s.fwdClosed}>
                          {c.abierta ? `${c.telefono}${c.areas?.nombre ? ` · ${c.areas.nombre}` : ''}` : 'Ventana cerrada: requiere plantilla'}
                        </small>
                      </div>
                    </button>
                  )
                })}
              </div>
              {error && <div className={s.errorText}>{error}</div>}
            </div>
            <div className={s.modalFoot}>
              <button className={s.btnGhost} onClick={onClose} disabled={enviando}>Cancelar</button>
              <button className={s.btnGreen} onClick={reenviar} disabled={!elegidas.length || enviando}>
                {enviando ? 'Reenviando…' : `Reenviar${elegidas.length ? ` (${elegidas.length})` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}