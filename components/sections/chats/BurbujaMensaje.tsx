'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import s from './wa.module.css'
import { useMediaUrl, tamanoLegible, nombrePlantilla } from './waUtils'

interface Props {
  m: any
  citado?: any
  nombreCliente: string
  onResponder: (m: any) => void
}

function Palomitas({ estado }: { estado?: string | null }) {
  if (estado === 'fallido') return <span className={`${s.tk} ${s.tkFail}`} title="No entregado">!</span>
  if (estado === 'enviado') return <span className={s.tk}>✓</span>
  if (estado === 'leido') return <span className={`${s.tk} ${s.tkRead}`}>✓✓</span>
  return <span className={s.tk}>✓✓</span>
}

function onda(n: number) {
  return Array.from({ length: n }, (_, i) => 6 + Math.round(15 * Math.abs(Math.sin(i * 1.7 + 1))))
}
const ONDA = onda(28)

function fmtSeg(seg: number) {
  if (!isFinite(seg) || seg < 0) seg = 0
  const m = Math.floor(seg / 60)
  const r = Math.floor(seg % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

function Audio({ ruta }: { ruta?: string | null }) {
  const url = useMediaUrl(ruta)
  const ref = useRef<HTMLAudioElement>(null)
  const [sonando, setSonando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [duracion, setDuracion] = useState(0)

  useEffect(() => {
    const a = ref.current
    if (!a) return
    const alAvanzar = () => setProgreso(a.duration ? a.currentTime / a.duration : 0)
    const alCargar = () => isFinite(a.duration) && setDuracion(a.duration)
    const alTerminar = () => { setSonando(false); setProgreso(0) }
    a.addEventListener('timeupdate', alAvanzar)
    a.addEventListener('loadedmetadata', alCargar)
    a.addEventListener('durationchange', alCargar)
    a.addEventListener('ended', alTerminar)
    return () => {
      a.removeEventListener('timeupdate', alAvanzar)
      a.removeEventListener('loadedmetadata', alCargar)
      a.removeEventListener('durationchange', alCargar)
      a.removeEventListener('ended', alTerminar)
    }
  }, [url])

  function alternar() {
    const a = ref.current
    if (!a) return
    if (sonando) { a.pause(); setSonando(false) }
    else { a.play().then(() => setSonando(true)).catch(() => setSonando(false)) }
  }

  function saltar(e: React.MouseEvent<HTMLDivElement>) {
    const a = ref.current
    if (!a || !a.duration) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration
  }

  const hechas = Math.round(progreso * ONDA.length)
  return (
    <div className={s.audio}>
      {url && <audio ref={ref} src={url} preload="metadata" />}
      <button className={s.play} onClick={alternar} disabled={!url} aria-label={sonando ? 'Pausar' : 'Reproducir'}>
        {sonando ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>
        )}
      </button>
      <div className={s.wave} onClick={saltar}>
        {ONDA.map((h, i) => <i key={i} style={{ height: h }} className={i < hechas ? s.done : ''} />)}
      </div>
      <time>{fmtSeg(sonando || progreso ? (ref.current?.currentTime || 0) : duracion)}</time>
    </div>
  )
}

function Imagen({ ruta, sticker }: { ruta?: string | null; sticker?: boolean }) {
  const url = useMediaUrl(ruta)
  if (!ruta) return <div className={s.mediaError}>Imagen no disponible</div>
  if (!url) return <div className={s.photoPh}>Cargando…</div>
  return (
    <img
      src={url}
      alt=""
      className={sticker ? s.sticker : s.photo}
      onClick={() => !sticker && window.open(url, '_blank')}
    />
  )
}

function Video({ ruta }: { ruta?: string | null }) {
  const url = useMediaUrl(ruta)
  if (!ruta) return <div className={s.mediaError}>Video no disponible</div>
  if (!url) return <div className={s.photoPh}>Cargando…</div>
  return <video src={url} controls className={s.video} preload="metadata" />
}

function Documento({ m }: { m: any }) {
  const url = useMediaUrl(m.media_url)
  const nombre = m.media_nombre || 'Documento'
  const ext = (nombre.split('.').pop() || '').toUpperCase().slice(0, 4)
  const clase = ['XLS', 'XLSX', 'CSV'].includes(ext) ? s.docXls
    : ['DOC', 'DOCX'].includes(ext) ? s.docDoc
    : ext === 'PDF' ? '' : s.docOtro
  return (
    <button className={s.doc} onClick={() => url && window.open(url, '_blank')} disabled={!url}>
      <div className={`${s.docIc} ${clase}`}>{ext || 'DOC'}</div>
      <div>
        <b>{nombre}</b>
        <span>{[tamanoLegible(m.media_tamano), ext].filter(Boolean).join(' · ')}{!m.media_url ? ' · no disponible' : ''}</span>
      </div>
    </button>
  )
}

function Ubicacion({ u }: { u: any }) {
  if (!u?.lat || !u?.lng) return null
  return (
    <a className={s.loc} href={`https://www.google.com/maps?q=${u.lat},${u.lng}`} target="_blank" rel="noreferrer">
      <div className={s.locMap}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
      </div>
      <div className={s.locInfo}>
        <b>{u.nombre || 'Ubicación'}</b>
        <span>{u.direccion || `${Number(u.lat).toFixed(5)}, ${Number(u.lng).toFixed(5)}`} · Abrir en Maps</span>
      </div>
    </a>
  )
}

export default function BurbujaMensaje({ m, citado, nombreCliente, onResponder }: Props) {
  const entrante = m.direccion === 'entrante'
  const tipo = m.tipo || 'text'
  const esSticker = tipo === 'sticker'
  const texto = tipo === 'location' ? '' : (m.contenido || '')

  const clases = [
    s.msg,
    entrante ? s.msgIn : s.msgOut,
    esSticker ? s.msgSticker : '',
    m.reaccion ? s.withReaction : '',
  ].join(' ')

  const botonResponder = m.wa_message_id ? (
    <button className={s.replyBtn} onClick={() => onResponder(m)} title="Responder">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v4" /></svg>
    </button>
  ) : null

  return (
    <div className={`${s.row} ${entrante ? s.rowIn : s.rowOut}`}>
      {!entrante && botonResponder}
      <div className={clases}>
        {citado && (
          <div className={s.quote}>
            <b>{citado.direccion === 'entrante' ? nombreCliente : 'Notaría'}</b>
            <span>{citado.contenido || citado.media_nombre || 'Archivo'}</span>
          </div>
        )}

        {(tipo === 'image' || tipo === 'sticker') && <Imagen ruta={m.media_url} sticker={esSticker} />}
        {tipo === 'video' && <Video ruta={m.media_url} />}
        {tipo === 'audio' && <Audio ruta={m.media_url} />}
        {tipo === 'document' && <Documento m={m} />}
        {tipo === 'location' && <Ubicacion u={m.ubicacion} />}

        {texto}

        {!esSticker && (
          <span className={s.foot}>
            {format(new Date(m.created_at), 'HH:mm')}
            {!entrante && <Palomitas estado={m.estado} />}
          </span>
        )}
        {m.plantilla && <span className={s.tmplNote}>Plantilla: {nombrePlantilla(m.plantilla)}</span>}
        {m.estado === 'fallido' && <span className={s.failNote}>No entregado{m.error ? `: ${m.error}` : ''}</span>}
        {m.reaccion && <span className={s.reaction}>{m.reaccion}</span>}
      </div>
      {entrante && botonResponder}
    </div>
  )
}