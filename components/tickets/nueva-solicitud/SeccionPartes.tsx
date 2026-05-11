interface Parte {
  rol:              string
  nombre_completo:  string
  curp:             string
  rfc:              string
  telefono:         string
  email:            string
  es_persona_moral: boolean
  datos_adicionales: Record<string, string>
}

interface Props {
  partes:       Parte[]
  colorTramite: string
  tieneSocios:  boolean
  onUpdate:     (index: number, field: keyof Parte, value: any) => void
  onAgregar:    () => void
  onQuitar:     (index: number) => void
}

const ROL_LABELS: Record<string, string> = {
  comprador:        'Comprador',
  vendedor:         'Vendedor',
  poderdante:       'Poderdante',
  apoderado:        'Apoderado',
  deudor:           'Deudor',
  socio:            'Socio',
  testador:         'Testador',
  solicitante:      'Solicitante',
  representante:    'Representante',
  donante:          'Donante',
  donatario:        'Donatario',
  herederos:        'Herederos',
  liquidador:       'Liquidador',
  comparecientes:   'Compareciente',
}

export default function SeccionPartes({ partes, colorTramite, tieneSocios, onUpdate, onAgregar, onQuitar }: Props) {
  if (partes.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {partes.map((parte, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: colorTramite || '#666' }}>
                {idx + 1}
              </div>
              <span className="text-[13px] font-bold" style={{ color: '#111' }}>
                {ROL_LABELS[parte.rol] || parte.rol.replace(/_/g, ' ')}
              </span>
            </div>
            {parte.rol === 'socio' && partes.filter(p => p.rol === 'socio').length > 1 && (
              <button type="button" onClick={() => onQuitar(idx)}
                className="text-[11px] cursor-pointer border-none bg-transparent"
                style={{ color: '#E24B4A' }}>
                Quitar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: 'nombre_completo', label: 'Nombre completo', placeholder: 'Nombre y apellidos', col: 2 },
              { field: 'curp',            label: 'CURP',            placeholder: 'XXXX000000XXXXXX00' },
              { field: 'rfc',             label: 'RFC',             placeholder: 'XXXX000000XXX' },
              { field: 'telefono',        label: 'Teléfono',        placeholder: '+52 477 000 0000' },
              { field: 'email',           label: 'Correo',          placeholder: 'correo@ejemplo.com' },
            ].map(f => (
              <div key={f.field} className={f.col === 2 ? 'col-span-2' : ''}>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>
                  {f.label}
                </label>
                <input type="text"
                  value={(parte as any)[f.field]}
                  onChange={e => onUpdate(idx, f.field as keyof Parte, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {tieneSocios && (
        <button type="button" onClick={onAgregar}
          className="w-full py-3 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.04)', color: '#666', border: '1px dashed rgba(0,0,0,0.15)' }}>
          + Agregar socio
        </button>
      )}
    </div>
  )
}