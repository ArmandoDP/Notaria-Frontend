import { formatDistanceToNow, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  ticket:    any
  estado:    string
  documentos: any[]
}

export default function TicketHeader({ ticket, estado, documentos }: Props) {
  const tramite  = ticket.tramites_config
  const area     = ticket.areas
  const vencido  = isPast(new Date(ticket.sla_vence_at))

  const ESTADOS: Record<string, string> = {
    nuevo:         'Nuevo',
    asignado:      'Asignado',
    folio_dba:     'Folio DBA',
    escritura_dba: 'Escritura DBA',
  }

  const docsObligatorios = documentos.filter((d: any) => d.doc_tipos_config?.obligatorio)
  const docsValidados    = docsObligatorios.filter((d: any) => d.estado === 'validado')
  const progreso         = docsObligatorios.length > 0
    ? Math.round((docsValidados.length / docsObligatorios.length) * 100)
    : 0

  return (
    <div className="rounded-2xl p-5 mb-4"
      style={{ background: tramite?.color_hex || '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-widest uppercase mb-1"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {ticket.numero}
          </div>
          <h1 className="text-[20px] font-bold text-white leading-tight tracking-tight">
            {tramite?.nombre}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {area?.nombre}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span className="text-[12px]" style={{ color: vencido ? '#FCA5A5' : 'rgba(255,255,255,0.6)' }}>
              {vencido ? '⚠ Vencido ' : 'Vence '}
              {formatDistanceToNow(new Date(ticket.sla_vence_at), { locale: es, addSuffix: true })}
            </span>
            {ticket.folio_dba && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                <span className="text-[12px] font-mono font-bold" style={{ color: '#F0C040' }}>
                  {ticket.folio_dba}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="px-3 py-1.5 rounded-xl text-[12px] font-bold"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}>
            {ESTADOS[estado] || estado}
          </span>
        </div>
      </div>

      {docsObligatorios.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span>Documentos validados</span>
            <span className="font-bold text-white">{progreso}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progreso}%`, background: progreso === 100 ? '#86EFAC' : 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
      )}
    </div>
  )
}