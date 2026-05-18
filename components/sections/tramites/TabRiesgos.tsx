'use client'

import { useState } from 'react'

const NIVEL_COLOR: Record<string, { bg: string, color: string }> = {
  alto:  { bg: '#FEE2E2', color: '#991B1B' },
  medio: { bg: '#FEF3C7', color: '#92400E' },
  bajo:  { bg: '#D1FAE5', color: '#065F46' },
}

const TIPO_COLOR: Record<string, { bg: string, color: string }> = {
  'IA automática':      { bg: '#E6F1FB', color: '#185FA5' },
  'Manual obligatoria': { bg: '#F3F4F6', color: '#6B7280' },
  'SLA automático':     { bg: '#EDE9FE', color: '#4C1D95' },
}

const CATEGORIA_CONFIG: Record<string, { label: string, bg: string, color: string, icon: string }> = {
  riesgo:         { label: 'Riesgo',         bg: '#FEE2E2', color: '#991B1B', icon: '⚠' },
  alerta:         { label: 'Alerta',         bg: '#FEF3C7', color: '#92400E', icon: '🔔' },
  recomendacion:  { label: 'Recomendación',  bg: '#D1FAE5', color: '#065F46', icon: '💡' },
}

interface Item {
  nivel:      string
  tipo:       string
  titulo:     string
  desc:       string
  categoria:  string
}

interface Props {
  riesgos:  Item[]
  color:    string
  isAdmin:  boolean
  onSave:   (riesgos: Item[]) => void
}

export default function TabRiesgos({ riesgos, color, isAdmin, onSave }: Props) {
  const [expandido, setExpandido] = useState<number | null>(null)

  function actualizar(i: number, campo: string, valor: string) {
    const n = [...riesgos]
    n[i] = { ...n[i], [campo]: valor }
    onSave(n)
  }

  function eliminar(i: number) {
    onSave(riesgos.filter((_, idx) => idx !== i))
  }

  function agregar(categoria: string) {
    const nuevo: Item = {
      categoria,
      nivel:  categoria === 'recomendacion' ? 'bajo' : 'medio',
      tipo:   'Manual obligatoria',
      titulo: `Nueva ${CATEGORIA_CONFIG[categoria].label.toLowerCase()}`,
      desc:   '',
    }
    onSave([...riesgos, nuevo])
    setExpandido(riesgos.length)
  }

  // Agrupar por categoría
  const porCategoria = {
    riesgo:        riesgos.map((r, i) => ({ r, i })).filter(({ r }) => r.categoria === 'riesgo' || !r.categoria),
    alerta:        riesgos.map((r, i) => ({ r, i })).filter(({ r }) => r.categoria === 'alerta'),
    recomendacion: riesgos.map((r, i) => ({ r, i })).filter(({ r }) => r.categoria === 'recomendacion'),
  }

  const renderItem = (r: Item, i: number) => {
    const nivel   = NIVEL_COLOR[r.nivel] || NIVEL_COLOR.bajo
    const tipo    = TIPO_COLOR[r.tipo]   || { bg: '#F3F4F6', color: '#6B7280' }
    const abierto = expandido === i

    return (
      <div key={i} className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setExpandido(abierto ? null : i)}
          style={{ background: abierto ? '#FAFAF8' : 'transparent' }}>

          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex-shrink-0"
            style={{ background: nivel.bg, color: nivel.color }}>
            {r.nivel}
          </span>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold truncate" style={{ color: '#111' }}>{r.titulo}</div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium flex-shrink-0"
            style={{ background: tipo.bg, color: tipo.color }}>
            {r.tipo}
          </span>

          <span className="text-[12px] flex-shrink-0 transition-transform duration-200"
            style={{ color: '#9C9890', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </div>

        {/* Panel edición */}
        {abierto && (
          <div className="px-4 pb-4 flex flex-col gap-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>

            {isAdmin ? (
              <>
                {/* Categoría */}
                <div className="pt-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                    Categoría
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(CATEGORIA_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button"
                        onClick={() => actualizar(i, 'categoria', key)}
                        className="flex-1 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border-none transition-all flex items-center justify-center gap-1"
                        style={{
                          background: r.categoria === key || (!r.categoria && key === 'riesgo') ? cfg.bg : '#F3F4F6',
                          color:      r.categoria === key || (!r.categoria && key === 'riesgo') ? cfg.color : '#9CA3AF',
                        }}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                    Título
                  </label>
                  <input defaultValue={r.titulo}
                    onBlur={e => actualizar(i, 'titulo', e.target.value)}
                    className="w-full text-[13px] font-semibold outline-none rounded-xl px-3 py-2"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
                </div>

                {/* Nivel */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                    Nivel
                  </label>
                  <div className="flex gap-2">
                    {['alto', 'medio', 'bajo'].map(n => (
                      <button key={n} type="button"
                        onClick={() => actualizar(i, 'nivel', n)}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer border-none transition-all"
                        style={{
                          background: r.nivel === n ? NIVEL_COLOR[n].bg : '#F3F4F6',
                          color:      r.nivel === n ? NIVEL_COLOR[n].color : '#9CA3AF',
                          boxShadow:  r.nivel === n ? `0 0 0 2px ${NIVEL_COLOR[n].color}40` : 'none',
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                    Tipo de detección
                  </label>
                  <div className="flex flex-col gap-1">
                    {['IA automática', 'Manual obligatoria', 'SLA automático'].map(t => (
                      <button key={t} type="button"
                        onClick={() => actualizar(i, 'tipo', t)}
                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none text-left transition-all"
                        style={{
                          background: r.tipo === t ? TIPO_COLOR[t]?.bg : '#F3F4F6',
                          color:      r.tipo === t ? TIPO_COLOR[t]?.color : '#9CA3AF',
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                    Descripción / cómo se maneja
                  </label>
                  <textarea defaultValue={r.desc || ''}
                    onBlur={e => actualizar(i, 'desc', e.target.value)}
                    rows={3}
                    className="w-full text-[12.5px] outline-none resize-none rounded-xl px-3 py-2"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#444' }}
                    placeholder="Describe cómo se detecta y maneja..." />
                </div>

                {/* Eliminar */}
                <div className="flex justify-end">
                  <button onClick={() => eliminar(i)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                    style={{ background: '#FEE2E2', color: '#991B1B' }}>
                    Eliminar
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-3">
                <p className="text-[12px] leading-relaxed" style={{ color: '#555' }}>
                  {r.desc || 'Sin descripción'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Sección Riesgos */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px]">⚠</span>
            <span className="text-[13px] font-bold" style={{ color: '#991B1B' }}>
              Riesgos ({porCategoria.riesgo.length})
            </span>
          </div>
        </div>
        {porCategoria.riesgo.length === 0 && (
          <div className="text-center py-4 text-[12px] bg-white rounded-2xl"
            style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
            Sin riesgos configurados
          </div>
        )}
        {porCategoria.riesgo.map(({ r, i }) => renderItem(r, i))}
        {isAdmin && (
          <button onClick={() => agregar('riesgo')}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold cursor-pointer border-2 border-dashed transition-all"
            style={{ borderColor: '#991B1B40', color: '#991B1B', background: '#FEE2E205' }}>
            + Agregar riesgo
          </button>
        )}
      </div>

      {/* Sección Alertas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🔔</span>
          <span className="text-[13px] font-bold" style={{ color: '#92400E' }}>
            Alertas ({porCategoria.alerta.length})
          </span>
        </div>
        {porCategoria.alerta.length === 0 && (
          <div className="text-center py-4 text-[12px] bg-white rounded-2xl"
            style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
            Sin alertas configuradas
          </div>
        )}
        {porCategoria.alerta.map(({ r, i }) => renderItem(r, i))}
        {isAdmin && (
          <button onClick={() => agregar('alerta')}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold cursor-pointer border-2 border-dashed transition-all"
            style={{ borderColor: '#92400E40', color: '#92400E', background: '#FEF3C705' }}>
            + Agregar alerta
          </button>
        )}
      </div>

      {/* Sección Recomendaciones */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">💡</span>
          <span className="text-[13px] font-bold" style={{ color: '#065F46' }}>
            Recomendaciones ({porCategoria.recomendacion.length})
          </span>
        </div>
        {porCategoria.recomendacion.length === 0 && (
          <div className="text-center py-4 text-[12px] bg-white rounded-2xl"
            style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
            Sin recomendaciones configuradas
          </div>
        )}
        {porCategoria.recomendacion.map(({ r, i }) => renderItem(r, i))}
        {isAdmin && (
          <button onClick={() => agregar('recomendacion')}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold cursor-pointer border-2 border-dashed transition-all"
            style={{ borderColor: '#065F4640', color: '#065F46', background: '#D1FAE505' }}>
            + Agregar recomendación
          </button>
        )}
      </div>
    </div>
  )
}