'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { section: 'Operación' },
  { href: '/',          label: 'Kanban',          icon: '▦' },
  { href: '/nueva',     label: 'Nueva solicitud', icon: '✦' },
  { section: 'Reportes' },
  { href: '/area',      label: 'Tablero por área', icon: '◧' },
  { href: '/dashboard', label: 'Dashboard',        icon: '◉' },
  { section: 'Sistema' },
  { href: '/tramites',  label: 'Trámites',         icon: '⊞' },
  { href: '/config',    label: 'Configuración',    icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex-shrink-0 h-full p-2" style={{ background: '#F2F1EE' }}>
      <aside className="w-[220px] flex flex-col h-full relative overflow-hidden"
        style={{
          background: '#0C0C10',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}>

        {/* Glow top */}
        <div className="absolute pointer-events-none"
          style={{ top: -80, left: -60, width: 220, height: 220,
            background: 'radial-gradient(circle, rgba(184,130,10,0.15) 0%, transparent 70%)' }} />

        {/* Glow bottom */}
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
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] no-underline mb-0.5 transition-all duration-200"
                style={{
                  background: active ? 'rgba(184,130,10,0.14)' : 'transparent',
                  color: active ? '#F0C040' : 'rgba(255,255,255,0.38)',
                  fontWeight: active ? 600 : 400,
                  boxShadow: active ? 'inset 0 0 0 1px rgba(184,130,10,0.2)' : 'none',
                }}
              >
                <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 transition-all duration-200"
                  style={{
                    background: active ? '#F0C040' : 'rgba(255,255,255,0.2)',
                    boxShadow: active ? '0 0 8px rgba(240,192,64,0.6)' : 'none',
                  }} />
                {item.label}
                {active && <span className="ml-auto text-[10px] opacity-40">◆</span>}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2.5 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-all duration-200 cursor-pointer border-none text-left"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
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