'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Observacion {
  id:         string
  contenido:  string
  created_at: string
  updated_at: string
  usuario_id: string
  usuarios_sistema?: { nombre: string, avatar_letras: string, avatar_color: string }
}

interface Props {
  ticketId: string
}

export default function TabObservaciones({ ticketId }: Props) {
  const supabase = createClient()

  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [modalAgregar,  setModalAgregar]  = useState(false)
  const [modalEditar,   setModalEditar]   = useState<Observacion | null>(null)
  const [confirmElim,   setConfirmElim]   = useState<string | null>(null)
  const [texto,         setTexto]         = useState('')
  const [guardando,     setGuardando]     = useState(false)

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
    if (data) setObservaciones(data)
  }

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('usuarios_sistema')
      .select('id, nombre, avatar_letras, avatar_color')
      .eq('email', user.email || '')
      .single()
    if (data) setUsuarioActual(data)
  }

  async function agregar() {
    if (!texto.trim() || !usuarioActual) return
    setGuardando(true)
    const { data } = await supabase
      .from('observaciones')
      .insert({ ticket_id: ticketId, usuario_id: usuarioActual.id, contenido: texto.trim() })
      .select('*, usuarios_sistema(nombre, avatar_letras, avatar_color)')
      .single()
    if (data) setObservaciones(prev => [data, ...prev])
    setTexto('')
    setModalAgregar(false)
    setGuardando(false)
  }

  async function editar() {
    if (!modalEditar || !texto.trim()) return
    setGuardando(true)
    await supabase
      .from('observaciones')
      .update({ contenido: texto.trim(), updated_at: new Date().toISOString() })
      .eq('id', modalEditar.id)
    setObservaciones(prev => prev.map(o =>
      o.id === modalEditar.id ? { ...o, contenido: texto.trim(), updated_at: new Date().toISOString() } : o
    ))
    setModalEditar(null)
    setTexto('')
    setGuardando(false)
  }

  async function eliminar(id: string) {
    await supabase.from('observaciones').delete().eq('id', id)
    setObservaciones(prev => prev.filter(o => o.id !== id))
    setConfirmElim(null)
  }

  return (
    <>
      <div className="flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>
            {observaciones.length} observación{observaciones.length !== 1 ? 'es' : ''}
          </div>
          <button onClick={() => { setTexto(''); setModalAgregar(true) }}
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
            <div className="text-[13px] font-semibold mb-1" style={{ color: '#333' }}>
              Sin observaciones
            </div>
            <div className="text-[12px]" style={{ color: '#9C9890' }}>
              Agrega notas internas sobre este expediente
            </div>
          </div>
        ) : (
          observaciones.map(obs => {
            const usuario  = obs.usuarios_sistema
            const editada  = obs.updated_at !== obs.created_at
            const esMia    = usuarioActual?.id === obs.usuario_id
            return (
              <div key={obs.id} className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                {/* Header observación */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background: usuario?.avatar_color || '#666' }}>
                      {usuario?.avatar_letras || '??'}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: '#111' }}>
                        {usuario?.nombre || 'Usuario'}
                      </div>
                      <div className="text-[10px]" style={{ color: '#9C9890' }}>
                        {format(new Date(obs.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                        {editada && (
                          <span className="ml-1.5 italic">
                            · editado {format(new Date(obs.updated_at), "d MMM HH:mm", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones — solo el autor puede editar/eliminar */}
                  {esMia && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setTexto(obs.contenido); setModalEditar(obs) }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                        style={{ background: '#F3F4F6', color: '#555' }}>
                        ✎ Editar
                      </button>
                      <button
                        onClick={() => setConfirmElim(obs.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                        style={{ background: '#FEE2E2', color: '#991B1B' }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="text-[13px] leading-relaxed px-1"
                  style={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                  {obs.contenido}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal agregar / editar */}
      {(modalAgregar || modalEditar) && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => { setModalAgregar(false); setModalEditar(null) }}>
          <div className="rounded-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div className="text-[15px] font-bold" style={{ color: '#111' }}>
                  {modalEditar ? 'Editar observación' : 'Nueva observación'}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
                  {modalEditar ? 'Modifica el contenido de la observación' : 'Agrega una nota interna al expediente'}
                </div>
              </div>
              <button onClick={() => { setModalAgregar(false); setModalEditar(null) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#666' }}>
                ✕
              </button>
            </div>

            {/* Textarea */}
            <div className="px-6 py-4">
              <textarea
                autoFocus
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder="Escribe tu observación aquí..."
                rows={5}
                className="w-full px-3 py-3 rounded-xl text-[13px] outline-none resize-none leading-relaxed"
                style={{
                  background: '#F7F7F5',
                  border:     '1px solid rgba(0,0,0,0.08)',
                  color:      '#111',
                }}
              />
              <div className="text-[11px] mt-1.5 text-right" style={{ color: '#9C9890' }}>
                {texto.length} caracteres
              </div>
            </div>

            {/* Botones */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex gap-3 px-6 py-4">
                <button onClick={() => { setModalAgregar(false); setModalEditar(null) }}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                  style={{ background: '#F3F4F6', color: '#444' }}>
                  Cancelar
                </button>
                <button
                  onClick={modalEditar ? editar : agregar}
                  disabled={!texto.trim() || guardando}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                  style={{
                    background: texto.trim() && !guardando ? '#111' : '#F3F4F6',
                    color:      texto.trim() && !guardando ? '#fff' : '#9CA3AF',
                  }}>
                  {guardando ? 'Guardando...' : modalEditar ? 'Guardar cambios' : 'Agregar observación'}
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
              <div className="text-[15px] font-bold mb-1" style={{ color: '#111' }}>
                ¿Eliminar observación?
              </div>
              <div className="text-[13px]" style={{ color: '#9C9890' }}>
                Esta acción no se puede deshacer.
              </div>
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