import s from './nuevaSolicitud.module.css'

const CATEGORIAS = [
  { key: 'riesgo',        label: 'Riesgos' },
  { key: 'alerta',        label: 'Alertas' },
  { key: 'recomendacion', label: 'Recomendaciones' },
]

interface Props {
  riesgos: any[]
  numero?: number
}

export default function SeccionRiesgos({ riesgos, numero = 3 }: Props) {
  if (!riesgos || riesgos.length === 0) return null

  const grupos = CATEGORIAS
    .map(c => ({
      ...c,
      items: riesgos.filter(r => (r.categoria || 'riesgo') === c.key),
    }))
    .filter(g => g.items.length > 0)

  if (grupos.length === 0) return null
  const altos = riesgos.filter(r => r.nivel === 'alto').length

  return (
    <section className={s.section}>
      <header className={s.secHead}>
        <span className={s.secNum}>{numero}</span>
        <div className={s.secText}>
          <h2>Consideraciones</h2>
          <p>Riesgos, alertas y recomendaciones de este trámite · solo informativo</p>
        </div>
        {altos > 0 && <span className={s.secAside} style={{ color: '#b42318' }}>{altos} de riesgo alto</span>}
      </header>
      <div className={s.secBody}>
        {grupos.map(g => (
          <div key={g.key} className={s.riskGroup}>
            <div className={`${s.riskTitle} ${g.key === 'riesgo' ? s.riskTitleRed : ''}`}>
              {g.label} ({g.items.length})
            </div>
            {g.items.map((r, i) => {
              const nivel = (r.nivel || 'bajo').toLowerCase()
              return (
                <div
                  key={i}
                  className={`${s.risk} ${nivel === 'alto' ? s.riskAlto : nivel === 'medio' ? s.riskMedio : ''}`}
                >
                  <span className={`${s.level} ${nivel === 'alto' ? s.levelAlto : nivel === 'medio' ? s.levelMedio : ''}`}>
                    {nivel}
                  </span>
                  <div>
                    <h4>
                      {r.titulo}
                      {r.tipo && <span className={s.tipo}>{r.tipo}</span>}
                    </h4>
                    {(r.desc || r.descripcion) && <p>{r.desc || r.descripcion}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}