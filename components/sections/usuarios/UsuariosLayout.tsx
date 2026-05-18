'use client'

import { useState } from 'react'
import TabEquipos         from './TabEquipos'
import TabPermisos        from './TabPermisos'
import TabWhatsApp        from './TabWhatsApp'
import TabRolesEspeciales from './TabRolesEspeciales'

const TABS = [
  { id: 'equipos',   label: 'Equipos y usuarios'  },
  { id: 'permisos',  label: 'Tabla de permisos'   },
  { id: 'whatsapp',  label: 'Números WhatsApp'     },
  { id: 'especiales',label: 'Roles especiales'     },
]

interface Props {
  areas:    any[]
  usuarios: any[]
}

export default function UsuariosLayout({ areas, usuarios }: Props) {
  const [tab,            setTab]            = useState('equipos')
  const [usuariosState,  setUsuariosState]  = useState(usuarios)
  const [areasState,     setAreasState]     = useState(areas)

  const totalUsuarios = usuariosState.length
  const totalAreas    = areasState.length

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
        style={{ background: '#0C0C10', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F0C040, transparent)', transform: 'translate(20%,-30%)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-white tracking-tight">
              Usuarios y permisos
            </h1>
            <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Plataforma N3 · {totalAreas} áreas · {totalUsuarios} usuarios · Celaya, Gto.
            </p>
          </div>
          <div className="flex gap-5">
            {[
              { val: totalUsuarios, label: 'usuarios' },
              { val: totalAreas, label: 'áreas' },
              { val: areas.filter(a => a.numero_twilio).length, label: 'números WA' },
              { val: 5,             label: 'roles'    },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-[24px] font-bold" style={{ color: '#F0C040' }}>{s.val}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer border-none transition-all"
            style={{
              background: tab === t.id ? '#111' : '#fff',
              color:      tab === t.id ? '#fff' : '#666',
              border:     tab === t.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
              boxShadow:  tab === t.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'equipos' && (
        <TabEquipos
          areas={areasState}
          usuarios={usuariosState}
          onUpdate={setUsuariosState}
        />
      )}
      {tab === 'permisos' && <TabPermisos />}
      {tab === 'whatsapp' && (
        <TabWhatsApp
          areas={areasState}
          onUpdate={setAreasState}
        />
      )}
      {tab === 'especiales' && (
        <TabRolesEspeciales
          usuarios={usuariosState}
          onUpdate={setUsuariosState}
        />
      )}
    </div>
  )
}