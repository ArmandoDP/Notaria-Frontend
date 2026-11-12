import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import s from './tabs.module.css'
import { Ic } from '../ticketUi'

interface Props {
  eventos: any[]
}

const TIPO: Record<string, { icono: string; tono?: 'dark' | 'red' }> = {
  estado_cambio:        { icono: 'chevron', tono: 'dark' },
  reasignacion:         { icono: 'undo' },
  folio_dba:            { icono: 'folio', tono: 'dark' },
  folio_escritura:      { icono: 'folio', tono: 'dark' },
  doc_subido:           { icono: 'upload' },
  validacion_documento: { icono: 'check', tono: 'dark' },
  wa_enviado:           { icono: 'wa' },
  nota:                 { icono: 'doc' },
}

function etiquetaDia(fecha: Date) {
  if (isToday(fecha)) return 'Hoy'
  if (isYesterday(fecha)) return 'Ayer'
  return format(fecha, "d 'de' MMMM yyyy", { locale: es })
}

export default function TabHistorial({ eventos }: Props) {
  const ordenados = [...eventos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (ordenados.length === 0) {
    return <div className={s.wrap}><div className={s.empty}><b>Sin historial</b><span>Las acciones del expediente aparecerán aquí.</span></div></div>
  }

  let diaAnterior = ''
  return (
    <div className={s.wrap}>
      <div className={s.timeline}>
        {ordenados.map((ev, i) => {
          const fecha = new Date(ev.created_at)
          const dia = etiquetaDia(fecha)
          const mostrarDia = dia !== diaAnterior
          diaAnterior = dia
          const cancelado = /cancelad/i.test(ev.descripcion || '')
          const cfg = TIPO[ev.tipo] || { icono: 'clock' }
          const tono = cancelado ? 'red' : cfg.tono
          const usuario = ev.usuarios_sistema
          return (
            <div key={ev.id || i}>
              {mostrarDia && <div className={s.dayTitle}>{dia}</div>}
              <div className={s.event} style={{ animationDelay: `${Math.min(i, 14) * 40}ms` }}>
                <span className={`${s.evDot} ${tono === 'dark' ? s.evDotDark : tono === 'red' ? s.evDotRed : ''}`}>
                  <Ic n={cfg.icono} size={12} sw={2.2} />
                </span>
                <p>{ev.descripcion}</p>
                <div className={s.evMeta}>
                  <span>{format(fecha, 'HH:mm')}</span>
                  {usuario ? (
                    <span className={s.who} title={usuario.email}>
                      <span className={s.whoAv}>{usuario.avatar_letras || (usuario.nombre || '?').slice(0, 2).toUpperCase()}</span>
                      {usuario.nombre}{usuario.areas?.nombre ? ` · ${usuario.areas.nombre}` : ''}
                    </span>
                  ) : (
                    <span className={s.who}><span className={s.whoAv} style={{ background: '#a3a3a3' }}>S</span>Sistema</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}