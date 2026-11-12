import t from './ticket.module.css'
import { Ic } from './ticketUi'

const ETAPAS = [
  { id: 'nuevo',         label: 'Nuevo',         manual: true  },
  { id: 'asignado',      label: 'Asignado',      manual: true  },
  { id: 'folio_dba',     label: 'Folio DBA',     manual: false },
  { id: 'escritura_dba', label: 'Escritura DBA', manual: false },
  { id: 'completado',    label: 'Completado',    manual: false },
]

interface Props {
  estado:   string
  saving:   boolean
  onChange: (estado: string) => void
}

export default function TicketEstado({ estado, saving, onChange }: Props) {
  const cancelado = estado === 'cancelado'
  const actual = ETAPAS.findIndex(e => e.id === estado)
  const avance = actual <= 0 ? 0 : actual / (ETAPAS.length - 1)
  const editable = !saving && !cancelado && estado !== 'completado'

  return (
    <section className={t.card}>
      <div className={t.cardHead}>
        <span className={t.cardTitle}>Etapa del expediente</span>
        {saving && <span className={t.spin} aria-label="Guardando" />}
        {cancelado && <span style={{ fontSize: '.74rem', fontWeight: 700, color: '#b42318' }}>Expediente cancelado</span>}
      </div>
      <div className={t.stepper}>
        <div className={t.track}><i style={{ ['--w' as any]: `${cancelado ? 0 : avance * 100}%` }} /></div>
        {ETAPAS.map((e, i) => {
          const hecho = !cancelado && i < actual
          const ahora = !cancelado && i === actual
          const clic = editable && e.manual && !ahora
          return (
            <button
              key={e.id}
              type="button"
              disabled={!clic}
              onClick={() => clic && onChange(e.id)}
              className={[t.step, hecho ? t.stepDone : '', ahora ? t.stepNow : '', clic ? t.stepClick : ''].join(' ')}
              title={clic ? `Cambiar a ${e.label}` : undefined}
              aria-current={ahora ? 'step' : undefined}
            >
              <span className={t.stepDot}>{hecho ? <Ic n="check" size={14} sw={2.6} /> : i + 1}</span>
              <span className={t.stepLabel}>{e.label}</span>
            </button>
          )
        })}
      </div>
      {editable && (
        <div className={t.stepHint}>
          Puedes cambiar entre Nuevo y Asignado aquí. Folio DBA y Escritura avanzan al vincular su folio.
        </div>
      )}
    </section>
  )
}