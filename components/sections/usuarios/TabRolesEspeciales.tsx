interface Props {
  usuarios: any[]
  onUpdate: (usuarios: any[]) => void
}

const ROLES_ESPECIALES = [
  {
    key:      'notario',
    titulo:   'notario',
    subtitulo: 'Lic. Enrique Jiménez Lemus (Nancy Fernández)',
    avatar:   'EJ',
    bg:       '#FDF6E3',
    color:    '#92400E',
    accesos: [
      { icon: '👁', texto: 'Ve TODOS los tickets de todas las áreas — solo lectura' },
      { icon: '👁', texto: 'Ve TODAS las conversaciones WA — solo lectura' },
      { icon: '👁', texto: 'Dashboard con KPIs en tiempo real' },
      { icon: '👁', texto: 'Lista pre-DBA (tickets sin folio)' },
      { icon: '❌', texto: 'No puede crear ni modificar nada', tachado: true },
      { icon: '❌', texto: 'No puede configurar trámites', tachado: true },
    ],
    nota: 'Entra con usuario nancy.fernandez@notaria3.com (dispositivo compartido en la oficina del notario)',
    notaBg: '#FEF3C7', notaColor: '#92400E',
  },
  {
    key:      'admin',
    titulo:   'admin',
    subtitulo: 'Arturo Palmieri + Armando Vargas (dev)',
    avatar:   'AP',
    bg:       '#FEE2E2',
    color:    '#991B1B',
    accesos: [
      { icon: '✅', texto: 'Acceso completo a todo el sistema' },
      { icon: '✅', texto: 'Crear, editar y eliminar usuarios' },
      { icon: '✅', texto: 'Configurar trámites, SLA, áreas' },
      { icon: '✅', texto: 'Ver logs del sistema y errores' },
      { icon: '✅', texto: 'Panel de administración de Twilio' },
    ],
    nota: 'Este rol se revoca o limita a Armando post-entrega. Solo Arturo mantiene acceso admin permanente.',
    notaBg: '#FEE2E2', notaColor: '#991B1B',
  },
  {
    key:      'recepcion',
    titulo:   'recepción',
    subtitulo: 'Anaí + equipo Recepción (rol especial)',
    avatar:   'AN',
    bg:       '#EAF2FB',
    color:    '#1B5FA5',
    accesos: [
      { icon: '✅', texto: 'Primer contacto — bot WA del número principal' },
      { icon: '✅', texto: 'Ve tickets de TODAS las áreas (lectura + status)' },
      { icon: '✅', texto: 'Crea tickets para cualquier área' },
      { icon: '✅', texto: 'Deriva tickets al área correspondiente' },
      { icon: '✅', texto: 'Ve conversaciones WA de todas las áreas' },
      { icon: '❌', texto: 'No puede modificar tickets de otras áreas', tachado: true },
      { icon: '❌', texto: 'No puede responder WA de otras áreas', tachado: true },
    ],
    nota: null,
    notaBg: '', notaColor: '',
  },
  {
    key:      'notario_auxiliar',
    titulo:   'notario auxiliar ampliado',
    subtitulo: 'Eda Hernández (acceso especial)',
    avatar:   'ED',
    bg:       '#FAE0E0',
    color:    '#D85A30',
    accesos: [
      { icon: '👁', texto: 'Ve tickets de TODAS las áreas (mismos accesos que el notario)' },
      { icon: '✅', texto: 'Puede crear tickets en cualquier área' },
      { icon: '✅', texto: 'Acceso completo al área Notario Auxiliar' },
      { icon: '❌', texto: 'No modifica tickets de otras áreas', tachado: true },
    ],
    nota: 'Eda necesita rol mixto: area_lead de su área + flag can_read_all = true en sus metadatos de Supabase.',
    notaBg: '#FAE0E0', notaColor: '#993C1D',
  },
]

export default function TabRolesEspeciales({ usuarios }: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* Cards de roles */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {ROLES_ESPECIALES.map(rol => (
          <div key={rol.key} className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: rol.bg, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                style={{ background: rol.color }}>
                {rol.avatar}
              </div>
              <div>
                <div className="text-[13px] font-bold" style={{ color: rol.color }}>{rol.titulo}</div>
                <div className="text-[11px]" style={{ color: '#666' }}>{rol.subtitulo}</div>
              </div>
            </div>

            {/* Accesos */}
            <div className="px-4 py-3 flex flex-col gap-1.5">
              {rol.accesos.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[13px] flex-shrink-0 mt-0.5">{a.icon}</span>
                  <span className="text-[11.5px] leading-snug"
                    style={{ color: a.tachado ? '#CCC' : '#444', textDecoration: a.tachado ? 'line-through' : 'none' }}>
                    {a.texto}
                  </span>
                </div>
              ))}
            </div>

            {/* Nota */}
            {rol.nota && (
              <div className="mx-4 mb-3 px-3 py-2 rounded-xl text-[10.5px] leading-relaxed"
                style={{ background: rol.notaBg, color: rol.notaColor }}>
                {rol.nota}
              </div>
            )}

            {/* Usuarios con este rol */}
            {(() => {
              const usersRol = usuarios.filter(u => u.rol === rol.key)
              if (usersRol.length === 0) return null
              return (
                <div className="px-4 pb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#9C9890' }}>
                    Usuarios con este rol
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {usersRol.map(u => (
                      <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{ background: '#F7F7F5' }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                          style={{ background: u.avatar_color || rol.color }}>
                          {u.avatar_letras || u.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[11px]" style={{ color: '#333' }}>{u.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Nota implementación */}
      <div className="px-4 py-3 rounded-2xl text-[12px] leading-relaxed"
        style={{ background: '#FEF3C7', border: '1px solid rgba(240,180,41,0.3)', color: '#92400E' }}>
        <strong>Implementación en Supabase Auth:</strong> Los roles van en <code className="font-mono text-[11px] px-1 rounded" style={{ background: '#F5F0E3' }}>user_metadata.role</code>. El acceso de lectura total de Eda se implementa con un flag adicional <code className="font-mono text-[11px] px-1 rounded" style={{ background: '#F5F0E3' }}>user_metadata.can_read_all = true</code>.
      </div>
    </div>
  )
}