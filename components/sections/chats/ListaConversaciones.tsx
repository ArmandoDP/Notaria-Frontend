'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  conversaciones:    any[]
  seleccionada:      string | undefined
  onSelect:          (conv: any) => void
  onCambiarEstatus:  (convId: string, estatus: string) => void
}

const ESTATUS_CONFIG: Record<string, { label: string, color: string, bg: string, dot: string }> = {
  pendiente: { label: 'Pendiente', color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  atendido:  { label: 'Atendido',  color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  demorado:  { label: 'Demorado',  color: '#991B1B', bg: '#FEE2E2', dot: '#E24B4A' },
}

export default function ListaConversaciones({ conversaciones, seleccionada, onSelect, onCambiarEstatus }: Props) {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)

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
        const estatus  = conv.estatus || 'pendiente'
        const est      = ESTATUS_CONFIG[estatus]
        const menuOpen = menuAbierto === conv.id

        return (
          <div key={conv.id} className="relative group">
            <button
              onClick={() => { onSelect(conv); setMenuAbierto(null) }}
              className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer border-none transition-all"
              style={{
                background:  activa ? '#F0F7FF' : 'transparent',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                borderLeft:  `3px solid ${activa ? '#1B5FA5' : est.dot}`,
              }}>

              {/* Avatar con bolita de estatus */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                  style={{ background: area?.color_hex || '#25D366' }}>
                  {conv.nombre?.slice(0, 2).toUpperCase() || '??'}
                </div>
                {tieneNL && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ background: '#25D366' }}>
                    {conv.no_leidos > 9 ? '9+' : conv.no_leidos}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Nombre + hora */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold truncate" style={{ color: '#111' }}>
                    {conv.nombre || conv.telefono}
                  </span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: '#9C9890' }}>
                    {formatDistanceToNow(new Date(conv.ultimo_mensaje_at), { locale: es, addSuffix: false })}
                  </span>
                </div>

                {/* Teléfono */}
                <div className="text-[10px] mb-0.5 font-mono" style={{ color: '#9C9890' }}>
                  {conv.telefono}
                </div>

                {/* Último mensaje */}
                <div className="text-[11.5px] truncate mb-1"
                  style={{ color: tieneNL ? '#111' : '#9C9890', fontWeight: tieneNL ? 500 : 400 }}>
                  {conv.ultimo_mensaje || '...'}
                </div>

                {/* Footer — área + estatus */}
                <div className="flex items-center justify-between gap-2">
                  {area && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: area.color_hex }} />
                      <span className="text-[10px]" style={{ color: area.color_hex }}>{area.nombre}</span>
                    </div>
                  )}
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0"
                    style={{ background: est.bg, color: est.color }}>
                    {est.label}
                  </span>
                </div>
              </div>
            </button>

            {/* Botón de menú — aparece en hover */}
            <button
              onClick={e => { e.stopPropagation(); setMenuAbierto(menuOpen ? null : conv.id) }}
              className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-all w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border-none text-[11px]"
              style={{ background: '#F3F4F6', color: '#666' }}>
              ⋯
            </button>

            {/* Dropdown de estatus */}
            {menuOpen && (
              <div className="absolute right-2 top-9 z-50 rounded-xl overflow-hidden shadow-xl"
                style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', minWidth: 160 }}>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: '#9C9890', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  Cambiar estado
                </div>
                {Object.entries(ESTATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key}
                    onClick={e => {
                      e.stopPropagation()
                      onCambiarEstatus(conv.id, key)
                      setMenuAbierto(null)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer border-none transition-all text-[12px] font-medium"
                    style={{
                      background: estatus === key ? cfg.bg : 'transparent',
                      color:      estatus === key ? cfg.color : '#333',
                    }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                    {cfg.label}
                    {estatus === key && <span className="ml-auto text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}