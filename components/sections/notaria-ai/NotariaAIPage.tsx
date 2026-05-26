'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AISidebar    from './AISidebar'
import AIBienvenida from './AIBienvenida'
import AIMensajes   from './AIMensajes'
import AIInput      from './AIInput'

interface Mensaje {
  role:    'user' | 'assistant'
  content: string
}

export default function NotariaAIPage() {
  const router       = useRouter()
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const ticketId     = searchParams.get('ticket')

  const [historial,       setHistorial]       = useState<Mensaje[]>([])
  const [input,           setInput]           = useState('')
  const [cargando,        setCargando]        = useState(false)
  const [contexto,        setContexto]        = useState<any>(null)
  const [conversaciones,  setConversaciones]  = useState<any[]>([])
  const [convActiva,      setConvActiva]      = useState<string | null>(null)
  const [usuarioId,       setUsuarioId]       = useState<string | null>(null)
  const [nombreUsuario,   setNombreUsuario]   = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  // Cargar usuario
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const nombre = user.user_metadata?.nombre || user.email || ''
      setNombreUsuario(nombre)
      const { data: us } = await supabase.from('usuarios_sistema').select('id').eq('email', user.email).single()
      if (us) {
        setUsuarioId(us.id)
        cargarConversaciones(us.id)
      }
    })
  }, [])

  // Si viene con ticket, crear conversación automática
  useEffect(() => {
    if (!ticketId || !usuarioId) return
    crearConversacion(`Ticket ${ticketId}`, ticketId).then(conv => {
      if (conv) {
        setCargando(true)
        enviarMensaje('Dame un resumen rápido del estado del expediente de este ticket.', conv.id)
      }
    })
  }, [ticketId, usuarioId])

  async function cargarConversaciones(uid: string) {
    
    const res = await fetch(`${API}/api/chat/conversaciones/${uid}`)
    if (res.ok) setConversaciones(await res.json())
  }

    async function fijarConversacion(id: string) {
        const conv  = conversaciones.find(c => c.id === id)
        const nuevo = !conv?.fijada
        await fetch(`${API}/api/chat/conversacion/${id}/fijar`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ fijada: nuevo }),
        })
        setConversaciones(prev => prev.map(c => c.id === id ? { ...c, fijada: nuevo } : c))
        }

    async function renombrarConversacion(id: string, titulo: string) {
    if (!titulo.trim()) return
    await fetch(`${API}/api/chat/conversacion/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ titulo }),
    })
    setConversaciones(prev => prev.map(c => c.id === id ? { ...c, titulo } : c))
    }

  async function crearConversacion(titulo: string, tickId?: string) {
    if (!usuarioId) return null
    
    const res = await fetch(`${API}/api/chat/conversacion`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuario_id: usuarioId, titulo, ticket_id: tickId || null }),
    })
    if (!res.ok) return null
    const conv = await res.json()
    setConversaciones(prev => [conv, ...prev])
    setConvActiva(conv.id)
    setHistorial([])
    return conv
  }

  async function seleccionarConversacion(conv: any) {
    setConvActiva(conv.id)
    setContexto(null)
    
    console.log('API URL:', API, 'Conv ID:', conv.id)
      
    const res = await fetch(`${API}/api/chat/conversacion/${conv.id}/mensajes`)
    if (res.ok) {
      const msgs = await res.json()
      setHistorial(msgs.map((m: any) => ({ role: m.role, content: m.content })))
    }
  }

  async function eliminarConversacion(id: string) {
    await fetch(`${API}/api/chat/conversacion/${id}`, { method: 'DELETE' })
    setConversaciones(prev => prev.filter(c => c.id !== id))
    if (convActiva === id) {
      setConvActiva(null)
      setHistorial([])
    }
  }

  async function nuevaConversacion() {
    const conv = await crearConversacion('Nueva conversación')
    if (conv) setHistorial([])
  }

  async function enviarMensaje(texto?: string, convId?: string) {
    const msg   = texto || input.trim()
    const cId   = convId || convActiva
    if (!msg || cargando) return

    // Si no hay conversación activa, crear una
    let idUsar = cId
    if (!idUsar) {
      const conv = await crearConversacion(msg.slice(0, 50))
      if (!conv) return
      idUsar = conv.id
    }

    // Actualizar título si es el primer mensaje
    const convActualObj = conversaciones.find(c => c.id === idUsar)
    if (convActualObj?.titulo === 'Nueva conversación') {
      await fetch(`${API}/api/chat/conversacion/${idUsar}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ titulo: msg.slice(0, 50) }),
      })
      setConversaciones(prev => prev.map(c => c.id === idUsar ? { ...c, titulo: msg.slice(0, 50) } : c))
    }

    const nuevoHistorial: Mensaje[] = [...historial, { role: 'user', content: msg }]
    setHistorial(nuevoHistorial)
    setInput('')
    setCargando(true)

    try {
      const res = await fetch(`${API}/api/chat/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mensaje:         msg,
          historial:       historial.map(m => ({ role: m.role, content: m.content })),
          ticket_id:       ticketId || null,
          conversacion_id: idUsar,
          usuario_id:      usuarioId,
        }),
      })
      const data = await res.json()
      if (data.contexto && !contexto) setContexto(data.contexto)
      setHistorial([...nuevoHistorial, { role: 'assistant', content: data.respuesta }])
    } catch {
      setHistorial([...nuevoHistorial, { role: 'assistant', content: 'Ocurrió un error. Intenta de nuevo.' }])
    } finally {
      setCargando(false)
    }
  }
  

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#F8F7FC' }}>

      {/* Sidebar */}
      <AISidebar
        conversaciones={conversaciones}
        convActiva={convActiva}
        onSeleccionar={seleccionarConversacion}
        onNueva={nuevaConversacion}
        onEliminar={eliminarConversacion}
        onVolver={() => router.push('/')}
        buscando={false}
        onFijar={fijarConversacion}
        onRenombrar={renombrarConversacion}
      />

      {/* Panel principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header mínimo con contexto */}
        {contexto && (
          <div className="flex items-center gap-2 px-6 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B4F8E4', boxShadow: '0 0 6px #B4F8E4' }} />
            <span className="text-[11px]" style={{ color: '#666' }}>
              Contexto: {contexto.numero} · {contexto.tramite} · {contexto.area}
            </span>
          </div>
        )}

        {/* Chat o bienvenida */}
        {historial.length === 0 && !cargando ? (
        <div className="flex-1 overflow-hidden">
            <AIBienvenida
            onSugerencia={enviarMensaje}
            nombreUsuario={nombreUsuario}
            input={input}
            cargando={cargando}
            onChange={setInput}
            onEnviar={() => enviarMensaje()}
            />
        </div>
        ) : (
        <>
            <AIMensajes historial={historial} cargando={cargando} />
            <AIInput
            input={input}
            cargando={cargando}
            onChange={setInput}
            onEnviar={() => enviarMensaje()}
            hayMensajes={true}
            />
        </>
        )}
      </div>
    </div>
  )
}
