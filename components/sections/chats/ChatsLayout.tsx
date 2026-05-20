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

export default function ChatsLayout({ conversacionesIniciales, areas }: Props) {
  const searchParams       = useSearchParams()
  const convParam          = searchParams.get('conv')
  const supabase           = createClient()
  const [conversaciones,   setConversaciones]   = useState(conversacionesIniciales)
  const [convSeleccionada, setConvSeleccionada] = useState<any | null>(null)
  const [filtroArea,       setFiltroArea]       = useState<string>('todas')

  // Abrir conversación directamente desde URL
  useEffect(() => {
    if (convParam && conversacionesIniciales.length > 0) {
      const conv = conversacionesIniciales.find(c => c.id === convParam)
      if (conv) setConvSeleccionada(conv)
    }
  }, [convParam, conversacionesIniciales])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('chats-realtime')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'conversaciones_wa',
      }, async payload => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('conversaciones_wa')
            .select('*, areas(nombre, color_hex)')
            .eq('id', payload.new.id)
            .single()
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

  const convFiltradas  = conversaciones.filter(c => filtroArea === 'todas' || c.area_id === filtroArea)
  const totalNoLeidos  = conversaciones.reduce((acc, c) => acc + (c.no_leidos || 0), 0)

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 overflow-hidden rounded-2xl"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      {/* Panel izquierdo */}
      <div className="flex-shrink-0 flex flex-col"
        style={{ width: '320px', borderRight: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>

        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
          <div>
            <div className="text-[14px] font-bold" style={{ color: '#111' }}>
              Chats WhatsApp
              {totalNoLeidos > 0 && (
                <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#25D366' }}>
                  {totalNoLeidos}
                </span>
              )}
            </div>
            <div className="text-[11px]" style={{ color: '#9C9890' }}>
              {convFiltradas.length} conversaciones
            </div>
          </div>
        </div>

        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto"
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
          />
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col" style={{ background: '#F7F7F5' }}>
        {convSeleccionada ? (
          <VistaChat conversacion={convSeleccionada} onMensajeEnviado={() => {}} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-[48px]">💬</div>
            <div className="text-[15px] font-semibold" style={{ color: '#333' }}>Selecciona una conversación</div>
            <div className="text-[13px]" style={{ color: '#9C9890' }}>Los mensajes de WhatsApp aparecen aquí en tiempo real</div>
          </div>
        )}
      </div>
    </div>
  )
}