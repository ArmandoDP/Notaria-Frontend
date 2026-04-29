// ← etapas del proceso

interface Props {
  etapas:  any[]
  color:   string
  isAdmin: boolean
  onSave:  (etapas: any[]) => void
}

export default function TabSLA({ etapas, color, isAdmin, onSave }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
        <div className="text-[13px] font-bold" style={{ color: '#111' }}>SLA por etapa del proceso</div>
        {isAdmin && (
          <button
            onClick={() => onSave([...etapas, { etapa: 'Nueva etapa', dias_max: 1, texto_alerta: '' }])}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
            style={{ background: `${color}15`, color }}>
            + Etapa
          </button>
        )}
      </div>

      {etapas.length === 0 && (
        <div className="text-center py-8 text-[13px]" style={{ color: '#CCC' }}>Sin etapas configuradas</div>
      )}

      {etapas.map((etapa: any, i: number) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4 border-b last:border-b-0 group"
          style={{ borderColor: 'rgba(0,0,0,0.05)' }}>

          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 mt-0.5"
            style={{ background: color }}>
            {i + 1}
          </div>

          <div className="flex-1">
            {isAdmin ? (
              <input
                defaultValue={etapa.etapa}
                onBlur={e => {
                  const n = [...etapas]
                  n[i] = { ...n[i], etapa: e.target.value }
                  onSave(n)
                }}
                className="text-[13px] font-semibold w-full bg-transparent border-none outline-none mb-1"
                style={{ color: '#111' }}
              />
            ) : (
              <div className="text-[13px] font-semibold mb-1" style={{ color: '#111' }}>{etapa.etapa}</div>
            )}
            {etapa.texto_alerta && (
              <p className="text-[11.5px]" style={{ color: '#9C9890' }}>{etapa.texto_alerta}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin ? (
              <input
                type="number"
                defaultValue={etapa.dias_max}
                onBlur={e => {
                  const n = [...etapas]
                  n[i] = { ...n[i], dias_max: parseInt(e.target.value) }
                  onSave(n)
                }}
                className="w-12 text-center text-[14px] font-bold font-mono outline-none rounded-lg p-1 border-none"
                style={{ background: `${color}15`, color }}
              />
            ) : (
              <span className="text-[14px] font-bold font-mono px-2" style={{ color }}>{etapa.dias_max}</span>
            )}
            <span className="text-[10px]" style={{ color: '#9C9890' }}>días</span>
          </div>
        </div>
      ))}
    </div>
  )
}