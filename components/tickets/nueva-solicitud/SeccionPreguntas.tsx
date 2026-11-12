import s from './nuevaSolicitud.module.css'

interface RespuestaPregunta {
  pregunta:  string
  respuesta: string
  orden:     number
}

interface Props {
  respuestas: RespuestaPregunta[]
  color?:     string
  onUpdate:   (index: number, value: string) => void
  numero?:    number
}

export default function SeccionPreguntas({ respuestas, onUpdate, numero = 4 }: Props) {
  if (respuestas.length === 0) return null
  const respondidas = respuestas.filter(r => r.respuesta.trim()).length

  return (
    <section className={s.section}>
      <header className={s.secHead}>
        <span className={s.secNum}>{numero}</span>
        <div className={s.secText}>
          <h2>Preguntas clave</h2>
          <p>Captura lo que el cliente ya haya respondido · opcional</p>
        </div>
        <span className={s.secAside}>
          {respondidas}/{respuestas.length}
          <span className={s.progress}><i style={{ width: `${(respondidas / respuestas.length) * 100}%` }} /></span>
        </span>
      </header>
      <div className={s.secBody}>
        <div className={s.questions}>
          {respuestas.map((r, i) => {
            const ok = !!r.respuesta.trim()
            return (
              <div key={i}>
                <label className={s.qHead} htmlFor={`ns-preg-${i}`}>
                  <span className={`${s.qNum} ${ok ? s.qNumOk : ''}`}>{ok ? '✓' : i + 1}</span>
                  <span>{r.pregunta}</span>
                </label>
                <textarea
                  id={`ns-preg-${i}`}
                  value={r.respuesta}
                  onChange={e => onUpdate(i, e.target.value)}
                  rows={2}
                  placeholder="Respuesta del cliente"
                  className={`${s.textarea} ${s.qAnswer}`}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}