'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import AIButton from './AIButton'

interface Props {
  conversaciones:  any[]
  convActiva:      string | null
  onSeleccionar:   (conv: any) => void
  onNueva:         () => void
  onEliminar:      (id: string) => void
  onFijar:         (id: string) => void
  onRenombrar:     (id: string, titulo: string) => void
  onVolver:        () => void
  buscando:        boolean
}

const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

export default function AISidebar({
  conversaciones, convActiva, onSeleccionar, onNueva, onEliminar, onVolver, onFijar, onRenombrar,
}: Props) {
  const [busqueda,    setBusqueda]    = useState('')
  const [eliminando,  setEliminando]  = useState<string | null>(null)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const [renombrando, setRenombrando] = useState<string | null>(null)

  const filtradas = conversaciones.filter(c =>
    c.titulo.toLowerCase().includes(busqueda.toLowerCase())
  )

  const fijadas  = filtradas.filter(c => c.fijada)
  const normales = filtradas.filter(c => !c.fijada)

  function renderConv(conv: any) {
    const activa = convActiva === conv.id
    return (
      <div key={conv.id}
        className="group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
        style={{ background: activa ? 'rgba(200,180,248,0.1)' : 'transparent' }}
        onClick={() => onSeleccionar(conv)}>

        {activa && (
          <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
            style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite' }} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {conv.fijada && (
              <span style={{ fontSize: '9px', color: 'rgba(200,180,248,0.6)', flexShrink: 0 }}>📌</span>
            )}
            <div className="text-[12px] font-medium"
              style={{
                color: activa ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '200px',
              }}>
              {conv.titulo}
            </div>
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {formatDistanceToNow(new Date(conv.updated_at), { locale: es, addSuffix: true })}
          </div>
        </div>

        {/* Menú 3 puntos */}
        <div className="relative flex-shrink-0">
          <button
            onClick={e => {
              e.stopPropagation()
              setMenuAbierto(menuAbierto === conv.id ? null : conv.id)
            }}
            className="opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent px-1 py-0.5 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', lineHeight: 1 }}>
            ···
          </button>

          {menuAbierto === conv.id && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(null)} />
              <div className="absolute right-0 top-7 rounded-xl overflow-hidden z-50 py-1"
                style={{ background: '#1A1628', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '170px' }}>

                <button
                  onClick={e => { e.stopPropagation(); onFijar(conv.id); setMenuAbierto(null) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer border-none bg-transparent text-left transition-all"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span>📌</span>
                  {conv.fijada ? 'Desmarcar conversación' : 'Fijar conversación'}
                </button>

                <button
                  onClick={e => { e.stopPropagation(); setRenombrando(conv.id); setMenuAbierto(null) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer border-none bg-transparent text-left transition-all"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span>✎</span> Cambiar nombre
                </button>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '3px 8px' }} />

                <button
                  onClick={e => { e.stopPropagation(); setEliminando(conv.id); setMenuAbierto(null) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer border-none bg-transparent text-left transition-all"
                  style={{ color: '#F8B4B4' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,180,180,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span>✕</span> Eliminar
                </button>
              </div>
            </>
          )}
        </div>

        {/* Input renombrar inline */}
        {renombrando === conv.id && (
          <div className="absolute inset-0 z-50 flex items-center px-3 rounded-xl"
            style={{ background: '#1A1628', border: '1px solid rgba(200,180,248,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              defaultValue={conv.titulo}
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: 'rgba(255,255,255,0.9)' }}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  await onRenombrar(conv.id, e.currentTarget.value)
                  setRenombrando(null)
                }
                if (e.key === 'Escape') setRenombrando(null)
              }}
              onBlur={e => {
                onRenombrar(conv.id, e.target.value)
                setRenombrando(null)
              }}
            />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Enter</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#08060F', width: '290px', flexShrink: 0 }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0"
            style={{ background: '#0C0A18' }}>
            <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite', opacity: 0.3 }} />
            <div className="relative z-10" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#sbStar)"/>
                <defs><linearGradient id="sbStar" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#C8B4F8"/><stop offset="50%" stopColor="#B4F8E4"/><stop offset="100%" stopColor="#F8C8E4"/></linearGradient></defs>
              </svg>
            </div>
          </div>
          <span className="text-[16px] font-black"
            style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Notaría AI
          </span>
        </div>

        <button onClick={onNueva}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border-none relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite', opacity: 0.08 }} />
          <div className="absolute inset-0 rounded-xl" style={{
            background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out', maskComposite: 'exclude', padding: '1px', opacity: 0.4,
          }} />
          <span className="relative z-10 text-[16px]" style={{ color: '#C8B4F8' }}>✦</span>
          <span className="relative z-10 text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Nuevo chat
          </span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar conversaciones..."
          className="w-full px-3 py-2 rounded-xl text-[12px] outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
        />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filtradas.length === 0 ? (
          <div className="text-center py-8 text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Sin conversaciones
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">

            {/* Sección Marcadas */}
            {fijadas.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
                  <span style={{ fontSize: '10px' }}>📌</span>
                  <span className="text-[9px] font-bold tracking-[2px] uppercase"
                    style={{ color: 'rgba(200,180,248,0.5)' }}>
                    Marcadas
                  </span>
                </div>
                {fijadas.map(conv => renderConv(conv))}

                {normales.length > 0 && (
                  <div className="mx-2 my-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                )}
              </>
            )}

            {/* Sección Recientes */}
            {normales.length > 0 && (
              <>
                {fijadas.length > 0 && (
                  <div className="flex items-center gap-2 px-2 pb-1.5">
                    <span className="text-[9px] font-bold tracking-[2px] uppercase"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Recientes
                    </span>
                  </div>
                )}
                {normales.map(conv => renderConv(conv))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <AIButton onClick={onVolver} label="← Volver al CRM" variant='button'/>
      </div>

      {/* Modal eliminar */}
      {eliminando && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl p-5 w-72"
            style={{ background: '#0C0A18', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[14px] font-bold text-white mb-1">¿Eliminar conversación?</div>
            <div className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Esta acción no se puede deshacer.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEliminando(null)}
                className="flex-1 py-2 rounded-xl text-[12px] cursor-pointer border-none"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                Cancelar
              </button>
              <button onClick={() => { onEliminar(eliminando); setEliminando(null) }}
                className="flex-1 py-2 rounded-xl text-[12px] font-bold cursor-pointer border-none"
                style={{ background: '#FEE2E2', color: '#991B1B' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes aiPastel {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes aiStar {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(72deg) scale(1.25); }
          50%  { transform: rotate(144deg) scale(1); }
          75%  { transform: rotate(216deg) scale(1.25); }
        }
      `}</style>
    </div>
  )
}