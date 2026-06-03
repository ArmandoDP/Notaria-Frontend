'use client'

type EstadoPaso = 'pendiente' | 'activo' | 'listo'

interface Paso {
  label:  string
  estado: EstadoPaso
}

interface Props {
  pasos: Paso[]
}

export default function ModalCreandoTicket({ pasos }: Props) {
  const totalListos = pasos.filter(p => p.estado === 'listo').length
  const progreso    = Math.round((totalListos / pasos.length) * 100)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>

      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F3F4F6' }}>
              <span className="text-[20px]">📋</span>
            </div>
            <div>
              <div className="text-[15px] font-bold" style={{ color: '#111' }}>
                Creando expediente
              </div>
              <div className="text-[11px]" style={{ color: '#9C9890' }}>
                Por favor espera un momento...
              </div>
            </div>
          </div>

          {/* Pasos */}
          <div className="flex flex-col gap-3 mb-5">
            {pasos.map((paso, i) => (
              <div key={i} className="flex items-center gap-3">

                {/* Indicador */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: paso.estado === 'listo'  ? '#EAF3DE' :
                                paso.estado === 'activo' ? '#E6F1FB' : '#F3F4F6',
                  }}>
                  {paso.estado === 'listo' ? (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="#3B6D11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : paso.estado === 'activo' ? (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#185FA5',
                      animation: 'pulse 1s ease-in-out infinite',
                    }} />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB' }} />
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 13,
                  color:      paso.estado === 'listo'  ? '#3B6D11' :
                              paso.estado === 'activo' ? '#111'    : '#9CA3AF',
                  fontWeight: paso.estado === 'activo' ? 600 : 400,
                  transition: 'all .3s ease',
                  flex: 1,
                }}>
                  {paso.label}
                </span>

                {/* Dots animados en paso activo */}
                {paso.estado === 'activo' && (
                  <div className="flex gap-1 flex-shrink-0">
                    {[0,1,2].map(j => (
                      <div key={j} style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: '#185FA5',
                        animation: `bounce 1.2s ease-in-out ${j * .2}s infinite`,
                        opacity: .7,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Barra de progreso */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              background: '#111',
              width: `${progreso}%`,
              transition: 'width .5s ease',
            }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px]" style={{ color: '#9C9890' }}>
              {totalListos} de {pasos.length} completados
            </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: '#111' }}>
              {progreso}%
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:.6} }
          @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        `}</style>
      </div>
    </div>
  )
}