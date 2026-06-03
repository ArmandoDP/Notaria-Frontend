'use client'

interface Props {
  titulo:    string
  valor:     number
  icono:     string
  color:     string
  subtitulo?: string
  onClick?:  () => void
}

export default function KPICard({ titulo, valor, icono, color, subtitulo, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-5 text-left w-full transition-all"
      style={{
        border:     '1px solid rgba(0,0,0,0.06)',
        boxShadow:  '0 1px 4px rgba(0,0,0,0.04)',
        cursor:     onClick ? 'pointer' : 'default',
        transform:  'translateY(0)',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>

      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px]"
          style={{ background: `${color}15` }}>
          {icono}
        </div>
        {onClick && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full"
            style={{ background: `${color}10`, color }}>
            Ver detalle →
          </span>
        )}
      </div>

      <div className="text-[32px] font-black mb-1" style={{ color: '#111', lineHeight: 1 }}>
        {valor}
      </div>
      <div className="text-[12px] font-semibold" style={{ color: '#666' }}>
        {titulo}
      </div>
      {subtitulo && (
        <div className="text-[11px] mt-1" style={{ color: '#9C9890' }}>
          {subtitulo}
        </div>
      )}
    </button>
  )
}