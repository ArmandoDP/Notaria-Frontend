interface Props {
  tramites:           any[]
  areas:              any[]
  tramiteId:          string
  areaId:             string
  onTramiteChange:    (id: string) => void
  onAreaChange:       (id: string) => void
}

export default function SeccionTramite({ tramites, areas, tramiteId, areaId, onTramiteChange, onAreaChange }: Props) {
  const tramiteSeleccionado = tramites.find(t => t.id === tramiteId)

  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: '#9C9890' }}>
        Tipo de trámite
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Trámite</label>
          <select value={tramiteId} onChange={e => onTramiteChange(e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
            <option value="">Seleccionar trámite...</option>
            {tramites.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Área responsable</label>
          <select value={areaId} onChange={e => onAreaChange(e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
            <option value="">Seleccionar área...</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>
      {tramiteSeleccionado && (
        <div className="mt-3 px-4 py-3 rounded-xl text-[12px]"
          style={{
            background: `${tramiteSeleccionado.color_hex}0F`,
            border:     `1px solid ${tramiteSeleccionado.color_hex}22`,
            color:      '#555',
          }}>
          <span className="font-semibold" style={{ color: tramiteSeleccionado.color_hex }}>
            SLA: {tramiteSeleccionado.sla_dias_total} días hábiles
          </span>
          {' · '}{tramiteSeleccionado.descripcion}
        </div>
      )}
    </div>
  )
}