'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import AIButton from '@/components/sections/notaria-ai/AIButton'
import AICard from '../sections/notaria-ai/AICard'
import ModalConfirm from '@/components/ui/ModalConfirm'

const navItems = [
  { section: 'Operación' },
  { href: '/',       label: 'Tablero de Solicitudes',          icon: '▦' },
  { href: '/nueva',  label: 'Nueva solicitud', icon: '✦' },
  { href: '/chats',  label: 'Chats WhatsApp',  icon: '💬' },
  { section: 'Reportes' },
  // { href: '/area',      label: 'Tablero por área', icon: '◧' },
  { href: '/dashboard', label: 'Tablero de Control',        icon: '📊' },
  { href: '/folios',    label: 'Buscar folios',     icon: '⌕' },
]

const configItems = [
  { href: '/usuarios', label: 'Usuarios y permisos', icon: '👥' },
  { href: '/config',   label: 'Configuración',        icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [tramites,         setTramites]         = useState<any[]>([])
  const [tramitesExpanded, setTramitesExpanded] = useState(pathname.startsWith('/tramites'))
  const [usuario, setUsuario] = useState<{ nombre: string, rol: string, letras: string } | null>(null)
  // Agrega estados:
  const [modalEliminar, setModalEliminar] = useState<{ id: string, nombre: string } | null>(null)

  const [modalLogout, setModalLogout] = useState(false)

  useEffect(() => {
    supabase.from('tramites_config').select('id, nombre, color_hex, slug').order('nombre').then(({ data }) => {
      if (data) setTramites(data)
    })
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const nombre = user.user_metadata?.nombre || user.email || ''
        const rol    = user.user_metadata?.role   || 'agente'
        const letras = nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        setUsuario({ nombre, rol, letras })
      }
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const activeTramiteId = pathname.startsWith('/tramites/') ? pathname.split('/tramites/')[1] : null

  const rolLabel: Record<string, string> = {
    admin:            'Administrador',
    notario:          'Notario',
    notario_auxiliar: 'Aux. Notarial',
    recepcion:        'Recepción',
    area_lead:        'Líder de área',
    agente:           'Agente',
  }

  return (
    <div className="flex-shrink-0 h-full p-2" style={{ background: '#F2F1EE' }}>
      <aside className="w-[270px] flex flex-col h-full relative overflow-hidden"
        style={{ background: '#0C0C10', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>

        {/* Glow effects */}
        <div className="absolute pointer-events-none"
          style={{ top: -80, left: -60, width: 220, height: 220,
            background: 'radial-gradient(circle, rgba(184,130,10,0.15) 0%, transparent 70%)' }} />
        <div className="absolute pointer-events-none"
          style={{ bottom: -60, right: -40, width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(99,153,34,0.08) 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black text-black"
              style={{ background: 'linear-gradient(145deg, #B8820A, #F0C040)', boxShadow: '0 4px 12px rgba(184,130,10,0.4)' }}>
              N3
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white leading-tight tracking-tight">Notaría No. 3</div>
              <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>Celaya, Guanajuato</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-2 overflow-y-auto relative flex flex-col gap-0">

          {/* Items principales */}
          {navItems.map((item, i) => {
            if ('section' in item) {
              return (
                <div key={i} className="px-2 pt-4 pb-1.5 text-[9px] font-bold tracking-[2.5px] uppercase"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {item.section}
                </div>
              )
            }
            const active = pathname === item.href
            return (
                <>
                  <a key={item.href} href={item.href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] no-underline mb-0.5 transition-all duration-200"
                    style={{
                      background: active ? 'rgba(184,130,10,0.14)' : 'transparent',
                      color:      active ? '#F0C040' : 'rgba(255,255,255,0.65)',
                      fontWeight: active ? 600 : 400,
                      boxShadow:  active ? 'inset 0 0 0 1px rgba(184,130,10,0.2)' : 'none',
                    }}>
                    <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                      style={{ background: active ? '#F0C040' : 'rgba(255,255,255,0.2)', boxShadow: active ? '0 0 8px rgba(240,192,64,0.6)' : 'none' }} />
                    {item.label}
                    {active && <span className="ml-auto text-[10px] opacity-40">◆</span>}
                  </a>

                  {/* Notaría AI después de Chats WhatsApp */}
                  {/* {item.href === '/chats' && (
                    <div className="mt-1 mb-1.5">
                      <AIButton href="/notaria-ai" label="Notaría AI" variant="sidebar" />
                    </div>
                  )} */}
                </>
            )
          })}

          {/* Notaría AI — botón especial */}
          {/* <div className="mt-1 mb-1">
            <AIButton href="/notaria-ai" label="Notaría AI" variant="sidebar" />
          </div> */}

          {/* Configuración del sistema */}
          <div className="px-2 pt-4 pb-1.5 text-[9px] font-bold tracking-[2.5px] uppercase"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Configuración del sistema
          </div>

          {/* Trámites — colapsable */}
          <button
            onClick={() => setTramitesExpanded(!tramitesExpanded)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] mb-0.5 transition-all duration-200 border-none cursor-pointer"
            style={{
              background: tramitesExpanded ? 'rgba(184,130,10,0.08)' : 'transparent',
              color:      tramitesExpanded ? '#F0C040' : 'rgba(255,255,255,0.65)',
            }}>
            <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
              style={{ background: tramitesExpanded ? '#F0C040' : 'rgba(255,255,255,0.2)' }} />
            <span className="flex-1 text-left font-medium">Trámites</span>

            {/* Botón nuevo trámite */}
            <span
              onClick={async e => {
                e.stopPropagation()
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tramites/nuevo`, { method: 'POST' })
                if (res.ok) {
                  const nuevo = await res.json()
                  setTramites(prev => [...prev, nuevo])
                  setTramitesExpanded(true)
                  window.location.href = `/tramites/${nuevo.id}`
                }
              }}
              className="text-[16px] px-1 rounded cursor-pointer transition-all"
              style={{ color: 'rgba(255,255,255,0.9)' }}
              title="Nuevo trámite">
              +
            </span>

            <span className="text-[10px] transition-transform duration-200"
              style={{ transform: tramitesExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.3)' }}>
              ›
            </span>
          </button>

          {tramitesExpanded && (
            <div className="ml-3 mb-1 flex flex-col gap-0.5">
              {tramites.map(t => {
                const active = activeTramiteId === t.id
                return (
                  <div key={t.id} className="group relative">
                    <a href={`/tramites/${t.id}`}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px] no-underline transition-all duration-150"
                      style={{
                        color:      active ? '#fff' : 'rgba(255,255,255,0.50)',
                        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                        fontWeight: active ? 500 : 400,
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: t.color_hex, opacity: active ? 1 : 0.5 }} />
                      <span className="truncate flex-1">{t.nombre}</span>
                    </a>

                    {/* Botón eliminar en hover */}
                    <button
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setModalEliminar({ id: t.id, nombre: t.nombre })
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent w-5 h-5 rounded flex items-center justify-center text-[10px]"
                      style={{ color: 'rgba(255,100,100,0.7)' }}
                      title="Eliminar trámite">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Usuarios y config */}
          {configItems.map(item => {
            const active = pathname === item.href
            return (
              <a key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] no-underline mb-0.5 transition-all duration-200"
                style={{
                  background: active ? 'rgba(184,130,10,0.14)' : 'transparent',
                  color:      active ? '#F0C040' : 'rgba(255,255,255,0.65)',
                  fontWeight: active ? 600 : 400,
                  boxShadow:  active ? 'inset 0 0 0 1px rgba(184,130,10,0.2)' : 'none',
                }}>
                <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{ background: active ? '#F0C040' : 'rgba(255,255,255,0.2)', boxShadow: active ? '0 0 8px rgba(240,192,64,0.6)' : 'none' }} />
                {item.label}
                {active && <span className="ml-auto text-[10px] opacity-40">◆</span>}
              </a>
            )
          })}

          {/* Notaría AI — al final del nav, scrolleable */}
          <div className="mt-auto pt-3">
            <AICard href="/notaria-ai" />
          </div>

        </nav>

        
        {/* Footer — usuario */}
        <div className="p-2.5 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setModalLogout(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-all duration-200 cursor-pointer border-none text-left"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[9px] font-black text-black flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #B8820A, #F0C040)' }}>
              {usuario?.letras || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {usuario?.nombre || 'Usuario'}
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {rolLabel[usuario?.rol || ''] || usuario?.rol || ''}
                {usuario?.area && ` · ${usuario.area}`}
              </div>
            </div>
            <div className="text-[10px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Cerrar sesión
              </div>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>↗</span>
          </button>
        </div>
      </aside>

      {/* Agrega el modal al final del aside, antes del cierre: */}
      {modalEliminar && (
        <ModalConfirm
          titulo={`Eliminar "${modalEliminar.nombre}"`}
          descripcion="Esta acción eliminará el trámite y todos sus documentos configurados. Los tickets existentes no se verán afectados."
          labelConfirm="Sí, eliminar"
          labelCancel="Cancelar"
          peligroso
          onCancel={() => setModalEliminar(null)}
          onConfirm={async () => {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/tramites/${modalEliminar.id}`,
              { method: 'DELETE' }
            )
            if (res.ok) {
              setTramites(prev => prev.filter(x => x.id !== modalEliminar.id))
              if (activeTramiteId === modalEliminar.id) window.location.href = '/'
            } else {
              const err = await res.json()
              alert(`❌ ${err.detail}`)
            }
            setModalEliminar(null)
          }}
        />
      )}
      {modalLogout && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl w-full max-w-xs mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#F7F7F5' }}>
                <span className="text-[24px]">👋</span>
              </div>
              <div className="text-[16px] font-bold mb-1" style={{ color: '#111' }}>
                ¿Cerrar sesión?
              </div>
              <div className="text-[13px]" style={{ color: '#9C9890' }}>
                Se cerrará tu sesión en este dispositivo. Puedes volver a entrar con tu correo.
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />

            <div className="flex gap-3 px-6 py-4">
              <button onClick={() => setModalLogout(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#444' }}>
                Cancelar
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: '#111', color: '#fff' }}>
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}