'use client'

import { useEffect, useRef, useState } from 'react'
import s from './wa.module.css'
import PanelPlantillas from './PanelPlantillas'
import { apiPost, apiPostForm, ApiError } from './waUtils'

interface Props {
  conversacion: any
  ventanaAbierta: boolean
  respondiendo: any | null
  onCancelarRespuesta: () => void
}

const EMOJIS = ['😀','😂','😊','😍','🙏','👍','👌','👏','🙌','💪','🤝','✅','❌','⚠️','📄','📎','📅','⏰','📍','🏛️','🖊️','📋','💬','📞','😅','🤔','😉','🙂','😢','🎉','❤️','👋']

const UBICACION_NOTARIA = {
  lat: Number(process.env.NEXT_PUBLIC_NOTARIA_LAT || 0),
  lng: Number(process.env.NEXT_PUBLIC_NOTARIA_LNG || 0),
  nombre: process.env.NEXT_PUBLIC_NOTARIA_NOMBRE || 'Notaría Pública No. 3',
  direccion: process.env.NEXT_PUBLIC_NOTARIA_DIRECCION || '',
}

function mimeGrabacion() {
  if (typeof MediaRecorder === 'undefined') return ''
  const opciones = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
  return opciones.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

function Icono({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const IC = {
  emoji: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  x: 'M18 6 6 18M6 6l12 12',
}

export default function Composer({ conversacion, ventanaAbierta, respondiendo, onCancelarRespuesta }: Props) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menu, setMenu] = useState<'adjuntos' | 'emoji' | 'plantillas' | 'ubicacion' | null>(null)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [ubic, setUbic] = useState(UBICACION_NOTARIA)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const inputDocRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const cancelarRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setTexto(''); setError(null); setMenu(null)
    return () => detenerGrabacion(true)
  }, [conversacion.id])

  useEffect(() => { if (respondiendo) textareaRef.current?.focus() }, [respondiendo])

  function manejarError(e: unknown, porDefecto: string) {
    if (e instanceof ApiError && e.codigo === 'ventana_cerrada') {
      setError('La ventana de 24 h se cerró. Envía una plantilla para retomar la conversación.')
    } else {
      setError(e instanceof Error ? e.message : porDefecto)
    }
  }

  function autoAltura(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  // ─── Texto ───
  async function enviarTexto() {
    const msg = texto.trim()
    if (!msg || enviando) return
    setEnviando(true); setError(null)
    try {
      await apiPost('/api/meta/enviar', {
        conversacion_id: conversacion.id,
        mensaje: msg,
        responde_a: respondiendo?.wa_message_id || null,
      })
      setTexto('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      onCancelarRespuesta()
    } catch (e) {
      manejarError(e, 'No se pudo enviar el mensaje')
    } finally {
      setEnviando(false)
    }
  }

  // ─── Archivos ───
  async function enviarArchivo(archivo: File, caption = '') {
    setMenu(null); setError(null)
    setSubiendo(archivo.type.startsWith('audio/') ? 'Enviando nota de voz…' : `Enviando ${archivo.name}…`)
    const form = new FormData()
    form.append('conversacion_id', conversacion.id)
    form.append('caption', caption)
    form.append('responde_a', respondiendo?.wa_message_id || '')
    form.append('archivo', archivo)
    try {
      await apiPostForm('/api/meta/enviar-media', form)
      onCancelarRespuesta()
    } catch (e) {
      manejarError(e, 'No se pudo enviar el archivo')
    } finally {
      setSubiendo(null)
    }
  }

  function alElegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files || [])
    e.target.value = ''
    if (!archivos.length) return
    const caption = texto.trim()
    if (caption) setTexto('')
    ;(async () => {
      for (let i = 0; i < archivos.length; i++) await enviarArchivo(archivos[i], i === 0 ? caption : '')
    })()
  }

  // ─── Nota de voz ───
  async function iniciarGrabacion() {
    setError(null)
    const mime = mimeGrabacion()
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite grabar audio.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      cancelarRef.current = false
      rec.ondataavailable = ev => ev.data.size && chunksRef.current.push(ev.data)
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (cancelarRef.current || !chunksRef.current.length) return
        const tipo = mime.split(';')[0]
        const ext = tipo.includes('ogg') ? 'ogg' : tipo.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type: tipo })
        enviarArchivo(new File([blob], `nota-de-voz.${ext}`, { type: tipo }))
      }
      rec.start()
      recorderRef.current = rec
      setGrabando(true)
      setSegundos(0)
      timerRef.current = setInterval(() => setSegundos(x => x + 1), 1000)
    } catch {
      setError('No se pudo usar el micrófono. Revisa los permisos del navegador.')
    }
  }

  function detenerGrabacion(cancelar: boolean) {
    cancelarRef.current = cancelar
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    recorderRef.current = null
    setGrabando(false)
  }

  // ─── Ubicación ───
  async function enviarUbicacion() {
    setMenu(null); setError(null)
    try {
      await apiPost('/api/meta/enviar-ubicacion', { conversacion_id: conversacion.id, ...ubic })
    } catch (e) {
      manejarError(e, 'No se pudo enviar la ubicación')
    }
  }

  // ─── Ventana cerrada: solo plantillas ───
  if (!ventanaAbierta) {
    return (
      <div className={s.locked}>
        {error && (
          <div className={s.errorBar} style={{ margin: 0 }}>
            {error}<button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        <div className={s.lockedNote}>
          Pasaron más de 24 h desde el último mensaje del cliente. Para retomar la conversación envía una plantilla aprobada:
        </div>
        <PanelPlantillas conversacion={conversacion} onEnviada={() => setError(null)} onError={setError} />
      </div>
    )
  }

  const minutos = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

  return (
    <div className={s.composerWrap}>
      {menu === 'plantillas' && (
        <div className={s.panelFlotante}>
          <div className={s.panelTitle}>
            Enviar plantilla
            <button className={s.roundBtn} onClick={() => setMenu(null)} aria-label="Cerrar"><Icono d={IC.x} size={18} /></button>
          </div>
          <PanelPlantillas conversacion={conversacion} onEnviada={() => setMenu(null)} onError={setError} />
        </div>
      )}

      {menu === 'ubicacion' && (
        <div className={s.panelFlotante}>
          <div className={s.panelTitle}>
            Enviar ubicación
            <button className={s.roundBtn} onClick={() => setMenu(null)} aria-label="Cerrar"><Icono d={IC.x} size={18} /></button>
          </div>
          <div className={s.tmplForm}>
            {(['nombre', 'direccion', 'lat', 'lng'] as const).map(campo => (
              <label key={campo} className={s.tmplField}>
                <span style={{ width: 70 }}>{{ nombre: 'Nombre', direccion: 'Dirección', lat: 'Latitud', lng: 'Longitud' }[campo]}</span>
                <input
                  value={String(ubic[campo] ?? '')}
                  onChange={e => setUbic(u => ({ ...u, [campo]: campo === 'lat' || campo === 'lng' ? Number(e.target.value) : e.target.value }))}
                />
              </label>
            ))}
            <div className={s.tmplActions}>
              <button className={s.btnGreen} disabled={!ubic.lat || !ubic.lng} onClick={enviarUbicacion}>Enviar ubicación</button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={s.errorBar}>
          {error}<button onClick={() => setError(null)} aria-label="Cerrar">✕</button>
        </div>
      )}
      {subiendo && <div className={s.infoBar}>{subiendo}</div>}

      {respondiendo && (
        <div className={s.replyBar}>
          <div className={s.quote}>
            <b>{respondiendo.direccion === 'entrante' ? (conversacion.nombre || 'Cliente') : 'Notaría'}</b>
            <span>{respondiendo.contenido || respondiendo.media_nombre || 'Archivo'}</span>
          </div>
          <button className={s.roundBtn} onClick={onCancelarRespuesta} aria-label="Cancelar respuesta"><Icono d={IC.x} size={18} /></button>
        </div>
      )}

      <div className={s.composer}>
        {grabando ? (
          <>
            <div className={s.recPill}>
              <button className={s.roundBtn} onClick={() => detenerGrabacion(true)} title="Descartar"><Icono d={IC.trash} size={20} /></button>
              <span className={s.recDot} />
              Grabando {minutos}
            </div>
            <button className={s.send} onClick={() => detenerGrabacion(false)} title="Enviar nota de voz">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
            </button>
          </>
        ) : (
          <>
            <div className={s.pill} style={{ position: 'relative' }}>
              <button className={s.roundBtn} onClick={() => setMenu(menu === 'emoji' ? null : 'emoji')} title="Emoji"><Icono d={IC.emoji} /></button>
              <button className={s.roundBtn} onClick={() => setMenu(menu === 'adjuntos' ? null : 'adjuntos')} title="Adjuntar"><Icono d={IC.clip} /></button>

              {menu === 'emoji' && (
                <div className={s.popover} style={{ bottom: 54, left: 0 }}>
                  <div className={s.emojiGrid}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { setTexto(t => t + e); textareaRef.current?.focus() }}>{e}</button>
                    ))}
                  </div>
                </div>
              )}

              {menu === 'adjuntos' && (
                <div className={s.popover} style={{ bottom: 54, left: 30 }}>
                  <button className={s.menuItem} onClick={() => inputFotoRef.current?.click()}>
                    <span className={s.menuIc} style={{ background: '#007bfc' }}>🖼️</span>Fotos y videos
                  </button>
                  <button className={s.menuItem} onClick={() => inputDocRef.current?.click()}>
                    <span className={s.menuIc} style={{ background: '#7f66ff' }}>📄</span>Documento
                  </button>
                  <button className={s.menuItem} onClick={() => setMenu('ubicacion')}>
                    <span className={s.menuIc} style={{ background: '#1fa855' }}>📍</span>Ubicación
                  </button>
                  <button className={s.menuItem} onClick={() => setMenu('plantillas')}>
                    <span className={s.menuIc} style={{ background: '#d3396d' }}>📋</span>Plantilla
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={1}
                value={texto}
                placeholder="Escribe un mensaje"
                onChange={e => { setTexto(e.target.value); autoAltura(e.target) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarTexto() } }}
                onFocus={() => menu && menu !== 'plantillas' && menu !== 'ubicacion' && setMenu(null)}
              />
            </div>

            {texto.trim() ? (
              <button className={s.send} onClick={enviarTexto} disabled={enviando} title="Enviar">
                {enviando ? <span className={s.spinner} /> : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
                )}
              </button>
            ) : (
              <button className={s.send} onClick={iniciarGrabacion} disabled={!!subiendo} title="Grabar nota de voz">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d={IC.mic} /></svg>
              </button>
            )}
          </>
        )}
      </div>

      <input ref={inputFotoRef} type="file" accept="image/*,video/*" multiple hidden onChange={alElegirArchivos} />
      <input ref={inputDocRef} type="file" multiple hidden onChange={alElegirArchivos} />
    </div>
  )
}