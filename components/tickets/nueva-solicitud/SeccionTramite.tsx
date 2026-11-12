import s from './nuevaSolicitud.module.css'

interface Props {
  tramites:        any[]
  areas:           any[]
  tramiteId:       string
  areaId:          string
  onTramiteChange: (id: string) => void
  onAreaChange:    (id: string) => void
  numero?:         number
}

export default function SeccionTramite({ tramites, areas, tramiteId, areaId, onTramiteChange, onAreaChange, numero = 2 }: Props) {
  const tramiteSeleccionado = tramites.find(t => t.id === tramiteId)
  const ordenados = [...tramites].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <section className={s.section}>
      <header className={s.secHead}>
        <span className={s.secNum}>{numero}</span>
        <div className={s.secText}>
          <h2>Trámite</h2>
          <p>Tipo de trámite y área que lo atenderá</p>
        </div>
      </header>
      <div className={s.secBody}>
        <div className={s.grid2}>
          <div>
            <label className={s.label} htmlFor="ns-tramite">Trámite</label>
            <select
              id="ns-tramite"
              value={tramiteId}
              onChange={e => onTramiteChange(e.target.value)}
              required
              className={`${s.select} ${!tramiteId ? s.selectEmpty : ''}`}
            >
              <option value="">Seleccionar trámite…</option>
              {ordenados.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={s.label} htmlFor="ns-area">Área responsable</label>
            <select
              id="ns-area"
              value={areaId}
              onChange={e => onAreaChange(e.target.value)}
              required
              className={`${s.select} ${!areaId ? s.selectEmpty : ''}`}
            >
              <option value="">Seleccionar área…</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>

        {tramiteSeleccionado && (
          <div className={s.info}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            <div>
              <b>Plazo: {tramiteSeleccionado.sla_dias_total} días hábiles.</b>
              {tramiteSeleccionado.descripcion ? ` ${tramiteSeleccionado.descripcion}` : ''}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}