'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import s from './tabs.module.css'
import { Ic, Modal, useModal, Toast, useAviso } from '../ticketUi'
import { iniciales } from './tabsUtil'

interface Observacion {
  id:             string
  contenido:      string
  estatus:        string
  archivo_url:    string | null
  archivo_nombre: string | null
  created_at:     string
  updated_at:     string
  usuario_id:     string
  usuarios_sistema?: { nombre: string; avatar_letras: string; avatar_color: string }
}

interface Props {
  ticketId: string
}

// Rojo solo para lo urgente; el resto en negro y grises
const ESTATUS = [
  { id: 'demorado',   label: 'Demorado',   tono: 'red'  },
  { id: 'pendiente',  label: 'Pendiente',  tono: 'dark' },
  { id: 'no_pagado',  label: 'No pagado',  tono: 'dark' },
  { id: 'en_proceso', label: 'En proceso', tono: 'gray' },
  { id: 'pagado',     label: 'Pagado',     tono: 'gray' },
  { id: 'ok',         label: 'OK',         tono: 'gray' },
]
const getEstatus = (id: string) => ESTATUS.find(e => e.id === id) || ESTATUS[1]
const esPDF = (url?: string | null) => !!url && /\.pdf(\?|$)/i.test(url)
const esImagen = (url?: string | null) => !!url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)

export default function TabObservaciones({ ticketId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const fileRef = useRef<HTMLInputElement>(null)
  const { aviso, mostrar } = useAviso()
  const modal = useModal()
  const modalBorrar = useModal()

  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrarId, setBorrarId] = useState<string | null>(null)

  const [texto, setTexto] = useState('')
  const [estatus, setEstatus] = useState('pendiente')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const editando = observaciones.find(o => o.id === editandoId) || null

  useEffect(() => {
    cargar()
    cargarUsuario()
  }, [ticketId])

  async function cargar() {
    const { data } = await supabase
      .from('observaciones')
      .select('*, usuarios_sistema(nombre, avatar_letras, avatar_color)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
    if (data) setObservaciones(data)
    setCargando(false)
  }

  async function cargarUsuario() {
    try {
      const cached = sessionStorage.getItem('usuario_sistema')
      if (cached) { setUsuarioActual(JSON.parse(cached)); return }
    } catch {}
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('usuarios_sistema').select('id, nombre, avatar_letras, avatar_color').eq('email', user.email || '').single()
    if (data) setUsuarioActual(data)
  }

  function abrirNueva() {
    setEditandoId(null)
    setTexto(''); setEstatus('pendiente'); setArchivo(null); setPreview(null)
    modal.abrir()
  }

  function abrirEditar(obs: Observacion) {
    setEditandoId(obs.id)
    setTexto(obs.contenido); setEstatus(obs.estatus || 'pendiente'); setArchivo(null); setPreview(obs.archivo_url)
    modal.abrir()
  }

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setArchivo(f)
    if (f.type.startsWith('image/')) {
      const r = new FileReader()
      r.onload = () => setPreview(r.result as string)
      r.readAsDataURL(f)
    } else setPreview(null)
  }

  async function subirArchivo(obsId: string): Promise<{ url: string; nombre: string } | null> {
    if (!archivo) return null
    const form = new FormData()
    form.append('archivo', archivo)
    form.append('observacion_id', obsId)
    form.append('ticket_id', ticketId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload-observacion`, { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const data = await res.json()
      return { url: data.url, nombre: archivo.name }
    } catch {
      mostrar('La nota se guardó, pero no se pudo subir el archivo', true)
      return null
    }
  }

  async function guardar() {
    if (!texto.trim() || !usuarioActual) return
    setGuardando(true)
    try {
      if (editando) {
        const cambios: any = { contenido: texto.trim(), estatus, updated_at: new Date().toISOString() }
        const subido = await subirArchivo(editando.id)
        if (subido) { cambios.archivo_url = subido.url; cambios.archivo_nombre = subido.nombre }
        await supabase.from('observaciones').update(cambios).eq('id', editando.id)
        setObservaciones(prev => prev.map(o => (o.id === editando.id ? { ...o, ...cambios } : o)))
        mostrar('Observación actualizada')
      } else {
        const { data: nueva } = await supabase.from('observaciones')
          .insert({ ticket_id: ticketId, usuario_id: usuarioActual.id, contenido: texto.trim(), estatus })
          .select('*, usuarios_sistema(nombre, avatar_letras, avatar_color)')
          .single()
        if (!nueva) { mostrar('No se pudo guardar la observación', true); return }
        const subido = await subirArchivo(nueva.id)
        if (subido) {
          await supabase.from('observaciones').update({ archivo_url: subido.url, archivo_nombre: subido.nombre }).eq('id', nueva.id)
          nueva.archivo_url = subido.url
          nueva.archivo_nombre = subido.nombre
        }
        setObservaciones(prev => [nueva, ...prev])
        mostrar('Observación agregada')
      }
      modal.cerrar()
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!borrarId) return
    await supabase.from('observaciones').delete().eq('id', borrarId)
    setObservaciones(prev => prev.filter(o => o.id !== borrarId))
    modalBorrar.cerrar()
    mostrar('Observación eliminada')
  }

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <div className={s.toolbarTitle}>
          {observaciones.length} observaci{observaciones.length !== 1 ? 'ones' : 'ón'}
          <small>Notas internas del expediente</small>
        </div>
        <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={abrirNueva}>+ Agregar observación</button>
      </div>

      {cargando ? (
        <div className={s.empty}><span className={s.spin} /></div>
      ) : observaciones.length === 0 ? (
        <div className={s.empty}><b>Sin observaciones</b><span>Agrega notas internas sobre este expediente.</span></div>
      ) : (
        <div className={s.notes}>
          {observaciones.map((obs, i) => {
            const est = getEstatus(obs.estatus)
            const autor = obs.usuarios_sistema
            const editada = obs.updated_at && obs.updated_at !== obs.created_at
            const mia = usuarioActual?.id === obs.usuario_id
            return (
              <div key={obs.id} className={`${s.note} ${est.tono === 'red' ? s.noteRed : est.tono === 'dark' ? s.noteDark : ''}`}
                style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                <div className={s.noteHead}>
                  <span className={s.avatar} style={{ width: 30, height: 30, fontSize: '.66rem' }}>
                    {autor?.avatar_letras || iniciales(autor?.nombre)}
                  </span>
                  <div>
                    <b>{autor?.nombre || 'Usuario'}</b>
                    <span className={`${s.chip} ${est.tono === 'red' ? s.chipRed : est.tono === 'dark' ? s.chipDark : ''}`}>{est.label}</span>
                    <small>
                      {format(new Date(obs.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                      {editada && ' · editada'}
                    </small>
                  </div>
                  {mia && (
                    <div className={s.noteActions}>
                      <button type="button" className={s.iconBtn} onClick={() => abrirEditar(obs)} title="Editar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                      </button>
                      <button type="button" className={s.iconBtn} onClick={() => { setBorrarId(obs.id); modalBorrar.abrir() }} title="Eliminar">
                        <Ic n="x" size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <div className={s.noteText}>{obs.contenido}</div>
                {obs.archivo_url && (esImagen(obs.archivo_url) ? (
                  <a className={s.attachImg} href={obs.archivo_url} target="_blank" rel="noopener noreferrer">
                    <img src={obs.archivo_url} alt={obs.archivo_nombre || ''} loading="lazy" />
                  </a>
                ) : (
                  <a className={s.attach} href={obs.archivo_url} target="_blank" rel="noopener noreferrer">
                    <Ic n="doc" size={16} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {obs.archivo_nombre || (esPDF(obs.archivo_url) ? 'Documento PDF' : 'Archivo adjunto')}
                    </span>
                    <Ic n="external" size={13} />
                  </a>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {modal.abierto && (
        <Modal saliendo={modal.saliendo} onClose={guardando ? undefined : modal.cerrar} ancho={480}>
          <div className={s.modalBody}>
            <h3>{editando ? 'Editar observación' : 'Nueva observación'}</h3>
            <p>{editando ? 'Cambia el texto, el estatus o el archivo.' : 'Nota interna; el cliente no la ve.'}</p>

            <label className={s.label}>Estatus</label>
            <div className={s.statusGrid} style={{ marginBottom: 14 }}>
              {ESTATUS.map(e => (
                <button key={e.id} type="button"
                  className={`${s.statusOpt} ${estatus === e.id ? (e.tono === 'red' ? s.statusOnRed : s.statusOn) : ''}`}
                  style={estatus !== e.id && e.tono === 'red' ? { color: '#b42318' } : undefined}
                  onClick={() => setEstatus(e.id)}>
                  <i />{e.label}
                </button>
              ))}
            </div>

            <label className={s.label} htmlFor="obs-texto">Observación</label>
            <textarea id="obs-texto" className={s.textarea} rows={4} autoFocus value={texto}
              onChange={e => setTexto(e.target.value)} placeholder="Escribe la observación…" />
            <div style={{ fontSize: '.7rem', color: '#a3a3a3', textAlign: 'right', margin: '4px 0 12px' }}>{texto.length} caracteres</div>

            <label className={s.label}>Archivo adjunto <span style={{ color: '#a3a3a3', fontWeight: 500 }}>opcional</span></label>
            {(archivo || preview) && (
              <div className={s.fileRow}>
                {preview && (esImagen(preview) || preview.startsWith('data:image')) ? <img src={preview} alt="" /> : <Ic n="doc" size={18} />}
                <span>{archivo?.name || editando?.archivo_nombre || 'Archivo actual'}</span>
                {archivo && (
                  <button type="button" className={s.iconBtn} onClick={() => { setArchivo(null); setPreview(editando?.archivo_url || null) }} title="Quitar">
                    <Ic n="x" size={12} />
                  </button>
                )}
              </div>
            )}
            <button type="button" className={s.attachPick} onClick={() => fileRef.current?.click()}>
              {archivo || preview ? 'Cambiar archivo' : 'Adjuntar imagen o documento'}
            </button>
            <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.doc,.docx" onChange={elegirArchivo} />
          </div>
          <div className={s.modalFoot}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={modal.cerrar} disabled={guardando}>Cancelar</button>
            <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={guardar} disabled={!texto.trim() || guardando}>
              {guardando && <span className={`${s.spin} ${s.spinLight}`} />}
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </Modal>
      )}

      {modalBorrar.abierto && (
        <Modal saliendo={modalBorrar.saliendo} onClose={modalBorrar.cerrar} ancho={380}>
          <div className={s.modalBody}>
            <h3>¿Eliminar observación?</h3>
            <p style={{ marginBottom: 0 }}>Esta acción no se puede deshacer.</p>
          </div>
          <div className={s.modalFoot}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={modalBorrar.cerrar}>Cancelar</button>
            <button type="button" className={`${s.btn} ${s.btnRed}`} onClick={eliminar}>Sí, eliminar</button>
          </div>
        </Modal>
      )}

      <Toast aviso={aviso} />
    </div>
  )
}