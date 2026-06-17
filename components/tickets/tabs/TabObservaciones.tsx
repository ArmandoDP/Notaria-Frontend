'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Observacion {
  id:             string
  contenido:      string
  estatus:        string
  archivo_url:    string | null
  archivo_nombre: string | null
  created_at:     string
  updated_at:     string
  usuario_id:     string
  usuarios_sistema?: { nombre: string, avatar_letras: string, avatar_color: string }
}

interface Props {
  ticketId: string
}

const ESTATUS = [
  { id: 'demorado',   label: 'Demorado',   color: '#991B1B', bg: '#FEE2E2', dot: '#E24B4A' },
  { id: 'pendiente',  label: 'Pendiente',  color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  { id: 'en_proceso', label: 'En proceso', color: '#854F0B', bg: '#FEF9C3', dot: '#EAB308' },
  { id: 'ok',         label: 'OK',         color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  { id: 'pagado',     label: 'Pagado',     color: '#1B5FA5', bg: '#E6F1FB', dot: '#3B82F6' },
  { id: 'no_pagado',  label: 'No pagado',  color: '#5B21B6', bg: '#EDE9FE', dot: '#8B5CF6' },
]

function getEstatus(id: string) {
  return ESTATUS.find(e => e.id === id) || ESTATUS[1]
}

export default function TabObservaciones({ ticketId }: Props) {
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [modalAbrirId, setModalAbrirId]   = useState<string | null>(null) // id de obs para abrir modal editar
  const [modalAgregar, setModalAgregar]   = useState(false)
  const [confirmElim,  setConfirmElim]    = useState<string | null>(null)

  // Form state
  const [texto,        setTexto]        = useState('')
  const [estatus,      setEstatus]      = useState('pendiente')
  const [archivo,      setArchivo]      = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [guardando,    setGuardando]    = useState(false)
  const [subiendo,     setSubiendo]     = useState(false)

  const obsEditando = observaciones.find(o => o.id === modalAbrirId) || null

  useEffect(() => {
    cargarObservaciones()
    cargarUsuario()
  }, [ticketId])

  async function cargarObservaciones() {
    const { data } = await supabase
      .from('observaciones')
      .select('*, usuarios_sistema(nombre, avatar_letras, avatar_color)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
    if (data) {
      console.log('observaciones:', data) // ← temporal para debug
      setObservaciones(data)
    }
  }

  async function cargarUsuario() {
    try {
      const cached = sessionStorage.getItem('usuario_sistema')
      if (cached) {
        setUsuarioActual(JSON.parse(cached))
        return
      }
    } catch {}
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('usuarios_sistema')
      .select('id, nombre, avatar_letras, avatar_color')
      .eq('email', user.email || '')
      .single()
    if (data) setUsuarioActual(data)
  }

  function abrirModalAgregar() {
    setTexto('')
    setEstatus('pendiente')
    setArchivo(null)
    setArchivoPreview(null)
    setModalAgregar(true)
  }

  function abrirModalEditar(obs: Observacion) {
    setTexto(obs.contenido)
    setEstatus(obs.estatus || 'pendiente')
    setArchivo(null)
    setArchivoPreview(obs.archivo_url)
    setModalAbrirId(obs.id)
  }

  function cerrarModal() {
    setModalAgregar(false)
    setModalAbrirId(null)
    setTexto('')
    setEstatus('pendiente')
    setArchivo(null)
    setArchivoPreview(null)
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setArchivoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setArchivoPreview(null)
    }
  }

  async function subirArchivo(obsId: string): Promise<{ url: string, nombre: string } | null> {
    if (!archivo) return null
    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('archivo',        archivo)
      formData.append('observacion_id', obsId)
      formData.append('ticket_id',      ticketId)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload-observacion`, {
        method: 'POST',
        body:   formData,
      })
      if (!res.ok) throw new Error('Error al subir')
      const data = await res.json()
      return { url: data.url, nombre: archivo.name }
    } catch (e) {
      console.error('Error subiendo archivo:', e)
      return null
    } finally {
      setSubiendo(false)
    }
  }

  async function agregar() {
    if (!texto.trim() || !usuarioActual) return
    setGuardando(true)
    try {
      // Insertar observación primero
      const { data: nueva } = await supabase
        .from('observaciones')
        .insert({
          ticket_id:  ticketId,
          usuario_id: usuarioActual.id,
          contenido:  texto.trim(),
          estatus,
        })
        .select('*, usuarios_sistema(nombre, avatar_letras, avatar_color)')
        .single()

      if (!nueva) return

      // Subir archivo si hay
      if (archivo) {
        const result = await subirArchivo(nueva.id)
        if (result) {
          await supabase.from('observaciones').update({
            archivo_url:    result.url,
            archivo_nombre: result.nombre,
          }).eq('id', nueva.id)
          nueva.archivo_url    = result.url
          nueva.archivo_nombre = result.nombre
        }
      }

      setObservaciones(prev => [nueva, ...prev])
      cerrarModal()
    } finally {
      setGuardando(false)
    }
  }

  async function editar() {
    if (!obsEditando || !texto.trim()) return
    setGuardando(true)
    try {
      const updates: any = {
        contenido:   texto.trim(),
        estatus,
        updated_at:  new Date().toISOString(),
      }

      // Subir nuevo archivo si hay
      if (archivo) {
        const result = await subirArchivo(obsEditando.id)
        if (result) {
          updates.archivo_url    = result.url
          updates.archivo_nombre = result.nombre
        }
      }

      await supabase.from('observaciones').update(updates).eq('id', obsEditando.id)
      setObservaciones(prev => prev.map(o =>
        o.id === obsEditando.id ? { ...o, ...updates } : o
      ))
      cerrarModal()
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    await supabase.from('observaciones').delete().eq('id', id)
    setObservaciones(prev => prev.filter(o => o.id !== id))
    setConfirmElim(null)
  }

  const isPDF = (url: string) => url?.toLowerCase().includes('.pdf')

  return (
    <>
      <div className="flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>
            {observaciones.length} observación{observaciones.length !== 1 ? 'es' : ''}
          </div>
          <button onClick={abrirModalAgregar}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
            style={{ background: '#111', color: '#fff' }}>
            + Agregar observación
          </button>
        </div>

        {/* Lista */}
        {observaciones.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center"
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="text-[28px] mb-2">📝</div>
            <div className="text-[13px] font-semibold mb-1" style={{ color: '#333' }}>Sin observaciones</div>
            <div className="text-[12px]" style={{ color: '#9C9890' }}>Agrega notas internas sobre este expediente</div>
          </div>
        ) : (
          observaciones.map(obs => {
            const usuario = obs.usuarios_sistema
            const est     = getEstatus(obs.estatus)
            const editada = obs.updated_at !== obs.created_at
            const esMia   = usuarioActual?.id === obs.usuario_id
            return (
              <div key={obs.id} className="bg-white rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${est.dot}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                {/* Barra de color del estatus */}
                <div className="h-1" style={{ background: est.dot }} />

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                        style={{ background: usuario?.avatar_color || '#666' }}>
                        {usuario?.avatar_letras || '??'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-[12px] font-semibold" style={{ color: '#111' }}>
                            {usuario?.nombre || 'Usuario'}
                          </div>
                          {/* Badge estatus */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: est.bg, color: est.color }}>
                            {est.label}
                          </span>
                        </div>
                        <div className="text-[10px]" style={{ color: '#9C9890' }}>
                          {format(new Date(obs.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                          {editada && <span className="ml-1.5 italic">· editado</span>}
                        </div>
                      </div>
                    </div>

                    {esMia && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => abrirModalEditar(obs)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                          style={{ background: '#F3F4F6', color: '#555' }}>
                          ✎ Editar
                        </button>
                        <button onClick={() => setConfirmElim(obs.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                          style={{ background: '#FEE2E2', color: '#991B1B' }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="text-[13px] leading-relaxed mb-3"
                    style={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                    {obs.contenido}
                  </div>

                  {/* Archivo adjunto */}
                  {obs.archivo_url && (
                    <div className="mt-2">
                      {isPDF(obs.archivo_url) ? (
                        <a href={obs.archivo_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl no-underline"
                          style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <span className="text-[16px]">📄</span>
                          <span className="text-[12px] font-medium truncate" style={{ color: '#185FA5' }}>
                            {obs.archivo_nombre || 'Documento adjunto'}
                          </span>
                          <span className="ml-auto text-[11px]" style={{ color: '#9C9890' }}>↗ Abrir</span>
                        </a>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden"
                          style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                          <img src={obs.archivo_url} alt={obs.archivo_nombre || ''}
                            className="w-full max-h-48 object-cover cursor-pointer"
                            onClick={() => window.open(obs.archivo_url!, '_blank')} />
                          <div className="absolute bottom-2 right-2">
                            <a href={obs.archivo_url} download target="_blank" rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold no-underline"
                              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                              ⬇ Descargar
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal agregar / editar */}
      {(modalAgregar || modalAbrirId) && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={cerrarModal}>
          <div className="rounded-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div className="text-[15px] font-bold" style={{ color: '#111' }}>
                  {obsEditando ? 'Editar observación' : 'Nueva observación'}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
                  {obsEditando ? 'Modifica el contenido y estatus' : 'Agrega una nota interna al expediente'}
                </div>
              </div>
              <button onClick={cerrarModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#666' }}>
                ✕
              </button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-4">

              {/* Selector de estatus */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  Estatus
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ESTATUS.map(e => (
                    <button key={e.id} type="button"
                      onClick={() => setEstatus(e.id)}
                      className="py-2 rounded-xl text-[11px] font-bold cursor-pointer border-none transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background: estatus === e.id ? e.bg : '#F7F7F5',
                        color:      estatus === e.id ? e.color : '#9C9890',
                        border:     estatus === e.id ? `1.5px solid ${e.dot}` : '1.5px solid transparent',
                      }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.dot }} />
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  Observación
                </label>
                <textarea
                  autoFocus
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Escribe tu observación aquí..."
                  rows={4}
                  className="w-full px-3 py-3 rounded-xl text-[13px] outline-none resize-none leading-relaxed"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                />
                <div className="text-[11px] mt-1 text-right" style={{ color: '#9C9890' }}>
                  {texto.length} caracteres
                </div>
              </div>

              {/* Adjuntar archivo */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  Adjuntar archivo (opcional)
                </label>

                {/* Preview del archivo actual o nuevo */}
                {archivoPreview && !archivo && (
                  <div className="mb-2 rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                    {isPDF(archivoPreview) ? (
                      <div className="flex items-center gap-2 p-3"
                        style={{ background: '#F7F7F5' }}>
                        <span className="text-[20px]">📄</span>
                        <span className="text-[12px]" style={{ color: '#555' }}>
                          {obsEditando?.archivo_nombre || 'Archivo adjunto actual'}
                        </span>
                      </div>
                    ) : (
                      <img src={archivoPreview} alt="" className="w-full max-h-32 object-cover" />
                    )}
                  </div>
                )}

                {archivo && (
                  <div className="mb-2 flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.06)' }}>
                    {archivoPreview ? (
                      <img src={archivoPreview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <span className="text-[20px]">📄</span>
                    )}
                    <span className="text-[12px] truncate flex-1" style={{ color: '#333' }}>{archivo.name}</span>
                    <button onClick={() => { setArchivo(null); setArchivoPreview(obsEditando?.archivo_url || null) }}
                      className="text-[11px] cursor-pointer border-none bg-transparent flex-shrink-0"
                      style={{ color: '#991B1B' }}>
                      ✕
                    </button>
                  </div>
                )}

                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-2.5 rounded-xl text-[12px] font-semibold cursor-pointer border-2 border-dashed transition-all"
                  style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#666', background: '#F7F7F5' }}>
                  📎 {archivo ? 'Cambiar archivo' : 'Adjuntar imagen o documento'}
                </button>
                <input ref={fileRef} type="file" className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleArchivo} />
              </div>
            </div>

            {/* Botones */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex gap-3 px-6 py-4">
                <button onClick={cerrarModal}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                  style={{ background: '#F3F4F6', color: '#444' }}>
                  Cancelar
                </button>
                <button
                  onClick={obsEditando ? editar : agregar}
                  disabled={!texto.trim() || guardando || subiendo}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                  style={{
                    background: texto.trim() && !guardando && !subiendo ? '#111' : '#F3F4F6',
                    color:      texto.trim() && !guardando && !subiendo ? '#fff' : '#9CA3AF',
                  }}>
                  {guardando || subiendo ? 'Guardando...' : obsEditando ? 'Guardar cambios' : 'Agregar observación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmElim && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div className="px-6 pt-6 pb-4">
              <div className="text-[15px] font-bold mb-1" style={{ color: '#111' }}>¿Eliminar observación?</div>
              <div className="text-[13px]" style={{ color: '#9C9890' }}>Esta acción no se puede deshacer.</div>
            </div>
            <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />
            <div className="flex gap-3 px-6 py-4">
              <button onClick={() => setConfirmElim(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#444' }}>
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmElim)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: '#FEE2E2', color: '#991B1B' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}