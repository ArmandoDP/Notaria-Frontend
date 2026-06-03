interface Props {
  ticket:      any
  rolLabel?:   string
  onConfirmar: () => void
  onCancelar:  () => void
}

export default function ModalCopiarLink({ ticket, rolLabel, onConfirmar, onCancelar }: Props) {
  const esOperacion = !rolLabel
  const titulo      = esOperacion ? 'Enviar link de carga' : `Enviar link — ${rolLabel}`
  const descripcion = esOperacion
    ? 'Al copiar este link se notificará a todo el equipo del área que el link fue enviado al cliente.'
    : `Al copiar este link del ${rolLabel} se notificará al área que fue enviado al cliente correspondiente.`

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onCancelar}>
      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-[22px]"
            style={{ background: '#E6F1FB' }}>
            🔗
          </div>
          <div className="text-[16px] font-bold mb-1.5" style={{ color: '#111' }}>
            {titulo}
          </div>
          <div className="text-[13px] leading-relaxed" style={{ color: '#666' }}>
            {descripcion}
          </div>
        </div>

        <div className="mx-6 mb-4 px-4 py-3 rounded-xl"
          style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9C9890' }}>
            Ticket
          </div>
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>{ticket.numero}</div>
          <div className="text-[12px]" style={{ color: '#666' }}>{ticket.tramites_config?.nombre}</div>
        </div>

        <div className="mx-6 mb-5 px-4 py-3 rounded-xl flex items-start gap-2"
          style={{ background: '#FEF3C7', border: '1px solid rgba(184,130,10,0.2)' }}>
          <span className="text-[14px] flex-shrink-0">⚠️</span>
          <div className="text-[12px] leading-relaxed" style={{ color: '#92400E' }}>
            Asegúrate de enviarle el link al cliente inmediatamente. El equipo recibirá una notificación confirmando el envío.
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />

        <div className="flex gap-3 px-6 py-4">
          <button onClick={onCancelar}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
            style={{ background: '#F3F4F6', color: '#444' }}>
            Cancelar
          </button>
          <button onClick={onConfirmar}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
            style={{ background: '#185FA5', color: '#fff', boxShadow: '0 4px 12px rgba(24,95,165,0.3)' }}>
            📋 Copiar link
          </button>
        </div>
      </div>
    </div>
  )
}