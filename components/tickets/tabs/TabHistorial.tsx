import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  eventos: any[]
}

const tipoConfig: Record<string, { color: string, bg: string, emoji: string }> = {
  wa_enviado:       { color: '#0F6E56', bg: '#EAF3DE', emoji: '💬' },
  folio_dba:        { color: '#B8820A', bg: '#FEF3C7', emoji: '📋' },
  folio_escritura:  { color: '#B8820A', bg: '#FEF3C7', emoji: '📋' },
  reasignacion:     { color: '#185FA5', bg: '#E6F1FB', emoji: '🔄' },
  nota:             { color: '#534AB7', bg: '#EDE9FE', emoji: '📝' },
  estado_cambio:    { color: '#534AB7', bg: '#EDE9FE', emoji: '⚡' },
}

export default function TabHistorial({ eventos }: Props) {
  const sorted = [...eventos].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-2xl"
        style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="text-[28px] mb-2">📋</div>
        <div className="text-[13px] font-semibold mb-1" style={{ color: '#333' }}>Sin historial</div>
        <div className="text-[12px]" style={{ color: '#9C9890' }}>Las acciones del expediente aparecerán aquí</div>
      </div>
    )
  }

  return (
    <div className="relative">

      {/* Línea vertical de timeline */}
      <div className="absolute left-[19px] top-5 bottom-5 w-px"
        style={{ background: 'rgba(0,0,0,0.06)' }} />

      <div className="flex flex-col gap-3">
        {sorted.map((ev: any, i) => {
          const cfg     = tipoConfig[ev.tipo] || { color: '#6B7280', bg: '#F3F4F6', emoji: '📌' }
          const usuario = ev.usuarios_sistema
          const area    = usuario?.areas?.nombre

          return (
            <div key={ev.id} className="flex gap-3 items-start relative">

              {/* Icono del evento */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0 relative z-10"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                {cfg.emoji}
              </div>

              {/* Contenido */}
              <div className="flex-1 bg-white rounded-2xl p-3.5 min-w-0"
                style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

                {/* Descripción */}
                <div className="text-[13px] font-medium mb-2" style={{ color: '#111' }}>
                  {ev.descripcion}
                </div>

                {/* Footer — fecha + usuario */}
                <div className="flex items-center justify-between gap-2 flex-wrap">

                  {/* Fecha */}
                  <span className="text-[10.5px]" style={{ color: '#9C9890' }}>
                    {format(new Date(ev.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                  </span>

                  {/* Usuario */}
                  {usuario ? (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg"
                      style={{ background: '#F7F7F5' }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
                        style={{ background: usuario.avatar_color || '#666' }}>
                        {usuario.avatar_letras || '??'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold leading-tight" style={{ color: '#333' }}>
                          {usuario.nombre}
                        </div>
                        <div className="text-[10px] leading-tight" style={{ color: '#9C9890' }}>
                          {usuario.email}
                          {area && ` · ${area}`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10.5px] px-2 py-1 rounded-lg"
                      style={{ background: '#F7F7F5', color: '#9C9890' }}>
                      Sistema
                    </span>
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