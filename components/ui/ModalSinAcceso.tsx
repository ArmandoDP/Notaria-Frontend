interface Props {
  accion:   string
  onCerrar: () => void
}

export default function ModalSinAcceso({ accion, onCerrar }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onCerrar}>
      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>

        <div className="px-6 pt-6 pb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-[28px]"
            style={{ background: '#FEE2E2' }}>
            🔒
          </div>
          <div className="text-[16px] font-bold mb-2" style={{ color: '#111' }}>
            Acceso restringido
          </div>
          <div className="text-[13px] leading-relaxed mb-3" style={{ color: '#555' }}>
            No tienes permisos para <strong style={{ color: '#111' }}>{accion}</strong>.
          </div>
          <div className="px-3 py-2.5 rounded-xl text-[12px] leading-relaxed"
            style={{ background: '#FEF3C7', color: '#92400E' }}>
            ⚠️ Esta acción está reservada para el Notario, Asistente o Notario Auxiliar. Contacta a tu supervisor si necesitas acceso.
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />

        <div className="px-6 py-4">
          <button onClick={onCerrar}
            className="w-full py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
            style={{ background: '#111', color: '#fff' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}