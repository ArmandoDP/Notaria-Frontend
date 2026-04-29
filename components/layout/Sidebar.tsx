'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { section: 'Operación' },
  { href: '/',          label: 'Kanban',           icon: '▦' },
  { href: '/nueva',     label: 'Nueva solicitud',  icon: '✦' },
  { section: 'Reportes' },
  { href: '/area',      label: 'Tablero por área', icon: '◧' },
  { href: '/dashboard', label: 'Dashboard',        icon: '◉' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [tramites,          setTramites]          = useState<any[]>([])
  const [tramitesExpanded,  setTramitesExpanded]  = useState(pathname.startsWith('/tramites'))
  // const [configExpanded,    setConfigExpanded]    = useState(false)

  useEffect(() => {
    supabase.from('tramites_config').select('id, nombre, color_hex, slug').order('orden').then(({ data }) => {
      if (data) setTramites(data)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const activeTramiteId = pathname.startsWith('/tramites/') ? pathname.split('/tramites/')[1] : null

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
              <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Celaya, Guanajuato</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-2 overflow-y-auto relative">

          {/* Items normales */}
          {navItems.map((item, i) => {
            if ('section' in item) {
              return (
                <div key={i} className="px-2 pt-4 pb-1.5 text-[9px] font-bold tracking-[2.5px] uppercase"
                  style={{ color: 'rgba(255,255,255,0.16)' }}>
                  {item.section}
                </div>
              )
            }
            const active = pathname === item.href
            return (
              <a key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] no-underline mb-0.5 transition-all duration-200"
                style={{
                  background: active ? 'rgba(184,130,10,0.14)' : 'transparent',
                  color:      active ? '#F0C040' : 'rgba(255,255,255,0.38)',
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

          {/* Sección Sistema */}
          <div className="px-2 pt-4 pb-1.5 text-[9px] font-bold tracking-[2.5px] uppercase"
            style={{ color: 'rgba(255,255,255,0.16)' }}>
            Sistema
          </div>

          {/* Trámites — colapsable */}
          <button
            onClick={() => setTramitesExpanded(!tramitesExpanded)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] mb-0.5 transition-all duration-200 border-none cursor-pointer"
            style={{
              background: tramitesExpanded ? 'rgba(184,130,10,0.08)' : 'transparent',
              color:      tramitesExpanded ? '#F0C040' : 'rgba(255,255,255,0.38)',
            }}>
            <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
              style={{ background: tramitesExpanded ? '#F0C040' : 'rgba(255,255,255,0.2)' }} />
            <span className="flex-1 text-left font-medium">Trámites</span>
            <span className="text-[10px] transition-transform duration-200"
              style={{ transform: tramitesExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.3)' }}>
              ›
            </span>
          </button>

          {/* Lista de trámites */}
          {tramitesExpanded && (
            <div className="ml-3 mb-1 flex flex-col gap-0.5">
              {tramites.map(t => {
                const active = activeTramiteId === t.id
                return (
                  <a key={t.id} href={`/tramites/${t.id}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px] no-underline transition-all duration-150"
                    style={{
                      color:      active ? '#fff' : 'rgba(255,255,255,0.3)',
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      fontWeight: active ? 500 : 400,
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: t.color_hex, opacity: active ? 1 : 0.6 }} />
                    <span className="truncate">{t.nombre}</span>
                  </a>
                )
              })}
            </div>
          )}

          {/* Configuración */}
          <a href="/config"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] no-underline mb-0.5 transition-all duration-200"
            style={{
              background: pathname === '/config' ? 'rgba(184,130,10,0.14)' : 'transparent',
              color:      pathname === '/config' ? '#F0C040' : 'rgba(255,255,255,0.38)',
            }}>
            <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
              style={{ background: pathname === '/config' ? '#F0C040' : 'rgba(255,255,255,0.2)' }} />
            Configuración
          </a>
        </nav>

        {/* Footer */}
        <div className="p-2.5 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-all duration-200 cursor-pointer border-none text-left"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[9px] font-black text-black flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #B8820A, #F0C040)' }}>
              AV
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>Armando Vargas</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Administrador</div>
            </div>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>↗</span>
          </button>
        </div>
      </aside>
    </div>
  )
}