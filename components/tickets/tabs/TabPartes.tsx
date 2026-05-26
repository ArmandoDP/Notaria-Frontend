interface Props {
  partes:  any[]
  tramite: any
}

export default function TabPartes({ partes, tramite }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {partes.map((parte: any, i: number) => (
        <div key={parte.id} className="p-4 rounded-xl"
          style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: tramite?.color_hex || '#666' }}>
              {i + 1}
            </div>
            <span className="text-[12px] font-bold capitalize" style={{ color: '#666' }}>
              {parte.rol}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {parte.nombre_completo && (
              <div>
                <span style={{ color: '#9C9890' }}>Nombre</span>
                <div className="font-medium" style={{ color: '#111' }}>{parte.nombre_completo}</div>
              </div>
            )}
            {parte.curp && (
              <div>
                <span style={{ color: '#9C9890' }}>CURP</span>
                <div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.curp}</div>
              </div>
            )}
            {parte.rfc && (
              <div>
                <span style={{ color: '#9C9890' }}>RFC</span>
                <div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.rfc}</div>
              </div>
            )}
            {parte.telefono && (
              <div>
                <span style={{ color: '#9C9890' }}>Teléfono</span>
                <div style={{ color: '#111' }}>{parte.telefono}</div>
              </div>
            )}
            {parte.email && (
              <div>
                <span style={{ color: '#9C9890' }}>Correo</span>
                <div style={{ color: '#111' }}>{parte.email}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}