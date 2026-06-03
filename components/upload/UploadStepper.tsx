interface Paso {
  label:    string
  sublabel: string
  tipo:     'datos' | 'docs'
}

interface Props {
  pasos:        Paso[]
  pasoActual:   number
  color:        string
}

export default function UploadStepper({ pasos, pasoActual, color }: Props) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Barra de progreso */}
        <div style={{ height: '4px', background: '#F3F4F6', borderRadius: '99px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px', background: color,
            width: `${((pasoActual + 1) / pasos.length) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {pasos.map((paso, i) => {
            const activo    = i === pasoActual
            const completado = i < pasoActual
            return (
              <div key={i} style={{
                flex: 1, minWidth: '80px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                opacity: i > pasoActual ? 0.4 : 1,
                transition: 'opacity 0.3s',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0,
                  background: completado ? color : activo ? color : '#F3F4F6',
                  color:      completado ? '#fff' : activo ? '#fff' : '#9CA3AF',
                  boxShadow:  activo ? `0 0 0 3px ${color}30` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {completado ? '✓' : i + 1}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: activo ? 700 : 500, color: activo ? '#111' : '#666', whiteSpace: 'nowrap' }}>
                    {paso.label}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9C9890', whiteSpace: 'nowrap' }}>
                    {paso.sublabel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}