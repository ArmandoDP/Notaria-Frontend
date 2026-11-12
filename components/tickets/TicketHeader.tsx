import { formatDistanceToNowStrict, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import t from './ticket.module.css'
import { Ic, inicialesTramite } from './ticketUi'

interface Props {
  ticket:     any
  estado:     string
  documentos: any[]
}

const ESTADOS: Record<string, string> = {
  nuevo:         'Nuevo',
  asignado:      'Asignado',
  folio_dba:     'Folio DBA',
  escritura_dba: 'Escritura DBA',
  completado:    'Completado',
  cancelado:     'Cancelado',
}

export default function TicketHeader({ ticket, estado, documentos }: Props) {
  const tramite = ticket.tramites_config
  const area    = ticket.areas
  const final   = estado === 'completado' || estado === 'cancelado'
  const vence   = ticket.sla_vence_at ? new Date(ticket.sla_vence_at) : null
  const vencido = !final && !!vence && isPast(vence)
  const tiempo  = vence ? formatDistanceToNowStrict(vence, { locale: es }) : ''

  const obligatorios = documentos.filter((d: any) => d.doc_tipos_config?.obligatorio)
  const validados    = obligatorios.filter((d: any) => d.estado === 'validado')
  const progreso     = obligatorios.length ? Math.round((validados.length / obligatorios.length) * 100) : 0

  return (
    <header className={`${t.hero} ${vencido ? t.heroLate : ''}`}>
      <div className={t.heroTop}>
        <span className={t.tile}>{inicialesTramite(tramite?.nombre)}</span>
        <div className={t.heroText}>
          <div className={t.numero}>{ticket.numero}</div>
          <h1>{tramite?.nombre || 'Trámite'}</h1>
          <div className={t.meta}>
            {area?.nombre && (
              <span className={t.metaChip} style={{ animationDelay: '.2s' }}><Ic n="area" size={13} />{area.nombre}</span>
            )}
            {vence && !final && (
              <span className={`${t.metaChip} ${vencido ? t.metaRed : ''}`} style={{ animationDelay: '.26s' }} title={vence.toLocaleString('es-MX')}>
                <Ic n="clock" size={13} />
                {vencido ? `Vencido hace ${tiempo}` : `Vence en ${tiempo}`}
              </span>
            )}
            {ticket.folio_dba && (
              <span className={`${t.metaChip} ${t.metaMono}`} style={{ animationDelay: '.32s' }}><Ic n="folio" size={13} />DBA {ticket.folio_dba}</span>
            )}
            {ticket.folio_escritura && (
              <span className={`${t.metaChip} ${t.metaMono}`} style={{ animationDelay: '.38s' }}><Ic n="folio" size={13} />Esc. {ticket.folio_escritura}</span>
            )}
          </div>
        </div>
        <span className={`${t.estadoBadge} ${estado === 'cancelado' ? t.estadoCancel : ''}`}>{ESTADOS[estado] || estado}</span>
      </div>

      {obligatorios.length > 0 && (
        <div className={t.progressWrap}>
          <div className={t.progressRow}>
            <span>Documentos obligatorios validados · {validados.length} de {obligatorios.length}</span>
            <b>{progreso}%</b>
          </div>
          <div className={t.bar}><i style={{ ['--w' as any]: `${progreso}%` }} /></div>
        </div>
      )}
    </header>
  )
}