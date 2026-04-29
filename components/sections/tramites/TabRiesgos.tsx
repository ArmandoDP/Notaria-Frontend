// ← riesgos y alertas

const NIVEL_COLOR: Record<string, { bg: string, color: string }> = {
  alto:  { bg: '#FEE2E2', color: '#991B1B' },
  medio: { bg: '#FEF3C7', color: '#92400E' },
  bajo:  { bg: '#D1FAE5', color: '#065F46' },
}

const TIPO_COLOR: Record<string, { bg: string, color: string }> = {
  'IA automática':    { bg: '#E6F1FB', color: '#185FA5' },
  'Manual obligatoria': { bg: '#F3F4F6', color: '#6B7280' },
  'SLA automático':   { bg: '#EDE9FE', color: '#4C1D95' },
}

interface Props {
  riesgos: any[]
}

export default function TabRiesgos({ riesgos }: Props) {
  if (riesgos.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] bg-white rounded-2xl"
        style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
        Sin riesgos configurados
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {riesgos.map((r: any, i: number) => {
        const nivel = NIVEL_COLOR[r.nivel] || NIVEL_COLOR.bajo
        const tipo  = TIPO_COLOR[r.tipo]   || { bg: '#F3F4F6', color: '#6B7280' }

        return (
          <div key={i} className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-start gap-3">

              {/* Nivel */}
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex-shrink-0 mt-0.5"
                style={{ background: nivel.bg, color: nivel.color }}>
                {r.nivel}
              </span>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[13px] font-bold" style={{ color: '#111' }}>{r.titulo}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{ background: tipo.bg, color: tipo.color }}>
                    {r.tipo}
                  </span>
                </div>
                {(r.desc || r.descripcion) && (
                  <p className="text-[12px] leading-relaxed" style={{ color: '#666' }}>
                    {r.desc || r.descripcion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}