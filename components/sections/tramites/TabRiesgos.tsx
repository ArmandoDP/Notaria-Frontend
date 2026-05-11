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

interface Riesgo {
  nivel:       string
  tipo:        string
  titulo:      string
  desc:        string
}

interface Props {
  riesgos:  Riesgo[]
  color:    string
  isAdmin:  boolean
  onSave:   (riesgos: Riesgo[]) => void
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

  function agregar() {
    onSave([...riesgos, {
      nivel: 'medio',
      tipo:  'Manual obligatoria',
      titulo: 'Nuevo riesgo',
      desc:  '',
    }])
    setExpandido(riesgos.length)
  }

  if (riesgos.length === 0 && !isAdmin) {
    return (
      <div className="text-center py-8 text-[13px] bg-white rounded-2xl"
        style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
        Sin riesgos configurados
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {riesgos.map((r, i) => {
        const nivel    = NIVEL_COLOR[r.nivel] || NIVEL_COLOR.bajo
        const tipo     = TIPO_COLOR[r.tipo]   || { bg: '#F3F4F6', color: '#6B7280' }
        const abierto  = expandido === i

        return (
          <div key={i} className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Header clickeable */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpandido(abierto ? null : i)}
              style={{ background: abierto ? '#FAFAF8' : 'transparent' }}>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex-shrink-0"
                style={{ background: nivel.bg, color: nivel.color }}>
                {r.nivel}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold truncate" style={{ color: '#111' }}>
                  {r.titulo}
                </div>
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

            {/* Detalle expandible */}
            {abierto && (
              <div className="px-4 pb-4 flex flex-col gap-3"
                style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>

                {isAdmin ? (
                  <>
                    {/* Título */}
                    <div className="flex flex-col gap-1 pt-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9C9890' }}>
                        Título
                      </label>
                      <input
                        defaultValue={r.titulo}
                        onBlur={e => actualizar(i, 'titulo', e.target.value)}
                        className="w-full text-[13px] font-semibold outline-none rounded-xl px-3 py-2"
                        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                      />
                    </div>

                    {/* Nivel + Tipo */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9C9890' }}>
                          Nivel de riesgo
                        </label>
                        <div className="flex gap-2">
                          {['alto', 'medio', 'bajo'].map(n => (
                            <button key={n}
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

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9C9890' }}>
                          Tipo de detección
                        </label>
                        <div className="flex flex-col gap-1">
                          {['IA automática', 'Manual obligatoria', 'SLA automático'].map(t => (
                            <button key={t}
                              onClick={() => actualizar(i, 'tipo', t)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer border-none text-left transition-all"
                              style={{
                                background: r.tipo === t ? TIPO_COLOR[t]?.bg : '#F3F4F6',
                                color:      r.tipo === t ? TIPO_COLOR[t]?.color : '#9CA3AF',
                              }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9C9890' }}>
                        Descripción / cómo se maneja
                      </label>
                      <textarea
                        defaultValue={r.desc || r.descripcion || ''}
                        onBlur={e => actualizar(i, 'desc', e.target.value)}
                        rows={3}
                        className="w-full text-[12.5px] outline-none resize-none rounded-xl px-3 py-2"
                        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#444' }}
                        placeholder="Describe cómo se detecta y maneja este riesgo..."
                      />
                    </div>

                    {/* Eliminar */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => eliminar(i)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                        style={{ background: '#FEE2E2', color: '#991B1B' }}>
                        Eliminar riesgo
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-3">
                    <p className="text-[12.5px] leading-relaxed" style={{ color: '#555' }}>
                      {r.desc || r.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Botón agregar */}
      {isAdmin && (
        <button
          onClick={agregar}
          className="w-full py-3 rounded-2xl text-[13px] font-semibold cursor-pointer border-2 border-dashed transition-all"
          style={{ borderColor: `${color}40`, color, background: `${color}05` }}>
          + Agregar riesgo
        </button>
      )}
    </div>
  )
}