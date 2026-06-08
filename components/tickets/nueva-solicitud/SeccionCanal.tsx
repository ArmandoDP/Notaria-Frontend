const CANALES = [
  { id: 'front_desk',   label: 'Recepción',  icon: '🏢' },
  { id: 'whatsapp',     label: 'WhatsApp',     icon: '💬' },
  { id: 'telefono',     label: 'Teléfono',     icon: '📞' },
  { id: 'mail',         label: 'Correo',       icon: '✉️'  },
  { id: 'whatsapp_vip', label: 'WhatsApp VIP', icon: '⭐' },
]

interface Props {
  canal:    string
  onChange: (canal: string) => void
}

export default function SeccionCanal({ canal, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: '#9C9890' }}>
        Canal de entrada
      </div>
      <div className="flex gap-2 flex-wrap">
        {CANALES.map(c => (
          <button key={c.id} type="button" onClick={() => onChange(c.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer border-none"
            style={{
              background: canal === c.id ? '#111' : 'rgba(0,0,0,0.04)',
              color:      canal === c.id ? '#fff' : '#666',
              boxShadow:  canal === c.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
            }}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>
    </div>
  )
}