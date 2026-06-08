'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const supabase = createClient()
  const router   = useRouter()

  const [nombre,        setNombre]        = useState('')
  const [rol,           setRol]           = useState('')
  const [initials,      setInitials]      = useState('')
  const [notifs,        setNotifs]        = useState<any[]>([])
  const [panelAbierto,  setPanelAbierto]  = useState(false)
  const [usuarioId,     setUsuarioId]     = useState<string | null>(null)

  const rolLabel: Record<string, string> = {
    admin:            'Administrador',
    notario:          'Notario',
    notario_auxiliar: 'Aux. Notarial',
    recepcion:        'Recepción',
    area_lead:        'Líder de área',
    agente:           'Agente',
  }

  const tipoConfig: Record<string, { icon: string, color: string }> = {
    nuevo_ticket:    { icon: '📋', color: '#1B5FA5' },
    cambio_estado:   { icon: '🔄', color: '#854F0B' },
    documento_subido:{ icon: '📎', color: '#0F6E56' },
    wa_nuevo:        { icon: '💬', color: '#25D366' },
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('auth email:', user?.email)

      if (!user) return

      // Buscar usuario en usuarios_sistema — aquí está el rol real
      const { data: us, error } = await supabase
        .from('usuarios_sistema')
        .select('id, nombre, rol, areas(nombre)')
        .eq('email', user.email || '')
        .single()
      
      console.log('us:', us, 'error:', error)

      if (us) {
        const n = us.nombre || user.email || ''
        setNombre(n)
        setRol(us.rol)
        setInitials(n.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase())
        setUsuarioId(us.id)
        cargarNotifs(us.id)
      }
    }
    init()
  }, [])

  async function cargarNotifs(uid: string) {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifs(data)
  }

  // Realtime notificaciones
  useEffect(() => {
    if (!usuarioId) return

    const channel = supabase
      .channel(`notifs-${usuarioId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notificaciones',
        filter: `usuario_id=eq.${usuarioId}`,
      }, payload => {
        setNotifs(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [usuarioId])

  const noLeidas = notifs.filter(n => !n.leida).length

  async function marcarLeida(notif: any) {
    if (!notif.leida) {
      await supabase.from('notificaciones').update({ leida: true }).eq('id', notif.id)
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n))
    }
    if (notif.ticket_id) {
      setPanelAbierto(false)
      router.push(`/tickets/${notif.ticket_id}`)
    }
  }

  async function marcarTodasLeidas() {
    if (!usuarioId) return
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuarioId).eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return (
    <header className="h-[58px] flex items-center px-4 gap-3 flex-shrink-0"
      style={{ background: '#F2F1EE' }}>

      {/* Topbar pill izquierdo */}
      <div className="flex-1 flex items-center h-[40px] px-4 gap-2 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[12px]" style={{ color: '#B5B0AA' }}>Notaría No. 3</span>
        <span style={{ color: '#DDD' }}>/</span>
        <span className="text-[13px] font-semibold" style={{ color: '#1A1917' }}>Plataforma</span>
      </div>

      {/* Campana de notificaciones */}
      <div className="relative">
        <button
          onClick={() => setPanelAbierto(!panelAbierto)}
          className="relative w-[40px] h-[40px] rounded-2xl flex items-center justify-center cursor-pointer border-none transition-all"
          style={{ background: panelAbierto ? '#fff' : 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span className="text-[16px]">🔔</span>
          {noLeidas > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: '#E24B4A' }}>
              {noLeidas > 9 ? '9+' : noLeidas}
            </div>
          )}
        </button>

        {/* Panel de notificaciones */}
        {panelAbierto && (
          <>
            {/* Overlay para cerrar */}
            <div className="fixed inset-0 z-40" onClick={() => setPanelAbierto(false)} />

            <div className="absolute right-0 top-12 w-[360px] rounded-2xl overflow-hidden z-50"
              style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.08)' }}>

              {/* Header panel */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: '#111' }}>
                    Notificaciones
                    {noLeidas > 0 && (
                      <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: '#E24B4A' }}>
                        {noLeidas}
                      </span>
                    )}
                  </div>
                </div>
                {noLeidas > 0 && (
                  <button onClick={marcarTodasLeidas}
                    className="text-[11px] cursor-pointer border-none bg-transparent font-medium"
                    style={{ color: '#1B5FA5' }}>
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                {notifs.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-[28px] mb-2">🔔</div>
                    <div className="text-[13px]" style={{ color: '#9C9890' }}>Sin notificaciones</div>
                  </div>
                ) : (
                  notifs.map(n => {
                    const cfg = tipoConfig[n.tipo] || { icon: '📌', color: '#666' }
                    return (
                      <button key={n.id}
                        onClick={() => marcarLeida(n)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer border-none border-b transition-all hover:bg-gray-50"
                        style={{
                          background:  n.leida ? 'transparent' : '#F0F6FF',
                          borderColor: 'rgba(0,0,0,0.04)',
                        }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0"
                          style={{ background: `${cfg.color}15` }}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[12.5px] font-semibold leading-snug" style={{ color: '#111' }}>
                              {n.titulo}
                            </span>
                            {!n.leida && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                                style={{ background: '#1B5FA5' }} />
                            )}
                          </div>
                          {n.descripcion && (
                            <div className="text-[11.5px] mt-0.5 truncate" style={{ color: '#9C9890' }}>
                              {n.descripcion}
                            </div>
                          )}
                          <div className="text-[10px] mt-1" style={{ color: '#CCC' }}>
                            {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right pill */}
      <div className="flex items-center gap-3 h-[40px] px-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          style={{
            background: 'linear-gradient(135deg, rgba(184,130,10,0.12), rgba(240,192,64,0.12))',
            color: '#92650A',
            border: '1px solid rgba(184,130,10,0.2)',
          }}>
          {rolLabel[rol] || rol}
        </span>
        <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.08)' }} />
        <span className="text-[12.5px] font-medium" style={{ color: '#444' }}>{nombre}</span>
        <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-black text-black"
          style={{ background: 'linear-gradient(145deg, #B8820A, #F0C040)', boxShadow: '0 2px 8px rgba(184,130,10,0.35)' }}>
          {initials}
        </div>
      </div>
    </header>
  )
}