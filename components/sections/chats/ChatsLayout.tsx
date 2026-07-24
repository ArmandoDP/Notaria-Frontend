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
  const [busqueda,         setBusqueda]         = useState('')

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

  async function cambiarEstatus(convId: string, estatus: string) {
    await supabase.from('conversaciones_wa').update({ estatus }).eq('id', convId)
    setConversaciones(prev => prev.map(c => c.id === convId ? { ...c, estatus } : c))
    if (convSeleccionada?.id === convId) {
      setConvSeleccionada((prev: any) => ({ ...prev, estatus }))
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

        {/* Filtro por área */}
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
      </div>

      {/* Panel derecho */}
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
    </div>
  )
}