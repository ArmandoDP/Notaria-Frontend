'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import s from './wa.module.css'
import PanelPlantillas from './PanelPlantillas'
import { apiPost, apiPostForm, ApiError, tamanoLegible } from './waUtils'

interface Props {
  conversacion: any
  ventanaAbierta: boolean
  respondiendo: any | null
  onCancelarRespuesta: () => void
}

export interface ComposerHandle {
  agregarArchivos: (archivos: File[]) => void
}

type Pendiente = { id: string; archivo: File; url: string | null; caption: string }

const EMOJIS = ['😀','😂','😊','😍','🙏','👍','👌','👏','🙌','💪','🤝','✅','❌','⚠️','📄','📎','📅','⏰','📍','🏛️','🖊️','📋','💬','📞','😅','🤔','😉','🙂','😢','🎉','❤️','👋']

const UBICACION_NOTARIA = {
  lat: Number(process.env.NEXT_PUBLIC_NOTARIA_LAT || 0),
  lng: Number(process.env.NEXT_PUBLIC_NOTARIA_LNG || 0),
  nombre: process.env.NEXT_PUBLIC_NOTARIA_NOMBRE || 'Notaría Pública No. 3',
  direccion: process.env.NEXT_PUBLIC_NOTARIA_DIRECCION || '',
}

const MAX_IMAGEN = 4.8 * 1024 * 1024
const CONVERTIR = ['image/webp', 'image/gif', 'image/bmp']

function mimeGrabacion() {
  if (typeof MediaRecorder === 'undefined') return ''
  const opciones = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
  return opciones.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

/** WhatsApp acepta fotos JPG/PNG de hasta 5 MB: lo demás se convierte a JPG (y se reduce si hace falta). */
async function prepararImagen(archivo: File): Promise<File> {
  const esImagen = archivo.type.startsWith('image/') && !archivo.type.includes('svg')
  if (!esImagen) return archivo
  if (!CONVERTIR.includes(archivo.type) && archivo.size <= MAX_IMAGEN) return archivo
  try {
    const bitmap = await createImageBitmap(archivo)
    const escala = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    let calidad = 0.9
    let blob: Blob | null = null
    do {
      blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', calidad))
      calidad -= 0.12
    } while (blob && blob.size > MAX_IMAGEN && calidad > 0.4)
    if (!blob) return archivo
    return new File([blob], archivo.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return archivo
  }
}

function nombreCaptura(tipo: string) {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const ext = tipo.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  return `captura-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`
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
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
}

const Composer = forwardRef<ComposerHandle, Props>(function Composer({ conversacion, ventanaAbierta, respondiendo, onCancelarRespuesta }, ref) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menu, setMenu] = useState<'adjuntos' | 'emoji' | 'plantillas' | 'ubicacion' | null>(null)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [ubic, setUbic] = useState(UBICACION_NOTARIA)

  // Vista previa de archivos antes de enviar
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [actual, setActual] = useState(0)
  const [progreso, setProgreso] = useState<{ hechos: number; total: number } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const captionRef = useRef<HTMLInputElement>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const inputDocRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const cancelarRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendientesRef = useRef<Pendiente[]>([])
  useEffect(() => { pendientesRef.current = pendientes }, [pendientes])

  useEffect(() => {
    setTexto(''); setError(null); setMenu(null); limpiarPendientes()
    return () => { detenerGrabacion(true); limpiarPendientes() }
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

  // ─── Vista previa ───
  async function agregarArchivos(archivos: File[]) {
    if (!archivos.length) return
    if (!ventanaAbierta) {
      setError('La ventana de 24 h está cerrada: primero envía una plantilla para poder mandar archivos.')
      return
    }
    setMenu(null)
    const preparados = await Promise.all(archivos.map(prepararImagen))
    const nuevos = preparados.map((archivo, i) => ({
      id: `${Date.now()}-${i}-${archivo.name}`,
      archivo,
      url: archivo.type.startsWith('image/') || archivo.type.startsWith('video/') ? URL.createObjectURL(archivo) : null,
      caption: '',
    }))
    const previos = pendientesRef.current
    // Si ya había texto escrito, se usa como comentario de la primera imagen (como WhatsApp)
    if (!previos.length && texto.trim() && nuevos[0]) { nuevos[0].caption = texto.trim(); setTexto('') }
    setActual(previos.length)
    setPendientes(prev => [...prev, ...nuevos])
    setTimeout(() => captionRef.current?.focus(), 60)
  }

  useImperativeHandle(ref, () => ({ agregarArchivos }), [ventanaAbierta, texto])

  function limpiarPendientes() {
    pendientesRef.current.forEach(p => p.url && URL.revokeObjectURL(p.url))
    setPendientes([]); setActual(0); setProgreso(null)
  }

  function quitarPendiente(id: string) {
    const p = pendientesRef.current.find(x => x.id === id)
    if (p?.url) URL.revokeObjectURL(p.url)
    const restantes = pendientesRef.current.length - 1
    setActual(a => Math.max(0, Math.min(a, restantes - 1)))
    setPendientes(prev => prev.filter(x => x.id !== id))
  }

  async function enviarPendientes() {
    const lista = pendientesRef.current
    if (!lista.length || progreso) return
    setError(null)
    setProgreso({ hechos: 0, total: lista.length })
    for (let i = 0; i < lista.length; i++) {
      const p = lista[i]
      const ok = await enviarArchivo(p.archivo, p.caption.trim(), i === 0)
      if (!ok) { setProgreso(null); return }
      setProgreso({ hechos: i + 1, total: lista.length })
      setPendientes(prev => prev.filter(x => x.id !== p.id))
      if (p.url) URL.revokeObjectURL(p.url)
    }
    setProgreso(null)
    setActual(0)
    onCancelarRespuesta()
  }

  // Pegar con Ctrl+V: capturas de pantalla e imágenes copiadas
  function alPegar(e: React.ClipboardEvent) {
    const archivos = Array.from(e.clipboardData?.items || [])
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((f): f is File => !!f)
      .map(f => (f.name && f.name !== 'image.png' ? f : new File([f], nombreCaptura(f.type), { type: f.type })))
    if (!archivos.length) return
    e.preventDefault()
    agregarArchivos(archivos)
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

  // ─── Envío de un archivo ───
  async function enviarArchivo(archivo: File, caption = '', citar = true): Promise<boolean> {
    setMenu(null); setError(null)
    if (!pendientesRef.current.length) {
      setSubiendo(archivo.type.startsWith('audio/') ? 'Enviando nota de voz…' : `Enviando ${archivo.name}…`)
    }
    const form = new FormData()
    form.append('conversacion_id', conversacion.id)
    form.append('caption', caption)
    form.append('responde_a', citar ? respondiendo?.wa_message_id || '' : '')
    form.append('archivo', archivo)
    try {
      await apiPostForm('/api/meta/enviar-media', form)
      return true
    } catch (e) {
      manejarError(e, `No se pudo enviar ${archivo.name}`)
      return false
    } finally {
      setSubiendo(null)
    }
  }

  function alElegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files || [])
    e.target.value = ''
    agregarArchivos(archivos)
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
      rec.ondataavailable = ev => { if (ev.data.size) chunksRef.current.push(ev.data) }
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (cancelarRef.current || !chunksRef.current.length) return
        const tipo = mime.split(';')[0]
        const ext = tipo.includes('ogg') ? 'ogg' : tipo.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type: tipo })
        enviarArchivo(new File([blob], `nota-de-voz.${ext}`, { type: tipo })).then(ok => ok && onCancelarRespuesta())
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

  // ─── Vista previa (pantalla completa, como WhatsApp Web) ───
  const vistaPrevia = pendientes.length > 0 && (() => {
    const p = pendientes[Math.min(actual, pendientes.length - 1)]
    if (!p) return null
    const ext = (p.archivo.name.split('.').pop() || '').toUpperCase().slice(0, 4)
    return (
      <div className={s.pv} role="dialog" aria-modal="true"
        onKeyDown={e => { if (e.key === 'Escape' && !progreso) limpiarPendientes() }}>
        {progreso && <div className={s.pvProgress}><i style={{ width: `${(progreso.hechos / progreso.total) * 100}%` }} /></div>}
        <div className={s.pvHead}>
          <button type="button" className={s.roundBtn} onClick={limpiarPendientes} disabled={!!progreso} aria-label="Cancelar"><Icono d={IC.x} size={20} /></button>
          <b>{p.archivo.name}</b>
          <span style={{ fontSize: '.8rem', color: '#54656f' }}>{tamanoLegible(p.archivo.size)}</span>
        </div>
        <div className={s.pvStage}>
          {p.archivo.type.startsWith('image/') && p.url ? <img key={p.id} src={p.url} alt={p.archivo.name} />
            : p.archivo.type.startsWith('video/') && p.url ? <video key={p.id} src={p.url} controls />
            : (
              <div key={p.id} className={s.pvFile}>
                <div className={s.pvFileIc}>{ext || 'DOC'}</div>
                <b>{p.archivo.name}</b>
                <span>{tamanoLegible(p.archivo.size)} · {ext || 'Archivo'}</span>
              </div>
            )}
        </div>
        {!p.archivo.type.startsWith('audio/') && (
          <div className={s.pvCaption}>
            <input
              ref={captionRef}
              value={p.caption}
              placeholder="Agrega un comentario…"
              disabled={!!progreso}
              onChange={e => { const v = e.target.value; setPendientes(prev => prev.map(x => (x.id === p.id ? { ...x, caption: v } : x))) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); enviarPendientes() } }}
              onPaste={alPegar}
            />
          </div>
        )}
        <div className={s.pvFoot}>
          <div className={s.pvThumbs}>
            {pendientes.map((x, i) => (
              <button key={x.id} type="button" className={`${s.pvThumb} ${i === actual ? s.pvThumbOn : ''}`} onClick={() => setActual(i)} title={x.archivo.name}>
                {x.url && x.archivo.type.startsWith('image/') ? <img src={x.url} alt="" /> : <Icono d={IC.doc} size={22} />}
                {!progreso && (
                  <span className={s.pvThumbX} role="button" aria-label="Quitar" onClick={e => { e.stopPropagation(); quitarPendiente(x.id) }}>✕</span>
                )}
              </button>
            ))}
            {!progreso && (
              <button type="button" className={s.pvAdd} onClick={() => inputDocRef.current?.click()} title="Agregar más">+</button>
            )}
          </div>
          <button type="button" className={s.pvSend} onClick={enviarPendientes} disabled={!!progreso} title="Enviar">
            {progreso ? <span className={s.spinner} /> : <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>}
            <span className={s.pvCount}>{progreso ? `${progreso.hechos}/${progreso.total}` : pendientes.length}</span>
          </button>
        </div>
      </div>
    )
  })()

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
      {vistaPrevia}

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
                placeholder="Escribe un mensaje (puedes pegar imágenes con Ctrl+V)"
                onChange={e => { setTexto(e.target.value); autoAltura(e.target) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarTexto() } }}
                onPaste={alPegar}
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
})

export default Composer