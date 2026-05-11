interface RespuestaPregunta {
  pregunta:  string
  respuesta: string
  orden:     number
}

interface Props {
  respuestas:  RespuestaPregunta[]
  color:       string
  onUpdate:    (index: number, value: string) => void
}

export default function SeccionPreguntas({ respuestas, color, onUpdate }: Props) {
  if (respuestas.length === 0) return null

  const respondidas = respuestas.filter(r => r.respuesta.trim()).length

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: '#FAFAF8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div>
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>Preguntas clave del trámite</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
            Responde las preguntas que el cliente ya haya contestado — opcional
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold"
            style={{ color: respondidas === respuestas.length ? '#065F46' : '#92400E' }}>
            {respondidas}/{respuestas.length}
          </span>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width:      `${(respondidas / respuestas.length) * 100}%`,
                background: color,
              }} />
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {respuestas.map((r, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 mt-0.5"
                style={{ background: r.respuesta.trim() ? color : '#9CA3AF' }}>
                {r.respuesta.trim() ? '✓' : i + 1}
              </div>
              <span className="text-[12.5px] font-medium leading-snug" style={{ color: '#333' }}>
                {r.pregunta}
              </span>
            </div>
            <textarea
              value={r.respuesta}
              onChange={e => onUpdate(i, e.target.value)}
              rows={2}
              placeholder="Respuesta del cliente... (opcional)"
              className="w-full text-[12.5px] outline-none resize-none rounded-xl px-3 py-2"
              style={{
                background: '#F7F7F5',
                border:     '1px solid rgba(0,0,0,0.08)',
                color:      '#333',
                marginLeft: '28px',
                width:      'calc(100% - 28px)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}