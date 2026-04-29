// ← edición de info general

interface Props {
  data:    any
  areas:   any[]
  isAdmin: boolean
  onSave:  (campo: string, valor: any) => void
}

export default function TabConfiguracion({ data, areas, isAdmin, onSave }: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* Descripción */}
      <div className="bg-white rounded-2xl p-5"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Descripción
        </div>
        {isAdmin ? (
          <textarea
            defaultValue={data.descripcion || ''}
            onBlur={e => onSave('descripcion', e.target.value)}
            rows={4}
            className="w-full text-[13px] outline-none resize-none rounded-xl p-3"
            style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#333' }}
          />
        ) : (
          <p className="text-[13px] leading-relaxed" style={{ color: '#444' }}>{data.descripcion}</p>
        )}
      </div>

      {/* Grid de campos */}
      <div className="grid grid-cols-2 gap-3">

        {/* Costo */}
        <div className="bg-white rounded-2xl p-4"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>Costo</div>
          {isAdmin ? (
            <input
              defaultValue={data.costo || ''}
              onBlur={e => onSave('costo', e.target.value)}
              placeholder="Ej: $8,500 MXN + IVA"
              className="w-full text-[13px] bg-transparent border-none outline-none"
              style={{ color: '#333' }}
            />
          ) : (
            <div className="text-[13px]" style={{ color: '#333' }}>{data.costo || '—'}</div>
          )}
        </div>

        {/* Días SLA */}
        <div className="bg-white rounded-2xl p-4"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
            Días hábiles SLA
          </div>
          {isAdmin ? (
            <input
              type="number"
              defaultValue={data.sla_dias_total}
              onBlur={e => onSave('sla_dias_total', parseInt(e.target.value))}
              className="text-[24px] font-bold w-full outline-none bg-transparent border-none"
              style={{ color: data.color_hex }}
            />
          ) : (
            <div className="text-[24px] font-bold" style={{ color: data.color_hex }}>{data.sla_dias_total}</div>
          )}
        </div>

        {/* Área responsable */}
        <div className="bg-white rounded-2xl p-4"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
            Área responsable principal
          </div>
          {isAdmin ? (
            <select
              defaultValue={data.area_id_default}
              onChange={e => onSave('area_id_default', e.target.value)}
              className="w-full text-[13px] font-semibold outline-none bg-transparent border-none cursor-pointer"
              style={{ color: '#333' }}>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          ) : (
            <div className="text-[13px] font-semibold" style={{ color: '#333' }}>{data.areas?.nombre}</div>
          )}
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-2xl p-4"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
            Correo de contacto
          </div>
          {isAdmin ? (
            <input
              defaultValue={data.contacto || ''}
              onBlur={e => onSave('contacto', e.target.value)}
              placeholder="juridico@notaria3.com"
              className="w-full text-[13px] bg-transparent border-none outline-none"
              style={{ color: '#333' }}
            />
          ) : (
            <div className="text-[13px]" style={{ color: '#333' }}>{data.contacto || '—'}</div>
          )}
        </div>

        {/* Estado activo */}
        <div className="bg-white rounded-2xl p-4 col-span-2"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>Estado</div>
          <button
            onClick={() => isAdmin && onSave('activo', !data.activo)}
            className="flex items-center gap-3 cursor-pointer border-none bg-transparent">
            <div className="w-10 h-5 rounded-full transition-all relative"
              style={{ background: data.activo ? data.color_hex : '#E5E7EB' }}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: data.activo ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span className="text-[13px] font-semibold"
              style={{ color: data.activo ? data.color_hex : '#9C9890' }}>
              {data.activo ? 'Activo — aparece en nueva solicitud' : 'Inactivo — no aparece en nueva solicitud'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}