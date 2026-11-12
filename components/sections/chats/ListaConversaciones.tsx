'use client'

import { useState } from 'react'
import s from './wa.module.css'
import { ESTATUS_CONFIG, horaLista, iniciales } from './waUtils'

interface Props {
  conversaciones: any[]
  seleccionada: string | undefined
  onSelect: (conv: any) => void
  onCambiarEstatus: (convId: string, estatus: string) => void
}

export default function ListaConversaciones({ conversaciones, seleccionada, onSelect, onCambiarEstatus }: Props) {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)

  if (conversaciones.length === 0) {
    return (
      <div className={s.empty} style={{ padding: '48px 16px' }}>
        <b>Sin conversaciones</b>
        <span>Prueba con otro filtro o búsqueda.</span>
      </div>
    )
  }

  return (
    <div onMouseLeave={() => setMenuAbierto(null)}>
      {conversaciones.map(conv => {
        const area = conv.areas
        const noLeidos = conv.no_leidos || 0
        const estatus = conv.estatus || 'pendiente'
        const est = ESTATUS_CONFIG[estatus] || ESTATUS_CONFIG.pendiente
        const saliente = conv.ultimo_mensaje_direccion === 'saliente'

        return (
          <div key={conv.id} className={s.rowWrap}>
            <button
              className={`${s.chat} ${seleccionada === conv.id ? s.chatSel : ''}`}
              onClick={() => { onSelect(conv); setMenuAbierto(null) }}
            >
              <div className={s.avatar} style={{ background: area?.color_hex || '#5b6ec9' }}>
                {iniciales(conv.nombre)}
                {noLeidos > 0 && <span className={s.ring} />}
              </div>
              <div className={s.chatMain}>
                <div className={s.chatTop}>
                  <b>{conv.nombre || conv.telefono}</b>
                  <time className={noLeidos ? s.unreadT : ''}>{horaLista(conv.ultimo_mensaje_at)}</time>
                </div>
                <div className={s.chatBottom}>
                  <span className={s.preview}>
                    {saliente && <span className={s.tk}>✓✓</span>}
                    <span className={s.previewText}>{conv.ultimo_mensaje || '…'}</span>
                  </span>
                  <span className={s.metaCol}>
                    {estatus === 'demorado' && <span className={s.estDot} style={{ background: est.dot }} title="Demorada" />}
                    {area && <span className={s.areaPill}>{area.nombre}</span>}
                    {noLeidos > 0 && <span className={s.badge}>{noLeidos > 99 ? '99+' : noLeidos}</span>}
                  </span>
                </div>
              </div>
            </button>

            <button
              className={s.rowMenuBtn}
              onClick={e => { e.stopPropagation(); setMenuAbierto(menuAbierto === conv.id ? null : conv.id) }}
              aria-label="Cambiar estado"
            >
              ⋯
            </button>

            {menuAbierto === conv.id && (
              <div className={s.popover} style={{ right: 10, top: 38 }}>
                <div className={s.popTitle}>Cambiar estado</div>
                {Object.entries(ESTATUS_CONFIG).map(([clave, cfg]) => (
                  <button
                    key={clave}
                    className={s.menuItem}
                    style={estatus === clave ? { background: cfg.bg, color: cfg.color } : undefined}
                    onClick={e => { e.stopPropagation(); onCambiarEstatus(conv.id, clave); setMenuAbierto(null) }}
                  >
                    <span className={s.estDot} style={{ background: cfg.dot }} />
                    {cfg.label}
                    {estatus === clave && <span style={{ marginLeft: 'auto' }}>✓</span>}
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