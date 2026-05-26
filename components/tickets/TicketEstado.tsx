const ESTADOS = [
  { id: 'nuevo',     label: 'Nuevo',     color: '#534AB7' },
  { id: 'asignado',  label: 'Asignado',  color: '#185FA5' },
]

interface Props {
  estado:  string
  saving:  boolean
  onChange: (estado: string) => void
}

export default function TicketEstado({ estado, saving, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
        Estado del ticket
      </div>
      <div className="flex gap-2">
        {ESTADOS.map(e => (
          <button key={e.id} type="button"
            onClick={() => onChange(e.id)}
            disabled={saving}
            className="flex-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border-none"
            style={{
              background: estado === e.id ? e.color : `${e.color}14`,
              color:      estado === e.id ? '#fff' : e.color,
              boxShadow:  estado === e.id ? `0 3px 10px ${e.color}40` : 'none',
            }}>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  )
}