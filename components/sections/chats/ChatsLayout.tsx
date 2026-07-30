'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListaConversaciones from './ListaConversaciones'
import VistaChat           from './VistaChat'

interface Props {
  conversacionesIniciales: any[]
  areas:                   any[]
}

const ESTATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  atendido:  { label: 'Atendido',  color: '#10B981', bg: '#D1FAE5' },
  demorado:  { label: 'Demorado',  color: '#E24B4A', bg: '#FEE2E2' },
}

export default function ChatsLayout({ conversacionesIniciales, areas }: Props) {
  const searchParams       = useSearchParams()
  const convParam          = searchParams.get('conv')
  const supabase           = createClient()

  const [conversaciones,   setConversaciones]   = useState(conversacionesIniciales)
  const [convSeleccionada, setConvSeleccionada] = useState<any | null>(null)
  const [filtroArea,       setFiltroArea]       = useState<string>('todas')
  const [filtroEstatus,    setFiltroEstatus]    = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  const [modalNueva,    setModalNueva]    = useState(false)
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevoNombre,   setNuevoNombre]   = useState('')
  const [iniciando,     setIniciando]     = useState(false)
  
  const [convExistente, setConvExistente] = useState<any | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)
  const [directorioAbierto, setDirectorioAbierto] = useState(false)

  useEffect(() => {
    if (convParam && conversacionesIniciales.length > 0) {
      const conv = conversacionesIniciales.find(c => c.id === convParam)
      if (conv) setConvSeleccionada(conv)
    }
  }, [convParam, conversacionesIniciales])

  useEffect(() => {
    const channel = supabase
      .channel('chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones_wa' },
        async payload => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('conversaciones_wa')
              .select('*, areas(nombre, color_hex)')
              .eq('id', payload.new.id).single()
            if (data) setConversaciones(prev => [data, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setConversaciones(prev => prev.map(c =>
              c.id === payload.new.id ? { ...c, ...payload.new } : c
            ).sort((a, b) => new Date(b.ultimo_mensaje_at).getTime() - new Date(a.ultimo_mensaje_at).getTime()))
            if (convSeleccionada?.id === payload.new.id) {
              setConvSeleccionada((prev: any) => ({ ...prev, ...payload.new }))
            }
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [convSeleccionada])


  useEffect(() => {
    const cached = sessionStorage.getItem('usuario_sistema')
    if (cached) {
      const u = JSON.parse(cached)
      setEsAdmin(['admin', 'notario', 'asistente'].includes(u.rol))
      return
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('usuarios_sistema').select('rol').eq('email', user.email || '').single()
      if (data) setEsAdmin(['admin', 'notario', 'asistente'].includes(data.rol))
    })
  }, [])

  
  async function cambiarEstatus(convId: string, estatus: string) {
    await supabase.from('conversaciones_wa').update({ estatus }).eq('id', convId)
    setConversaciones(prev => prev.map(c => c.id === convId ? { ...c, estatus } : c))
    if (convSeleccionada?.id === convId) {
      setConvSeleccionada((prev: any) => ({ ...prev, estatus }))
    }
  }

  async function iniciarConversacion() {
    if (!nuevoTelefono.trim()) return
    setIniciando(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/twilio/nueva-conversacion`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: nuevoTelefono.trim(),
          nombre:   nuevoNombre.trim() || nuevoTelefono.trim(),
        }),
      })
      if (!res.ok) throw new Error('Error al iniciar')
      const conv = await res.json()
      setConversaciones(prev => [conv, ...prev])
      setConvSeleccionada(conv)
      setModalNueva(false)
      setNuevoTelefono('')
      setNuevoNombre('')
    } catch (e) {
      alert('Error al iniciar conversación')
    } finally {
      setIniciando(false)
    }
  }

  async function verificarNumero(tel: string) {
    if (tel.length < 8) { setConvExistente(null); return }
    setVerificando(true)
    try {
      const telNorm = tel.replace(/\s|-/g, '')
      const found   = conversaciones.find(c => 
        c.telefono?.replace('+521', '+52').replace(/\s/g, '').includes(telNorm) ||
        telNorm.includes(c.telefono?.replace('+521', '+52').replace(/\s/g, '').slice(-8) || '')
      )
      setConvExistente(found || null)
    } finally {
      setVerificando(false)
    }
  }

  const convFiltradas = conversaciones.filter(c => {
    if (filtroArea    !== 'todas' && c.area_id !== filtroArea) return false
    if (filtroEstatus !== 'todos' && (c.estatus || 'pendiente') !== filtroEstatus) return false
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      const nombre   = (c.nombre || '').toLowerCase()
      const telefono = (c.telefono || '').toLowerCase()
      if (!nombre.includes(q) && !telefono.includes(q)) return false
    }
    return true
  })

  const totalNoLeidos = conversaciones.reduce((acc, c) => acc + (c.no_leidos || 0), 0)
  const countPendiente = conversaciones.filter(c => (c.estatus || 'pendiente') === 'pendiente').length
  const countDemorado  = conversaciones.filter(c => c.estatus === 'demorado').length

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 overflow-hidden rounded-2xl"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      {/* Panel izquierdo */}
      <div className="flex-shrink-0 flex flex-col"
        style={{ width: '400px', borderRight: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] font-bold" style={{ color: '#111' }}>
              Chats WhatsApp
            </div>
            <div className="flex items-center gap-2">
              {totalNoLeidos > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#25D366' }}>
                  {totalNoLeidos} nuevos
                </span>
              )}
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="flex gap-2 mb-3">
            {[
              { label: 'Pendientes', count: countPendiente, color: '#F59E0B', bg: '#FEF3C7' },
              { label: 'Demorados',  count: countDemorado,  color: '#E24B4A', bg: '#FEE2E2' },
              { label: 'Total',      count: conversaciones.length, color: '#185FA5', bg: '#E6F1FB' },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-xl px-2 py-1.5 text-center"
                style={{ background: s.bg }}>
                <div className="text-[16px] font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[9px] font-medium" style={{ color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative mb-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#9C9890' }}>🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o número..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
              style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
            />
          </div>

          {/* Filtro estatus */}
          <div className="flex gap-1.5">
            {[
              { id: 'todos',     label: 'Todos'     },
              { id: 'pendiente', label: '🟡 Pendiente' },
              { id: 'demorado',  label: '🔴 Demorado'  },
              { id: 'atendido',  label: '🟢 Atendido'  },
            ].map(f => (
              <button key={f.id} onClick={() => setFiltroEstatus(f.id)}
                className="flex-1 py-1 rounded-lg text-[10px] font-medium cursor-pointer border-none transition-all"
                style={{
                  background: filtroEstatus === f.id ? '#111' : '#F3F4F6',
                  color:      filtroEstatus === f.id ? '#fff' : '#666',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 p-3"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
          <button onClick={() => setDirectorioAbierto(!directorioAbierto)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-bold cursor-pointer border-none transition-all"
            style={{ background: directorioAbierto ? '#111' : '#F3F4F6', color: directorioAbierto ? '#fff' : '#666' }}>
            📋 Directorio Notaria
          </button>
        </div>

        {/* Filtro por área — solo admins */}
        {esAdmin && (
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <button onClick={() => setFiltroArea('todas')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border-none flex-shrink-0 transition-all"
              style={{ background: filtroArea === 'todas' ? '#111' : '#F3F4F6', color: filtroArea === 'todas' ? '#fff' : '#666' }}>
              Todas
            </button>
            {areas.map(a => (
              <button key={a.id} onClick={() => setFiltroArea(a.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border-none flex-shrink-0 transition-all"
                style={{ background: filtroArea === a.id ? a.color_hex : '#F3F4F6', color: filtroArea === a.id ? '#fff' : '#666' }}>
                {a.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Count filtrado */}
        <div className="px-4 py-1.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#FAFAF8' }}>
          <span className="text-[11px]" style={{ color: '#9C9890' }}>
            {convFiltradas.length} conversación{convFiltradas.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          <ListaConversaciones
            conversaciones={convFiltradas}
            seleccionada={convSeleccionada?.id}
            onSelect={conv => {
              setConvSeleccionada(conv)
              if (conv.no_leidos > 0) {
                supabase.from('conversaciones_wa').update({ no_leidos: 0 }).eq('id', conv.id)
                setConversaciones(prev => prev.map(c => c.id === conv.id ? { ...c, no_leidos: 0 } : c))
              }
            }}
            onCambiarEstatus={cambiarEstatus}
          />
        </div>
        {/* Botón nueva conversación — flotante abajo */}
        <div className="flex-shrink-0 p-3"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
          <button onClick={() => setModalNueva(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-bold cursor-pointer border-none transition-all"
            style={{
              background:   '#25D366',
              color:        '#fff',
              boxShadow:    '0 4px 12px rgba(37,211,102,0.3)',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Nueva conversación
          </button>
        </div>
      </div>

      {/* Panel derecho — Chat + Directorio */}
      <div className="flex-1 flex" style={{ minWidth: 0 }}>

        {/* Vista del chat */}
        <div className="flex-1 flex flex-col" style={{ background: '#F7F7F5', minWidth: 0 }}>
          {convSeleccionada ? (
            <VistaChat
              conversacion={convSeleccionada}
              onMensajeEnviado={() => {}}
              onCambiarEstatus={(estatus) => cambiarEstatus(convSeleccionada.id, estatus)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div style={{ fontSize: 56 }}>💬</div>
              <div>
                <div className="text-[16px] font-bold text-center mb-1" style={{ color: '#333' }}>
                  Selecciona una conversación
                </div>
                <div className="text-[13px] text-center" style={{ color: '#9C9890' }}>
                  Los mensajes de WhatsApp aparecen aquí en tiempo real
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                {[
                  { emoji: '🟡', label: `${countPendiente} pendientes` },
                  { emoji: '🔴', label: `${countDemorado} demorados`  },
                ].filter(s => parseInt(s.label) > 0).map(s => (
                  <div key={s.label} className="px-3 py-1.5 rounded-xl text-[12px]"
                    style={{ background: '#F3F4F6', color: '#666' }}>
                    {s.emoji} {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel directorio */}
        {directorioAbierto && (
          <div className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ width: 260, borderLeft: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>

            <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="text-[13px] font-bold pt-6" style={{ color: '#111' }}>Directorio WhatsApp</div>
              <button onClick={() => setDirectorioAbierto(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border-none text-[11px] pt-6"
                style={{ background: '#F3F4F6', color: '#666' }}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {areas.filter((a: any) => a.numero_twilio).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: a.color_hex }} />
                      <span className="text-[12px] font-semibold" style={{ color: '#111' }}>{a.nombre}</span>
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: '#9C9890' }}>
                      {a.numero_twilio}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(a.numero_twilio)
                      const btn = document.getElementById(`copy-${a.id}`)
                      if (btn) {
                        btn.textContent = '✓ Copiado'
                        btn.style.background = '#EAF3DE'
                        btn.style.color = '#3B6D11'
                        setTimeout(() => {
                          btn.textContent = '📋 Copiar'
                          btn.style.background = '#F3F4F6'
                          btn.style.color = '#666'
                        }, 1500)
                      }
                    }}
                    id={`copy-${a.id}`}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none flex-shrink-0"
                    style={{ background: '#F3F4F6', color: '#666' }}>
                    📋 Copiar
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
              <div className="text-[10px] text-center" style={{ color: '#9C9890' }}>
                Clic en 📋 para copiar el número
              </div>
            </div>
          </div>
        )}

      </div>

      {modalNueva && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

            <div className="px-6 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div className="text-[15px] font-bold" style={{ color: '#111' }}>Nueva conversación</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
                  Se enviará un mensaje de bienvenida al cliente
                </div>
              </div>
              <button onClick={() => setModalNueva(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#666' }}>✕</button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-3">
              <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                    style={{ color: '#9C9890' }}>Número de WhatsApp</label>
                  <input type="text" value={nuevoTelefono}
                    onChange={e => {
                      setNuevoTelefono(e.target.value)
                      verificarNumero(e.target.value)
                    }}
                    placeholder="Ej: 4611234567 o +524611234567"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                    style={{ background: '#F7F7F5', border: `1px solid ${convExistente ? '#F59E0B' : 'rgba(0,0,0,0.08)'}`, color: '#111' }}
                    autoFocus />

                  {verificando && (
                    <div className="flex items-center gap-2 mt-1.5 text-[12px]" style={{ color: '#9C9890' }}>
                      <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: '#9C9890', borderTopColor: 'transparent' }} />
                      Verificando...
                    </div>
                  )}

                  {convExistente && !verificando && (() => {
                    const est     = convExistente.estatus || 'pendiente'
                    const estConf = ({
                      pendiente: { color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B', label: 'Pendiente' },
                      atendido:  { color: '#065F46', bg: '#D1FAE5', dot: '#10B981', label: 'Atendido'  },
                      demorado:  { color: '#991B1B', bg: '#FEE2E2', dot: '#E24B4A', label: 'Demorado'  },
                    } as any)[est] || { color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B', label: 'Pendiente' }
                    const area = convExistente.areas
                    return (
                      <div className="mt-2 rounded-xl overflow-hidden"
                        style={{ border: `1px solid ${estConf.dot}40` }}>
                        <div className="flex items-center gap-2 px-3 py-2" style={{ background: estConf.bg }}>
                          <span className="text-[14px]">⚠️</span>
                          <span className="text-[12px] font-bold" style={{ color: estConf.color }}>
                            Este número ya tiene una conversación activa
                          </span>
                        </div>
                        <div className="px-3 py-2.5 flex flex-col gap-1.5" style={{ background: '#FAFAF8' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium" style={{ color: '#666' }}>Nombre</span>
                            <span className="text-[12px] font-semibold" style={{ color: '#111' }}>
                              {convExistente.nombre || convExistente.telefono}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium" style={{ color: '#666' }}>Área</span>
                            <div className="flex items-center gap-1.5">
                              {area && <div className="w-2 h-2 rounded-full" style={{ background: area.color_hex }} />}
                              <span className="text-[12px] font-semibold" style={{ color: '#111' }}>
                                {area?.nombre || '—'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium" style={{ color: '#666' }}>Estado</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: estConf.bg, color: estConf.color }}>
                              {estConf.label}
                            </span>
                          </div>
                          {convExistente.ultimo_mensaje && (
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-medium flex-shrink-0" style={{ color: '#666' }}>
                                Último mensaje
                              </span>
                              <span className="text-[11px] truncate text-right" style={{ color: '#888', maxWidth: '60%' }}>
                                {convExistente.ultimo_mensaje}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 px-3 py-2.5"
                          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
                          <button onClick={() => {
                            setConvSeleccionada(convExistente)
                            setModalNueva(false)
                            setNuevoTelefono('')
                            setConvExistente(null)
                          }}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer border-none"
                            style={{ background: '#111', color: '#fff' }}>
                            Ver conversación →
                          </button>
                          <button onClick={() => setConvExistente(null)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer border-none"
                            style={{ background: '#F3F4F6', color: '#666' }}>
                            Ignorar
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: '#9C9890' }}>Nombre del cliente (opcional)</label>
                <input type="text" value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Juan García"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  onKeyDown={e => e.key === 'Enter' && iniciarConversacion()} />
              </div>
              <div className="px-3 py-2.5 rounded-xl text-[12px]"
                style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                💬 Se enviará el mensaje de bienvenida de N3 AI al cliente
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex gap-3 px-6 py-4">
                <button onClick={() => setModalNueva(false)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                  style={{ background: '#F3F4F6', color: '#444' }}>
                  Cancelar
                </button>
                <button onClick={iniciarConversacion}
                  disabled={!nuevoTelefono.trim() || iniciando}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                  style={{
                    background: nuevoTelefono.trim() && !iniciando ? '#25D366' : '#F3F4F6',
                    color:      nuevoTelefono.trim() && !iniciando ? '#fff' : '#9CA3AF',
                  }}>
                  {iniciando ? 'Enviando...' : '💬 Iniciar conversación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}