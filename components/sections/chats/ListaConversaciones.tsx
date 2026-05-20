import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  conversaciones: any[]
  seleccionada:   string | undefined
  onSelect:       (conv: any) => void
}

export default function ListaConversaciones({ conversaciones, seleccionada, onSelect }: Props) {
  if (conversaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
        <div className="text-[32px]">📭</div>
        <div className="text-[13px]" style={{ color: '#9C9890' }}>Sin conversaciones</div>
      </div>
    )
  }

  return (
    <div>
      {conversaciones.map(conv => {
        const activa   = seleccionada === conv.id
        const area     = conv.areas
        const tieneNL  = conv.no_leidos > 0

        return (
          <button key={conv.id}
            onClick={() => onSelect(conv)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer border-none transition-all border-b"
            style={{
              background:  activa ? '#F0F4FF' : 'transparent',
              borderColor: 'rgba(0,0,0,0.04)',
              borderLeft:  activa ? '3px solid #1B5FA5' : '3px solid transparent',
            }}>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
              style={{ background: area?.color_hex || '#25D366' }}>
              {conv.nombre?.slice(0, 2).toUpperCase() || '??'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[13px] font-semibold truncate" style={{ color: '#111' }}>
                  {conv.nombre || conv.telefono}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: '#9C9890' }}>
                  {formatDistanceToNow(new Date(conv.ultimo_mensaje_at), { locale: es, addSuffix: false })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] truncate" style={{ color: tieneNL ? '#111' : '#9C9890', fontWeight: tieneNL ? 500 : 400 }}>
                  {conv.ultimo_mensaje || '...'}
                </span>
                {tieneNL && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ background: '#25D366' }}>
                    {conv.no_leidos}
                  </span>
                )}
              </div>

              {area && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: area.color_hex }} />
                  <span className="text-[10px]" style={{ color: area.color_hex }}>{area.nombre}</span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}