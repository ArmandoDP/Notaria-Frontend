// ← preguntas clave

interface Props {
  preguntas: string[]
  color:     string
  isAdmin:   boolean
  onSave:    (valor: string[]) => void
}

export default function TabPreguntas({ preguntas, color, isAdmin, onSave }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
        <div>
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>Preguntas clave del equipo</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
            Preguntas que el agente debe hacer al cliente antes de crear el ticket
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => onSave([...preguntas, 'Nueva pregunta'])}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
            style={{ background: `${color}15`, color }}>
            + Agregar
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        {preguntas.length === 0 && (
          <p className="text-center py-6 text-[13px]" style={{ color: '#CCC' }}>
            Sin preguntas configuradas
          </p>
        )}
        {preguntas.map((p, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl group"
            style={{ background: '#F7F7F5' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 text-white"
              style={{ background: color }}>
              {i + 1}
            </div>
            {isAdmin ? (
              <input
                defaultValue={p}
                onBlur={e => {
                  const n = [...preguntas]
                  n[i] = e.target.value
                  onSave(n)
                }}
                className="flex-1 text-[13px] bg-transparent border-none outline-none"
                style={{ color: '#333' }}
              />
            ) : (
              <span className="flex-1 text-[13px]" style={{ color: '#333' }}>{p}</span>
            )}
            {isAdmin && (
              <button
                onClick={() => onSave(preguntas.filter((_, idx) => idx !== i))}
                className="opacity-0 group-hover:opacity-100 text-[11px] cursor-pointer border-none bg-transparent"
                style={{ color: '#E24B4A' }}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}