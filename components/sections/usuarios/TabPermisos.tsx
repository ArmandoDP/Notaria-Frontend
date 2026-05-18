const PERMISOS = [
  {
    seccion: 'TICKETS Y EXPEDIENTES',
    items: [
      { label: 'Ver tickets de su área',                  notario: '👁', admin: '✅', recepcion: '✅', area_lead: '✅', agente: '✅' },
      { label: 'Ver tickets de TODAS las áreas',          notario: '👁', admin: '✅', recepcion: '✅', area_lead: '❌', agente: '❌' },
      { label: 'Crear nuevo ticket',                      notario: '❌', admin: '✅', recepcion: '✅', area_lead: '✅', agente: '✅' },
      { label: 'Editar / actualizar estado de ticket',    notario: '❌', admin: '✅', recepcion: '🟡', area_lead: '🟡', agente: '🟡' },
      { label: 'Derivar ticket a otra área',              notario: '❌', admin: '✅', recepcion: '✅', area_lead: '❌', agente: '❌' },
      { label: 'Cancelar ticket',                         notario: '❌', admin: '✅', recepcion: '❌', area_lead: '✅', agente: '❌' },
      { label: 'Vincular folio DBA',                      notario: '❌', admin: '✅', recepcion: '❌', area_lead: '✅', agente: '✅' },
    ]
  },
  {
    seccion: 'DOCUMENTOS Y OCR',
    items: [
      { label: 'Subir documentos al ticket',              notario: '❌', admin: '✅', recepcion: '🟡', area_lead: '🟡', agente: '🟡' },
      { label: 'Ver datos extraídos por OCR',             notario: '👁', admin: '✅', recepcion: '🟡', area_lead: '🟡', agente: '🟡' },
      { label: 'Validar / rechazar documento',            notario: '❌', admin: '✅', recepcion: '❌', area_lead: '✅', agente: '✅' },
    ]
  },
  {
    seccion: 'WHATSAPP Y CONVERSACIONES',
    items: [
      { label: 'Ver conversaciones de su área',           notario: '👁', admin: '✅', recepcion: '✅', area_lead: '✅', agente: '✅' },
      { label: 'Ver conversaciones de TODAS las áreas',   notario: '👁', admin: '✅', recepcion: '✅', area_lead: '❌', agente: '❌' },
      { label: 'Enviar mensajes WA',                      notario: '❌', admin: '✅', recepcion: '✅', area_lead: '✅', agente: '✅' },
      { label: 'Enviar recordatorio automático WA',       notario: '❌', admin: '✅', recepcion: '✅', area_lead: '✅', agente: '❌' },
    ]
  },
  {
    seccion: 'KANBAN Y REPORTES',
    items: [
      { label: 'Kanban de su área',                       notario: '👁', admin: '✅', recepcion: '✅', area_lead: '✅', agente: '✅' },
      { label: 'Kanban de todas las áreas',               notario: '👁', admin: '✅', recepcion: '✅', area_lead: '❌', agente: '❌' },
      { label: 'Dashboard del notario (KPIs)',            notario: '👁', admin: '✅', recepcion: '❌', area_lead: '❌', agente: '❌' },
      { label: 'Tablero por área (métricas propias)',     notario: '👁', admin: '✅', recepcion: '❌', area_lead: '✅', agente: '❌' },
    ]
  },
  {
    seccion: 'CONFIGURACIÓN DEL SISTEMA',
    items: [
      { label: 'Configurar trámites (SLA, docs, partes)', notario: '❌', admin: '✅', recepcion: '❌', area_lead: '❌', agente: '❌' },
      { label: 'Crear / editar usuarios',                 notario: '❌', admin: '✅', recepcion: '❌', area_lead: '❌', agente: '❌' },
    ]
  },
]

const COLS = [
  { key: 'notario',   label: 'notario',   color: '#92400E' },
  { key: 'admin',     label: 'admin',     color: '#991B1B' },
  { key: 'recepcion', label: 'recepción', color: '#0C447C' },
  { key: 'area_lead', label: 'area_lead', color: '#1B5FA5' },
  { key: 'agente',    label: 'agente',    color: '#555550' },
]

const ICONO_COLOR: Record<string, string> = {
  '✅': '#1A6B3C',
  '👁': '#1B5FA5',
  '🟡': '#92400E',
  '❌': '#D1D5DB',
}

export default function TabPermisos() {
  return (
    <div className="flex flex-col gap-4">

      {/* Leyenda */}
      <div className="bg-white rounded-2xl p-4 flex items-center gap-4 flex-wrap"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {[
          { icon: '✅', label: 'Acceso completo' },
          { icon: '👁', label: 'Solo lectura'    },
          { icon: '🟡', label: 'Solo su área'    },
          { icon: '❌', label: 'Sin acceso'      },
        ].map(l => (
          <div key={l.icon} className="flex items-center gap-1.5">
            <span className="text-[14px]">{l.icon}</span>
            <span className="text-[12px]" style={{ color: '#666' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: '#0C0C10' }}>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-white" style={{ width: '40%' }}>
                Funcionalidad
              </th>
              {COLS.map(c => (
                <th key={c.key} className="px-3 py-3 text-[11px] font-bold text-center whitespace-nowrap"
                  style={{ color: c.color === '#555550' ? '#fff' : c.color }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISOS.map(grupo => (
              <>
                <tr key={grupo.seccion} style={{ background: '#F7F7F5' }}>
                  <td colSpan={6} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: '#0C0C10' }}>
                    {grupo.seccion}
                  </td>
                </tr>
                {grupo.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-all"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td className="px-4 py-2.5 text-[12.5px]" style={{ color: '#333' }}>
                      {item.label}
                    </td>
                    {COLS.map(c => (
                      <td key={c.key} className="px-3 py-2.5 text-center text-[15px]">
                        <span style={{ color: ICONO_COLOR[(item as any)[c.key]] || '#666' }}>
                          {(item as any)[c.key]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nota */}
      <div className="px-4 py-3 rounded-2xl text-[12px] leading-relaxed"
        style={{ background: '#FEF3C7', border: '1px solid rgba(240,180,41,0.3)', color: '#92400E' }}>
        <strong>Nota recepción:</strong> El equipo de Recepción tiene acceso ampliado porque es el primer contacto — ve todos los tickets en modo lectura y puede crear tickets para cualquier área. No puede editar tickets de áreas ajenas ni acceder al dashboard del notario.
      </div>
    </div>
  )
}