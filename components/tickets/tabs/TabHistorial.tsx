import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  eventos: any[]
}

export default function TabHistorial({ eventos }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {[...eventos]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((ev: any) => (
          <div key={ev.id} className="flex gap-3 items-start p-3 rounded-xl"
            style={{ background: '#F7F7F5' }}>
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{
                background: ev.tipo === 'wa_enviado'  ? '#0F6E56' :
                            ev.tipo === 'folio_dba'   ? '#B8820A' : '#534AB7'
              }} />
            <div className="flex-1">
              <div className="text-[12.5px]" style={{ color: '#333' }}>{ev.descripcion}</div>
              <div className="text-[10.5px] mt-0.5" style={{ color: '#9C9890' }}>
                {format(new Date(ev.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}