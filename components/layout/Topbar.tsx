import { createClient } from '@/lib/supabase/server'

export default async function Topbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const nombre   = user?.user_metadata?.nombre || user?.email || ''
  const rol      = user?.user_metadata?.role || 'agente'
  const initials = nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const rolLabel: Record<string, string> = {
    admin:            'Administrador',
    notario:          'Notario',
    notario_auxiliar: 'Aux. Notarial',
    area_lead:        'Líder de área',
    agente:           'Agente',
  }

  return (
    <header className="h-[58px] flex items-center px-4 gap-3 flex-shrink-0"
      style={{ background: '#F2F1EE' }}>

      {/* Topbar pill */}
      <div className="flex-1 flex items-center h-[40px] px-4 gap-2 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[12px]" style={{ color: '#B5B0AA' }}>Notaría No. 3</span>
        <span style={{ color: '#DDD' }}>/</span>
        <span className="text-[13px] font-semibold" style={{ color: '#1A1917' }}>Kanban</span>
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
          style={{
            background: 'linear-gradient(145deg, #B8820A, #F0C040)',
            boxShadow: '0 2px 8px rgba(184,130,10,0.35)',
          }}>
          {initials}
        </div>
      </div>
    </header>
  )
}