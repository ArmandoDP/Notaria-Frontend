// ← fila de documento reutilizable

import { createClient } from '@/lib/supabase/client'

export const ALERTA_CONFIG: Record<string, { label: string, bg: string, color: string }> = {
  ia:      { label: 'IA automática', bg: '#E6F1FB', color: '#185FA5' },
  manual:  { label: 'Manual',        bg: '#F3F4F6', color: '#6B7280' },
  critica: { label: 'Crítica',       bg: '#FEE2E2', color: '#991B1B' },
}

export const VIGENCIA_CONFIG: Record<string, { bg: string, color: string }> = {
  'Vigente':              { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 3 meses':   { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 6 meses':   { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 30 días':   { bg: '#FEE2E2', color: '#991B1B' },
  'No mayor a 1 mes':     { bg: '#FEF3C7', color: '#92400E' },
  'Al corriente':         { bg: '#D1FAE5', color: '#065F46' },
  'Mes en curso':         { bg: '#FEF3C7', color: '#92400E' },
  'Quincena en curso':    { bg: '#FEF3C7', color: '#92400E' },
  'Sin vencimiento':      { bg: '#F3F4F6', color: '#9CA3AF' },
}

interface DocRowProps {
  doc:      any
  isAdmin:  boolean
  onDelete: (id: string) => void
  onUpdate: (id: string, campo: string, valor: any) => void
}

export default function DocRow({ doc, isAdmin, onDelete, onUpdate }: DocRowProps) {
  const alertaKey = doc.alerta_ia ? 'ia' : (doc.alerta_descripcion?.toLowerCase().includes('crítico') ? 'critica' : 'manual')
  const alerta    = ALERTA_CONFIG[alertaKey] || ALERTA_CONFIG.manual
  const vigKey    = doc.descripcion_vigencia || ''
  const vigCfg    = VIGENCIA_CONFIG[vigKey] || { bg: '#F3F4F6', color: '#9CA3AF' }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 group hover:bg-gray-50 transition-all border-b last:border-b-0"
      style={{ borderColor: 'rgba(0,0,0,0.04)' }}>

      {/* Dot obligatorio/opcional */}
      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
        style={{ background: doc.obligatorio ? '#E24B4A' : '#9CA3AF' }} />

      {/* Nombre + descripción */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isAdmin ? (
            <input
              defaultValue={doc.nombre}
              onBlur={e => onUpdate(doc.id, 'nombre', e.target.value)}
              className="text-[12.5px] font-medium bg-transparent border-none outline-none"
              style={{ color: '#111', minWidth: '200px' }}
            />
          ) : (
            <span className="text-[12.5px] font-medium" style={{ color: '#111' }}>{doc.nombre}</span>
          )}
          {!doc.obligatorio && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: '#EDE9FE', color: '#4C1D95' }}>OPC</span>
          )}
        </div>
        {doc.alerta_descripcion && (
          <div className="text-[10.5px] mt-0.5 leading-snug" style={{ color: '#9C9890' }}>
            {doc.alerta_descripcion}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {vigKey && vigKey !== 'Sin vencimiento' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{ background: vigCfg.bg, color: vigCfg.color }}>
            {vigKey}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
          style={{ background: alerta.bg, color: alerta.color }}>
          {alerta.label}
        </span>
        {isAdmin && (
          <button
            onClick={() => onDelete(doc.id)}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-pointer border-none transition-all ml-1"
            style={{ background: '#FEE2E2', color: '#E24B4A' }}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}