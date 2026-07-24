'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const supabase = createClient()
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [nombre,        setNombre]        = useState('')
  const [rol,           setRol]           = useState('')
  const [initials,      setInitials]      = useState('')
  const [notifs,        setNotifs]        = useState<any[]>([])
  const [panelAbierto,  setPanelAbierto]  = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [popupNotif, setPopupNotif] = useState<any | null>(null)

  const rolLabel: Record<string, string> = {
    admin:            'Administrador',
    notario:          'Notario',
    notario_auxiliar: 'Aux. Notarial',
    recepcion:        'Recepción',
    area_lead:        'Líder de área',
    agente:           'Agente',
  }

  const tipoConfig: Record<string, { icon: string, color: string }> = {
    nuevo_ticket:     { icon: '📋', color: '#1B5FA5' },
    cambio_estado:    { icon: '🔄', color: '#854F0B' },
    documento_subido: { icon: '📎', color: '#0F6E56' },
    doc_validado:     { icon: '✅', color: '#3B6D11' },
    doc_rechazado:    { icon: '⚠️', color: '#991B1B' },
    parte_completa:   { icon: '📦', color: '#185FA5' },
    wa_recibido:      { icon: '💬', color: '#25D366' },
    wa_nuevo:         { icon: '💬', color: '#25D366' },
    wa_enviado:       { icon: '📤', color: '#0F6E56' },
    info:             { icon: '📌', color: '#534AB7' },
  }

  useEffect(() => {
    audioRef.current = new Audio('/notification_wa.wav')
    audioRef.current.volume = 0.8
  }, [])

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
          const nueva = payload.new
          setNotifs(prev => [nueva, ...prev])

          // Sonido
          audioRef.current?.play().catch(() => {})

          // Popup
          setPopupNotif(nueva)
          setTimeout(() => setPopupNotif(null), 5000)
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
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: n.tipo?.startsWith('wa') ? '#25D366' : `${cfg.color}15` }}>
                          {n.tipo?.startsWith('wa') ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          ) : cfg.icon}
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
      {/* Popup de notificación */}
      {popupNotif && (() => {
        const esWA     = popupNotif.tipo === 'wa_recibido' || popupNotif.tipo === 'wa_nuevo'
        const cfg      = tipoConfig[popupNotif.tipo] || { icon: '📌', color: '#666' }
        return (
          <div
            className="fixed z-50 flex items-start gap-3"
            style={{
              top: 70, right: 16,
              width: 360,
              background: '#fff',
              borderRadius: 16,
              padding: '14px 16px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              border: `1px solid ${esWA ? 'rgba(37,211,102,0.3)' : 'rgba(0,0,0,0.08)'}`,
              animation: 'slideInRight 0.3s cubic-bezier(.34,1.2,.64,1)',
            }}>

            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(120%); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
              }
            `}</style>

            {/* Icono WhatsApp oficial */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: esWA ? '#25D366' : `${cfg.color}15` }}>
              {esWA ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              ) : (
                <span className="text-[18px]">{cfg.icon}</span>
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              {esWA && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#25D366' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#25D366' }}>
                    WhatsApp
                  </span>
                </div>
              )}
              <div className="text-[13px] font-bold mb-0.5 truncate" style={{ color: '#111' }}>
                {popupNotif.titulo}
              </div>
              {popupNotif.descripcion && (
                <div className="text-[12px] truncate" style={{ color: '#555' }}>
                  {popupNotif.descripcion}
                </div>
              )}
            </div>

            {/* Cerrar */}
            <button onClick={() => setPopupNotif(null)}
              className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border-none flex-shrink-0 text-[11px]"
              style={{ background: '#F3F4F6', color: '#666' }}>
              ✕
            </button>

            {/* Barra de progreso */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
              <div style={{
                height: '100%',
                background: esWA ? '#25D366' : cfg.color,
                animation: 'progress 5s linear forwards',
              }} />
            </div>
            <style>{`
              @keyframes progress { from { width: 100% } to { width: 0% } }
            `}</style>
          </div>
        )
      })()}
    </header>
  )
}