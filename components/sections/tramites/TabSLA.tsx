interface Etapa {
  etapa:          string
  dias_max:       number
  horas_max:      number
  minutos_max:    number
  texto_alerta:   string
}

interface Props {
  etapas:  Etapa[]
  color:   string
  isAdmin: boolean
  onSave:  (etapas: Etapa[]) => void
}

const ETAPA_ICONS = ['1️⃣', '2️⃣', '3️⃣']

export default function TabSLA({ etapas, color, isAdmin, onSave }: Props) {

  function actualizar(i: number, campo: string, valor: any) {
    const n = [...etapas]
    n[i] = { ...n[i], [campo]: valor }
    onSave(n)
  }

  function formatTiempo(e: Etapa) {
    const partes = []
    if (e.dias_max > 0)     partes.push(`${e.dias_max}d`)
    if (e.horas_max > 0)    partes.push(`${e.horas_max}h`)
    if (e.minutos_max > 0)  partes.push(`${e.minutos_max}m`)
    return partes.length > 0 ? partes.join(' ') : '0h'
  }

  return (
    <div className="flex flex-col gap-3">
      {etapas.map((etapa, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          {/* Header etapa */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: `${color}08`, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <span className="text-[18px]">{ETAPA_ICONS[i] || '▸'}</span>
              <div>
                <div className="text-[13px] font-bold" style={{ color: '#111' }}>
                  {etapa.etapa}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
                  {etapa.texto_alerta}
                </div>
              </div>
            </div>
            {/* Tiempo total badge */}
            <div className="px-3 py-1.5 rounded-xl font-mono text-[13px] font-bold flex-shrink-0"
              style={{ background: `${color}15`, color }}>
              {formatTiempo(etapa)}
            </div>
          </div>

          {/* Controles de tiempo */}
          {isAdmin && (
            <div className="px-5 py-4">
              <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
                Tiempo máximo
              </div>
              <div className="grid grid-cols-3 gap-3">

                {/* Días */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold" style={{ color: '#666' }}>Días</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actualizar(i, 'dias_max', Math.max(0, (etapa.dias_max || 0) - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] cursor-pointer border-none font-bold"
                      style={{ background: '#F3F4F6', color: '#666' }}>
                      −
                    </button>
                    <input
                      type="number"
                      value={etapa.dias_max || 0}
                      min={0}
                      onChange={e => actualizar(i, 'dias_max', parseInt(e.target.value) || 0)}
                      className="flex-1 text-center text-[16px] font-bold font-mono outline-none rounded-lg p-1.5 border-none"
                      style={{ background: `${color}10`, color }}
                    />
                    <button
                      onClick={() => actualizar(i, 'dias_max', (etapa.dias_max || 0) + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] cursor-pointer border-none font-bold"
                      style={{ background: `${color}20`, color }}>
                      +
                    </button>
                  </div>
                </div>

                {/* Horas */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold" style={{ color: '#666' }}>Horas</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actualizar(i, 'horas_max', Math.max(0, (etapa.horas_max || 0) - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] cursor-pointer border-none font-bold"
                      style={{ background: '#F3F4F6', color: '#666' }}>
                      −
                    </button>
                    <input
                      type="number"
                      value={etapa.horas_max || 0}
                      min={0}
                      max={23}
                      onChange={e => actualizar(i, 'horas_max', Math.min(23, parseInt(e.target.value) || 0))}
                      className="flex-1 text-center text-[16px] font-bold font-mono outline-none rounded-lg p-1.5 border-none"
                      style={{ background: `${color}10`, color }}
                    />
                    <button
                      onClick={() => actualizar(i, 'horas_max', Math.min(23, (etapa.horas_max || 0) + 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] cursor-pointer border-none font-bold"
                      style={{ background: `${color}20`, color }}>
                      +
                    </button>
                  </div>
                </div>

                {/* Minutos */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold" style={{ color: '#666' }}>Minutos</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actualizar(i, 'minutos_max', Math.max(0, (etapa.minutos_max || 0) - 15))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] cursor-pointer border-none font-bold"
                      style={{ background: '#F3F4F6', color: '#666' }}>
                      −
                    </button>
                    <input
                      type="number"
                      value={etapa.minutos_max || 0}
                      min={0}
                      max={59}
                      step={15}
                      onChange={e => actualizar(i, 'minutos_max', Math.min(59, parseInt(e.target.value) || 0))}
                      className="flex-1 text-center text-[16px] font-bold font-mono outline-none rounded-lg p-1.5 border-none"
                      style={{ background: `${color}10`, color }}
                    />
                    <button
                      onClick={() => actualizar(i, 'minutos_max', Math.min(59, (etapa.minutos_max || 0) + 15))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] cursor-pointer border-none font-bold"
                      style={{ background: `${color}20`, color }}>
                      +
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Vista solo lectura */}
          {!isAdmin && (
            <div className="px-5 py-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-[22px] font-bold font-mono" style={{ color }}>
                    {etapa.dias_max || 0}
                  </div>
                  <div className="text-[10px]" style={{ color: '#9C9890' }}>días</div>
                </div>
                <div className="text-[18px]" style={{ color: '#DDD' }}>:</div>
                <div className="text-center">
                  <div className="text-[22px] font-bold font-mono" style={{ color }}>
                    {String(etapa.horas_max || 0).padStart(2, '0')}
                  </div>
                  <div className="text-[10px]" style={{ color: '#9C9890' }}>horas</div>
                </div>
                <div className="text-[18px]" style={{ color: '#DDD' }}>:</div>
                <div className="text-center">
                  <div className="text-[22px] font-bold font-mono" style={{ color }}>
                    {String(etapa.minutos_max || 0).padStart(2, '0')}
                  </div>
                  <div className="text-[10px]" style={{ color: '#9C9890' }}>minutos</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}