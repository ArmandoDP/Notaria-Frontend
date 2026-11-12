'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import ModalConfirm from '@/components/ui/ModalConfirm'
import ModalSinAcceso from '../ui/ModalSinAcceso'

// ─── Íconos de línea ─────────────────────────────────────────────────────────
const ICONOS: Record<string, string> = {
  tablero:  'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  nueva:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6',
  chats:    'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z',
  control:  'M3 3v18h18M7 16v-4M12 16V8M17 16v-7',
  folios:   'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  tramites: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  usuarios: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  config:   'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ai:       'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6z',
  salir:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  candado:  'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  mas:      'M12 5v14M5 12h14',
  chevron:  'M9 18l6-6-6-6',
}

function Icono({ nombre, size = 20 }: { nombre: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONOS[nombre]} />
    </svg>
  )
}

const SECCIONES = [
  {
    titulo: 'Operación',
    items: [
      { href: '/',       label: 'Tablero de Solicitudes', icon: 'tablero' },
      { href: '/nueva',  label: 'Nueva solicitud',        icon: 'nueva' },
      { href: '/chats',  label: 'Chats WhatsApp',         icon: 'chats' },
    ],
  },
  {
    titulo: 'Reportes',
    items: [
      { href: '/dashboard', label: 'Tablero de Control', icon: 'control' },
      { href: '/folios',    label: 'Buscar folios',      icon: 'folios' },
    ],
  },
]

const CONFIG_ITEMS = [
  { href: '/usuarios', label: 'Usuarios y permisos', icon: 'usuarios', accion: 'gestionar usuarios y permisos' },
  { href: '/config',   label: 'Configuración',       icon: 'config',   accion: 'acceder a la configuración' },
]

const ROL_LABEL: Record<string, string> = {
  admin:            'Administrador',
  notario:          'Notario',
  notario_auxiliar: 'Aux. Notarial',
  recepcion:        'Recepción',
  area_lead:        'Líder de área',
  agente:           'Agente',
  asistente:        'Asistente',
}

const BLANCO = '#ffffff'
const ROJO = '#b42318'
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif'
const RIEL = 64
const ABIERTO = 256

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [abierto, setAbierto] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [tramites,         setTramites]         = useState<any[]>([])
  const [tramitesExpanded, setTramitesExpanded] = useState(pathname.startsWith('/tramites'))
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string; letras: string; area?: string } | null>(null)
  const [chatsSinLeer, setChatsSinLeer] = useState(0)

  const [modalEliminar,  setModalEliminar]  = useState<{ id: string; nombre: string } | null>(null)
  const [modalSinAcceso, setModalSinAcceso] = useState<string | null>(null)
  const [modalLogout,    setModalLogout]    = useState(false)

  useEffect(() => {
    supabase.from('tramites_config').select('id, nombre, color_hex, slug').order('nombre')
      .then(({ data }: any) => { if (data) setTramites(data) })

    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return
      const { data: us } = await supabase
        .from('usuarios_sistema')
        .select('nombre, rol, areas(nombre)')
        .eq('email', user.email || '')
        .single()
      if (us) {
        const letras = us.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        setUsuario({ nombre: us.nombre, rol: us.rol, letras, area: (us.areas as any)?.nombre })
      }
    })
  }, [])

  // Contador de chats sin leer (se refresca cada 30 s)
  useEffect(() => {
    async function contar() {
      const { count } = await supabase
        .from('conversaciones_wa')
        .select('id', { count: 'exact', head: true })
        .eq('activa', true)
        .gt('no_leidos', 0)
      setChatsSinLeer(count || 0)
    }
    contar()
    const t = setInterval(contar, 30_000)
    return () => clearInterval(t)
  }, [])

  // Se despliega con una pequeña pausa para que no se abra al pasar el mouse de largo
  function alEntrar() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAbierto(true), 180)
  }
  function alSalir() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setAbierto(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const activeTramiteId = pathname.startsWith('/tramites/') ? pathname.split('/tramites/')[1] : null
  const esActivo = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const puedeConfig = ['notario', 'asistente', 'notario_auxiliar', 'admin'].includes(usuario?.rol || '')

  function verificarAcceso(accion: string, callback: () => void) {
    if (puedeConfig) callback()
    else setModalSinAcceso(accion)
  }

  async function crearTramite() {
    verificarAcceso('crear nuevos trámites', async () => {
      const api = process.env.NEXT_PUBLIC_API_URL
      if (!api) {
        alert('Falta configurar NEXT_PUBLIC_API_URL en el frontend.')
        return
      }
      try {
        const res = await fetch(`${api}/api/tramites/nuevo`, { method: 'POST' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          alert(`No se pudo crear el trámite: ${err.detail || `error ${res.status}`}`)
          return
        }
        const nuevo = await res.json()
        setTramites(prev => [...prev, nuevo])
        setTramitesExpanded(true)
        window.location.href = `/tramites/${nuevo.id}`
      } catch {
        alert('No hay conexión con el servidor. Revisa que el backend esté funcionando e intenta de nuevo.')
      }
    })
  }

  // ─── Estilos compartidos ───
  const filaBase: React.CSSProperties = {
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    position: 'relative',
    whiteSpace: 'nowrap',
    transition: 'background .15s, color .15s',
  }
  const estiloFila = (activo: boolean): React.CSSProperties => ({
    ...filaBase,
    background: activo ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: activo ? BLANCO : 'rgba(255,255,255,0.55)',
    fontWeight: activo ? 600 : 500,
  })
  const cajaIcono: React.CSSProperties = {
    width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const etiqueta: React.CSSProperties = {
    fontSize: 13, opacity: abierto ? 1 : 0, transition: 'opacity .15s', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left',
  }
  const indicador = (activo: boolean) =>
    activo ? <span style={{ position: 'absolute', left: -10, top: 12, bottom: 12, width: 3, borderRadius: 3, background: BLANCO }} /> : null

  const tituloSeccion = (texto: string) => (
    <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 12px', marginTop: 10 }}>
      {abierto ? (
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.6, color: 'rgba(255,255,255,0.32)', whiteSpace: 'nowrap' }}>
          {texto.toUpperCase()}
        </span>
      ) : (
        <span style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.14)' }} />
      )}
    </div>
  )

  return (
    <div className="relative flex-shrink-0 h-full" style={{ width: RIEL + 16 }}>
      <aside
        onMouseEnter={alEntrar}
        onMouseLeave={alSalir}
        className="absolute flex flex-col"
        style={{
          top: 8, bottom: 8, left: 8,
          width: abierto ? ABIERTO : RIEL,
          zIndex: 50,
          background: '#111111',
          borderRadius: 14,
          padding: '12px 10px',
          boxShadow: abierto ? '0 18px 48px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
          transition: 'width .2s ease, box-shadow .2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <a href="/" style={{ ...filaBase, height: 48, marginBottom: 6, color: '#fff' }}>
          <span style={cajaIcono}>
            <span style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: '#111', background: BLANCO,
            }}>N3</span>
          </span>
          <span style={{ ...etiqueta, lineHeight: 1.2 }}>
            <b style={{ display: 'block', fontFamily: SERIF, fontSize: 15, fontWeight: 600 }}>Notaría No. 3</b>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>Celaya, Guanajuato</span>
          </span>
        </a>

        <nav className="flex-1 flex flex-col" style={{ overflowY: abierto ? 'auto' : 'hidden', overflowX: 'hidden', gap: 2 }}>
          {SECCIONES.map(sec => (
            <div key={sec.titulo} className="flex flex-col" style={{ gap: 2 }}>
              {tituloSeccion(sec.titulo)}
              {sec.items.map(item => {
                const activo = esActivo(item.href)
                const badge = item.href === '/chats' && chatsSinLeer > 0 ? chatsSinLeer : 0
                return (
                  <a key={item.href} href={item.href} style={estiloFila(activo)} title={abierto ? undefined : item.label}>
                    {indicador(activo)}
                    <span style={{ ...cajaIcono, position: 'relative' }}>
                      <Icono nombre={item.icon} />
                      {badge > 0 && !abierto && (
                        <span style={{
                          position: 'absolute', top: 6, right: 4, minWidth: 17, height: 17, borderRadius: 999, padding: '0 4px',
                          background: ROJO, color: '#fff', fontSize: 9.5, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111111',
                        }}>{badge > 99 ? '99+' : badge}</span>
                      )}
                    </span>
                    <span style={etiqueta}>{item.label}</span>
                    {badge > 0 && abierto && (
                      <span style={{
                        marginRight: 10, minWidth: 22, height: 20, borderRadius: 999, padding: '0 6px', background: ROJO,
                        color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{badge > 99 ? '99+' : badge}</span>
                    )}
                  </a>
                )
              })}
            </div>
          ))}

          {tituloSeccion('Configuración del sistema')}

          {/* Trámites */}
          <button
            onClick={() => setTramitesExpanded(!tramitesExpanded)}
            style={estiloFila(pathname.startsWith('/tramites'))}
            title={abierto ? undefined : 'Trámites'}
          >
            {indicador(pathname.startsWith('/tramites'))}
            <span style={cajaIcono}><Icono nombre="tramites" /></span>
            <span style={etiqueta}>Trámites</span>
            {abierto && (
              <>
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); crearTramite() }}
                  title="Nuevo trámite"
                  style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.06)' }}
                >
                  <Icono nombre="mas" size={15} />
                </span>
                <span style={{ marginRight: 8, color: 'rgba(255,255,255,0.35)', transform: tramitesExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s', display: 'flex' }}>
                  <Icono nombre="chevron" size={15} />
                </span>
              </>
            )}
          </button>

          {abierto && tramitesExpanded && (
            <div className="flex flex-col" style={{ gap: 1, margin: '2px 0 4px 22px', paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              {tramites.map(t => {
                const activo = activeTramiteId === t.id
                return (
                  <div key={t.id} className="group relative">
                    <a href={`/tramites/${t.id}`}
                      className="flex items-center gap-2 no-underline"
                      style={{
                        padding: '7px 28px 7px 10px', borderRadius: 9, fontSize: 12, whiteSpace: 'nowrap',
                        color: activo ? '#fff' : 'rgba(255,255,255,0.5)',
                        background: activo ? 'rgba(255,255,255,0.08)' : 'transparent',
                        fontWeight: activo ? 600 : 400,
                      }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color_hex, opacity: activo ? 1 : 0.6, flexShrink: 0 }} />
                      <span className="truncate">{t.nombre}</span>
                    </a>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setModalEliminar({ id: t.id, nombre: t.nombre }) }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent w-5 h-5 rounded flex items-center justify-center text-[10px]"
                      style={{ color: 'rgba(255,100,100,0.75)' }}
                      title="Eliminar trámite"
                    >✕</button>
                  </div>
                )
              })}
            </div>
          )}

          {CONFIG_ITEMS.map(item => {
            const activo = esActivo(item.href)
            return (
              <button
                key={item.href}
                onClick={() => verificarAcceso(item.accion, () => router.push(item.href))}
                style={estiloFila(activo)}
                title={abierto ? undefined : item.label}
              >
                {indicador(activo)}
                <span style={cajaIcono}><Icono nombre={item.icon} /></span>
                <span style={etiqueta}>{item.label}</span>
                {abierto && !puedeConfig && (
                  <span style={{ marginRight: 10, color: 'rgba(255,255,255,0.25)', display: 'flex' }}><Icono nombre="candado" size={14} /></span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Notaría AI */}
        <a href="/notaria-ai" style={{ ...estiloFila(esActivo('/notaria-ai')), marginTop: 8 }} title={abierto ? undefined : 'Notaría AI'}>
          <span style={cajaIcono}>
            <span style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              border: '1px solid rgba(255,255,255,0.22)',
            }}>
              <Icono nombre="ai" size={17} />
            </span>
          </span>
          <span style={{ ...etiqueta, lineHeight: 1.2 }}>
            <b style={{ display: 'block', fontSize: 13, color: '#fff' }}>Notaría AI</b>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>Expedientes y dudas notariales</span>
          </span>
        </a>

        {/* Usuario */}
        <button
          onClick={() => setModalLogout(true)}
          style={{ ...filaBase, height: 52, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', borderRadius: 0, background: 'transparent', color: '#fff' }}
          title={abierto ? undefined : 'Cerrar sesión'}
        >
          <span style={cajaIcono}>
            <span style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#111', background: BLANCO,
            }}>{usuario?.letras || 'US'}</span>
          </span>
          <span style={{ ...etiqueta, lineHeight: 1.25 }}>
            <b style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.nombre || 'Usuario'}
            </b>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>
              {ROL_LABEL[usuario?.rol || ''] || usuario?.rol || ''}{usuario?.area ? ` · ${usuario.area}` : ''}
            </span>
          </span>
          {abierto && <span style={{ marginRight: 8, color: 'rgba(255,255,255,0.45)', display: 'flex' }}><Icono nombre="salir" size={17} /></span>}
        </button>
      </aside>

      {modalEliminar && (
        <ModalConfirm
          titulo={`Eliminar "${modalEliminar.nombre}"`}
          descripcion="Esta acción eliminará el trámite y todos sus documentos configurados. Los tickets existentes no se verán afectados."
          labelConfirm="Sí, eliminar"
          labelCancel="Cancelar"
          peligroso
          onCancel={() => setModalEliminar(null)}
          onConfirm={async () => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tramites/${modalEliminar.id}`, { method: 'DELETE' })
              if (res.ok) {
                setTramites(prev => prev.filter(x => x.id !== modalEliminar.id))
                if (activeTramiteId === modalEliminar.id) window.location.href = '/'
              } else {
                const err = await res.json().catch(() => ({}))
                alert(`No se pudo eliminar: ${err.detail || `error ${res.status}`}`)
              }
            } catch {
              alert('No hay conexión con el servidor. Revisa que el backend esté funcionando e intenta de nuevo.')
            }
            setModalEliminar(null)
          }}
        />
      )}

      {modalLogout && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]"
          style={{ background: 'rgba(17,17,17,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModalLogout(false)}>
          <div className="w-full max-w-xs mx-4 overflow-hidden"
            style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <div className="text-[18px] mb-1" style={{ color: '#111', fontFamily: SERIF, fontWeight: 600 }}>¿Cerrar sesión?</div>
              <div className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Se cerrará tu sesión en este dispositivo. Puedes volver a entrar con tu correo.
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={() => setModalLogout(false)}
                className="flex-1 py-2.5 text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#f1f1ef', color: '#3a3a3a', borderRadius: 8 }}>Cancelar</button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#111', color: '#fff', borderRadius: 8 }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {modalSinAcceso && <ModalSinAcceso accion={modalSinAcceso} onCerrar={() => setModalSinAcceso(null)} />}
    </div>
  )
}