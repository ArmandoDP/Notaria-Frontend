'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePathname, useRouter } from 'next/navigation'

const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif'
const TINTA = '#111111'
const GRIS = '#6b6b6b'
const LINEA = '#e6e6e4'
const ROJO = '#b42318'

const ROL_LABEL: Record<string, string> = {
  admin:            'Administrador',
  notario:          'Notario',
  notario_auxiliar: 'Aux. Notarial',
  recepcion:        'Recepción',
  area_lead:        'Líder de área',
  agente:           'Agente',
  asistente:        'Asistente',
}

// Nombre de la página según la ruta
const PAGINAS: [string, string][] = [
  ['/chats',      'Chats WhatsApp'],
  ['/nueva',      'Nueva solicitud'],
  ['/dashboard',  'Tablero de control'],
  ['/folios',     'Buscar folios'],
  ['/tramites',   'Trámites'],
  ['/usuarios',   'Usuarios y permisos'],
  ['/config',     'Configuración'],
  ['/tickets',    'Detalle del ticket'],
  ['/notaria-ai', 'Notaría AI'],
]
function nombrePagina(ruta: string) {
  if (ruta === '/') return 'Tablero de solicitudes'
  return PAGINAS.find(([prefijo]) => ruta.startsWith(prefijo))?.[1] || 'Plataforma'
}

// Íconos de línea por tipo de notificación
const ICONOS_TIPO: Record<string, string> = {
  nuevo_ticket:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  cambio_estado:    'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',
  documento_subido: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  doc_validado:     'M5 12l5 5L20 7',
  doc_rechazado:    'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  parte_completa:   'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
  wa:               'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z',
  info:             'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  asesor_urgente:   'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
}
const esWA = (tipo?: string) => !!tipo && tipo.startsWith('wa')

function IconoNotif({ tipo, size = 16 }: { tipo?: string; size?: number }) {
  const d = esWA(tipo) ? ICONOS_TIPO.wa : ICONOS_TIPO[tipo || ''] || ICONOS_TIPO.info
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const pill: React.CSSProperties = {
  background: '#ffffff',
  border: `1px solid ${LINEA}`,
  borderRadius: 10,
}

export default function Topbar() {
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [nombre,       setNombre]       = useState('')
  const [rol,          setRol]          = useState('')
  const [initials,     setInitials]     = useState('')
  const [notifs,       setNotifs]       = useState<any[]>([])
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [usuarioId,    setUsuarioId]    = useState<string | null>(null)
  const [popupNotif,   setPopupNotif]   = useState<any | null>(null)
  const [popupUrgente, setPopupUrgente] = useState<any | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/notification_wa.wav')
    audioRef.current.volume = 0.8
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: us } = await supabase
        .from('usuarios_sistema')
        .select('id, nombre, rol, areas(nombre)')
        .eq('email', user.email || '')
        .single()
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

  // Tiempo real
  useEffect(() => {
    if (!usuarioId) return
    const channel = supabase
      .channel(`notifs-${usuarioId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}`,
      }, (payload: any) => {
        const nueva = payload.new
        setNotifs(prev => [nueva, ...prev])
        audioRef.current?.play().catch(() => {})
        if (nueva.tipo === 'asesor_urgente') {
          setPopupUrgente(nueva)
        } else {
          setPopupNotif(nueva)
          setTimeout(() => setPopupNotif(null), 5000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [usuarioId])

  const noLeidas = notifs.filter(n => !n.leida).length

  async function marcarLeida(notif: any) {
    if (!notif.leida) {
      await supabase.from('notificaciones').update({ leida: true }).eq('id', notif.id)
      setNotifs(prev => prev.map(n => (n.id === notif.id ? { ...n, leida: true } : n)))
    }
    setPanelAbierto(false)
    if (notif.ticket_id) router.push(`/tickets/${notif.ticket_id}`)
    else if (esWA(notif.tipo)) router.push('/chats')
  }

  async function marcarTodasLeidas() {
    if (!usuarioId) return
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuarioId).eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return (
    <header className="h-[58px] flex items-center px-4 gap-3 flex-shrink-0" style={{ background: '#F2F1EE' }}>
      <style>{`
        @keyframes tbSlide { from { transform: translateX(110%); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes tbProgress { from { width: 100% } to { width: 0% } }
        @keyframes tbPop { from { transform: scale(.96) translateY(6px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes tbShake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-6px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(4px) } }
        @keyframes tbPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(180,35,24,.45) } 70% { box-shadow: 0 0 0 14px rgba(180,35,24,0) } }
        @media (prefers-reduced-motion: reduce) { .tb-anim { animation: none !important } }
      `}</style>

      {/* Migas: Notaría / página */}
      <div className="flex-1 min-w-0 flex items-center h-[40px] px-4 gap-2.5" style={pill}>
        <span className="text-[14px] whitespace-nowrap" style={{ fontFamily: SERIF, fontWeight: 600, color: TINTA }}>
          Notaría No. 3
        </span>
        <span style={{ color: '#cfcfcc' }}>/</span>
        <span className="text-[13px] font-medium truncate" style={{ color: GRIS }}>{nombrePagina(pathname)}</span>
      </div>

      {/* Campana */}
      <div className="relative">
        <button
          onClick={() => setPanelAbierto(!panelAbierto)}
          className="relative w-[40px] h-[40px] flex items-center justify-center cursor-pointer transition-colors"
          style={{ ...pill, background: panelAbierto ? '#f6f6f5' : '#fff', color: TINTA }}
          aria-label="Notificaciones"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {noLeidas > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: ROJO, border: '2px solid #F2F1EE' }}>
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {panelAbierto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPanelAbierto(false)} />
            <div className="absolute right-0 top-12 w-[370px] overflow-hidden z-50 tb-anim"
              style={{ background: '#fff', borderRadius: 12, border: `1px solid ${LINEA}`, boxShadow: '0 16px 40px rgba(0,0,0,0.12)', animation: 'tbPop .18s ease-out' }}>

              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${LINEA}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[16px]" style={{ fontFamily: SERIF, fontWeight: 600, color: TINTA }}>Notificaciones</span>
                  {noLeidas > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: ROJO }}>{noLeidas}</span>
                  )}
                </div>
                {noLeidas > 0 && (
                  <button onClick={marcarTodasLeidas}
                    className="text-[11.5px] cursor-pointer border-none bg-transparent font-medium underline underline-offset-2"
                    style={{ color: GRIS }}>
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
                {notifs.length === 0 ? (
                  <div className="text-center py-12 text-[13px]" style={{ color: '#a3a3a3' }}>Sin notificaciones</div>
                ) : (
                  notifs.map(n => {
                    const urgente = n.tipo === 'asesor_urgente' || n.tipo === 'doc_rechazado'
                    return (
                      <button key={n.id}
                        onClick={() => marcarLeida(n)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer border-none transition-colors hover:bg-[#f7f7f6]"
                        style={{ background: n.leida ? '#fff' : '#fafaf9', borderBottom: '1px solid #f1f1ef' }}>
                        <span className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderRadius: 8,
                            background: urgente ? '#fdf1f0' : n.leida ? '#f1f1ef' : TINTA,
                            color: urgente ? ROJO : n.leida ? GRIS : '#fff',
                          }}>
                          <IconoNotif tipo={n.tipo} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-[12.5px] leading-snug" style={{ color: TINTA, fontWeight: n.leida ? 500 : 700 }}>
                              {n.titulo}
                            </span>
                            {!n.leida && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: TINTA }} />}
                          </span>
                          {n.descripcion && (
                            <span className="block text-[11.5px] mt-0.5 truncate" style={{ color: GRIS }}>{n.descripcion}</span>
                          )}
                          <span className="block text-[10.5px] mt-1" style={{ color: '#a3a3a3' }}>
                            {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Usuario */}
      <div className="flex items-center gap-3 h-[40px] pl-3 pr-1.5" style={pill}>
        {rol && (
          <span className="px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
            style={{ background: '#f1f1ef', color: '#3a3a3a', borderRadius: 6 }}>
            {ROL_LABEL[rol] || rol}
          </span>
        )}
        <span className="text-[12.5px] font-medium whitespace-nowrap hidden sm:inline" style={{ color: TINTA }}>{nombre}</span>
        <span className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10.5px] font-bold text-white"
          style={{ background: TINTA }}>
          {initials}
        </span>
      </div>

      {/* Aviso flotante */}
      {popupNotif && (
        <div className="fixed z-50 flex items-start gap-3 overflow-hidden tb-anim"
          style={{
            top: 70, right: 16, width: 360, background: '#fff', borderRadius: 12, padding: '14px 14px 16px',
            border: `1px solid ${LINEA}`, boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
            animation: 'tbSlide .3s cubic-bezier(.2,.9,.3,1.1)',
          }}>
          <span className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 8, background: TINTA, color: '#fff' }}>
            <IconoNotif tipo={popupNotif.tipo} size={18} />
          </span>
          <div className="flex-1 min-w-0">
            {esWA(popupNotif.tipo) && (
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: GRIS }}>WhatsApp</div>
            )}
            <div className="text-[13px] font-bold truncate" style={{ color: TINTA }}>{popupNotif.titulo}</div>
            {popupNotif.descripcion && (
              <div className="text-[12px] truncate" style={{ color: GRIS }}>{popupNotif.descripcion}</div>
            )}
          </div>
          <button onClick={() => setPopupNotif(null)}
            className="w-6 h-6 flex items-center justify-center cursor-pointer border-none flex-shrink-0 text-[11px]"
            style={{ background: '#f1f1ef', color: GRIS, borderRadius: 6 }} aria-label="Cerrar">✕</button>
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#f1f1ef' }}>
            <div className="tb-anim" style={{ height: '100%', background: TINTA, animation: 'tbProgress 5s linear forwards' }} />
          </div>
        </div>
      )}

      {/* Alerta urgente: cliente pide asesor */}
      {popupUrgente && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ background: 'rgba(17,17,17,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="mx-4 overflow-hidden tb-anim"
            style={{
              background: '#fff', maxWidth: 420, width: '100%', borderRadius: 14,
              boxShadow: '0 24px 70px rgba(0,0,0,0.3)', animation: 'tbShake .5s ease-in-out 2',
            }}>
            <div className="px-6 pt-6 pb-5" style={{ borderTop: `5px solid ${ROJO}` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-full flex items-center justify-center tb-anim"
                  style={{ background: ROJO, color: '#fff', animation: 'tbPulse 1.6s infinite' }}>
                  <IconoNotif tipo="asesor_urgente" size={20} />
                </span>
                <div>
                  <div className="text-[19px]" style={{ fontFamily: SERIF, fontWeight: 600, color: TINTA }}>Cliente solicita asesor</div>
                  <div className="text-[12px]" style={{ color: ROJO, fontWeight: 600 }}>Atención inmediata · WhatsApp de Recepción</div>
                </div>
              </div>
              <div className="px-4 py-3 text-[13px] font-medium" style={{ background: '#fafaf9', border: `1px solid ${LINEA}`, borderRadius: 8, color: TINTA }}>
                {popupUrgente.descripcion}
              </div>
              <div className="flex gap-3 mt-4">
                <a href="/chats" onClick={() => setPopupUrgente(null)}
                  className="flex-1 py-3 text-[14px] font-semibold text-center no-underline"
                  style={{ background: ROJO, color: '#fff', borderRadius: 8 }}>
                  Atender ahora
                </a>
                <button onClick={() => setPopupUrgente(null)}
                  className="px-5 py-3 text-[13px] font-semibold cursor-pointer border-none"
                  style={{ background: '#f1f1ef', color: '#3a3a3a', borderRadius: 8 }}>
                  Cerrar
                </button>
              </div>
              <div className="text-[11px] text-center mt-3" style={{ color: '#a3a3a3' }}>
                Esta alerta no desaparece hasta que la atiendas o la cierres
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}