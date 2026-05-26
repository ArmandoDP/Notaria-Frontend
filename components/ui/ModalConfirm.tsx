'use client'

interface Props {
  titulo:     string
  descripcion: string
  labelConfirm?: string
  labelCancel?:  string
  peligroso?:    boolean
  onConfirm:  () => void
  onCancel:   () => void
}

export default function ModalConfirm({
  titulo, descripcion,
  labelConfirm = 'Confirmar',
  labelCancel  = 'Cancelar',
  peligroso    = false,
  onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>

      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: peligroso ? '#FEE2E2' : '#F3F4F6' }}>
            <span className="text-[18px]">{peligroso ? '🗑' : '⚠️'}</span>
          </div>
          <div className="text-[16px] font-bold mb-1.5" style={{ color: '#111' }}>
            {titulo}
          </div>
          <div className="text-[13px] leading-relaxed" style={{ color: '#666' }}>
            {descripcion}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />

        {/* Botones */}
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none transition-all"
            style={{ background: '#F3F4F6', color: '#444' }}>
            {labelCancel}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none transition-all"
            style={{
              background: peligroso ? '#E24B4A' : '#111',
              color: '#fff',
              boxShadow: peligroso ? '0 4px 12px rgba(226,75,74,0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
            }}>
            {labelConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}