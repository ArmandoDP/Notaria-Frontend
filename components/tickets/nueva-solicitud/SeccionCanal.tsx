import s from './nuevaSolicitud.module.css'

const CANALES = [
  { id: 'front_desk',   label: 'Recepción',    icono: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { id: 'whatsapp',     label: 'WhatsApp',     icono: 'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z' },
  { id: 'telefono',     label: 'Teléfono',     icono: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z' },
  { id: 'mail',         label: 'Correo',       icono: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM22 7l-10 7L2 7' },
  { id: 'whatsapp_vip', label: 'WhatsApp VIP', icono: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z' },
]

export const nombreCanal = (id: string) => CANALES.find(c => c.id === id)?.label || id

interface Props {
  canal:    string
  onChange: (canal: string) => void
  numero?:  number
}

export default function SeccionCanal({ canal, onChange, numero = 1 }: Props) {
  return (
    <section className={s.section}>
      <header className={s.secHead}>
        <span className={s.secNum}>{numero}</span>
        <div className={s.secText}>
          <h2>Canal de entrada</h2>
          <p>¿Por dónde llegó el cliente?</p>
        </div>
      </header>
      <div className={s.secBody}>
        <div className={s.canales} role="radiogroup" aria-label="Canal de entrada">
          {CANALES.map(c => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={canal === c.id}
              onClick={() => onChange(c.id)}
              className={`${s.canal} ${canal === c.id ? s.canalOn : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={c.icono} />
              </svg>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}