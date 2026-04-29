// ← header con color, nombre, costo, áreas

interface Props {
  data:    any
  isAdmin: boolean
  saved:   boolean
  onSave:  (campo: string, valor: any) => void
}

export default function TramiteHeader({ data, isAdmin, saved, onSave }: Props) {
  return (
    <div className="rounded-2xl p-5 mb-4 relative overflow-hidden"
      style={{ background: data.color_hex, boxShadow: `0 4px 20px ${data.color_hex}40` }}>

      {/* Glow decorativo */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{ background: '#fff', transform: 'translate(30%,-30%)' }} />

      <div className="relative">
        {/* Nombre */}
        {isAdmin ? (
          <input
            defaultValue={data.nombre}
            onBlur={e => onSave('nombre', e.target.value)}
            className="text-[22px] font-bold text-white bg-transparent border-none outline-none w-full tracking-tight mb-2"
            style={{ fontFamily: 'inherit' }}
          />
        ) : (
          <h1 className="text-[22px] font-bold text-white tracking-tight mb-2">{data.nombre}</h1>
        )}

        {/* Áreas + SLA + Estado */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {(data.areas_display?.length > 0 ? data.areas_display : [data.areas?.nombre])
            .filter(Boolean)
            .map((a: string) => (
            <span key={a} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {a}
            </span>
          ))}
          <span className="text-[12px] font-mono font-bold px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            {data.sla_dias_total} días hábiles
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
            style={{
              background: data.activo ? 'rgba(255,255,255,0.2)' : 'rgba(255,0,0,0.3)',
              color: '#fff'
            }}>
            {data.activo ? 'Activo' : 'Inactivo'}
          </span>
          {saved && (
            <span className="text-[11px] px-3 py-1 rounded-full font-medium ml-auto"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              ✓ Guardado
            </span>
          )}
        </div>

        {/* Costo + contacto */}
        <div className="flex items-center gap-3 flex-wrap">
          {data.costo && (
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              💰 {data.costo}
            </span>
          )}
          {data.contacto && (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              ✉ {data.contacto}
            </span>
          )}
        </div>

        {/* Descripción */}
        {data.descripcion && (
          <p className="text-[12px] mt-3 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '700px' }}>
            {data.descripcion}
          </p>
        )}
      </div>
    </div>
  )
}