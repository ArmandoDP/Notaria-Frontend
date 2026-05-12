'use client'

import { useState } from 'react'

export const ALERTA_CONFIG: Record<string, { label: string, bg: string, color: string }> = {
  ia:      { label: 'IA automática', bg: '#E6F1FB', color: '#185FA5' },
  manual:  { label: 'Manual',        bg: '#F3F4F6', color: '#6B7280' },
  critica: { label: 'Crítica',       bg: '#FEE2E2', color: '#991B1B' },
}

export const VIGENCIA_CONFIG: Record<string, { bg: string, color: string }> = {
  'Vigente':                              { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 1 mes':                     { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 2 meses':                   { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 3 meses':                   { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 3 meses si no señala régimen': { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 6 meses':                   { bg: '#FEF3C7', color: '#92400E' },
  'No mayor a 30 días':                   { bg: '#FEE2E2', color: '#991B1B' },
  'Al corriente':                         { bg: '#D1FAE5', color: '#065F46' },
  'Al corriente al mes de firma':         { bg: '#D1FAE5', color: '#065F46' },
  'Mes en curso':                         { bg: '#FEF3C7', color: '#92400E' },
  'Quincena en curso':                    { bg: '#FEF3C7', color: '#92400E' },
  'Último recibo pagado':                 { bg: '#FEF3C7', color: '#92400E' },
  'Sin vencimiento':                      { bg: '#F3F4F6', color: '#9CA3AF' },
  'Debidamente autorizados':              { bg: '#F3F4F6', color: '#9CA3AF' },
  'Activo':                               { bg: '#D1FAE5', color: '#065F46' },
}

const VIGENCIAS = [
  'Sin vencimiento', 'Vigente', 'Mes en curso',
  'No mayor a 1 mes', 'No mayor a 2 meses', 'No mayor a 3 meses',
  'No mayor a 3 meses si no señala régimen',
  'No mayor a 6 meses', 'No mayor a 30 días',
  'Al corriente', 'Al corriente al mes de firma',
  'Quincena en curso', 'Último recibo pagado',
  'Debidamente autorizados', 'Activo',
]

interface DocRowProps {
  doc:      any
  isAdmin:  boolean
  onDelete: (id: string) => void
  onUpdate: (id: string, campo: string, valor: any) => void
}

export default function DocRow({ doc, isAdmin, onDelete, onUpdate }: DocRowProps) {
  const [abierto, setAbierto] = useState(false)

  const alertaKey = doc.alerta_ia ? 'ia' : 'manual'
  const alerta    = ALERTA_CONFIG[alertaKey]
  const vigKey    = doc.descripcion_vigencia || ''
  const vigCfg    = VIGENCIA_CONFIG[vigKey] || { bg: '#F3F4F6', color: '#9CA3AF' }

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>

      {/* Fila principal — clickeable para expandir */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all cursor-pointer"
        onClick={() => isAdmin && setAbierto(!abierto)}
      >
        {/* Dot obligatorio */}
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: doc.obligatorio ? '#E24B4A' : '#9CA3AF' }} />

        {/* Nombre + descripción */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12.5px] font-medium" style={{ color: '#111' }}>{doc.nombre}</span>
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
          {doc.parte_vinculada && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap"
              style={{ background: '#F3F4F6', color: '#6B7280' }}>
              {doc.parte_vinculada.replace(/_/g, ' ')}
            </span>
          )}
          {isAdmin && (
            <span className="text-[11px] ml-1 transition-transform duration-200"
              style={{ color: '#9C9890', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
              ▾
            </span>
          )}
        </div>
      </div>

      {/* Panel de edición */}
      {abierto && isAdmin && (
        <div className="px-4 pb-4 flex flex-col gap-3"
          style={{ background: '#FAFAF8', borderTop: '1px solid rgba(0,0,0,0.04)' }}>

          {/* Nombre */}
          <div className="pt-3">
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
              Nombre del documento
            </label>
            <input
              defaultValue={doc.nombre}
              onBlur={e => onUpdate(doc.id, 'nombre', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
              style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
              Descripción / qué verifica la IA
            </label>
            <textarea
              defaultValue={doc.alerta_descripcion || ''}
              onBlur={e => onUpdate(doc.id, 'alerta_descripcion', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-none"
              style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
            />
          </div>

          {/* Vigencia */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
              Vigencia requerida
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VIGENCIAS.map(v => (
                <button key={v} type="button"
                  onClick={() => onUpdate(doc.id, 'descripcion_vigencia', v)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border-none transition-all"
                  style={{
                    background: doc.descripcion_vigencia === v ? '#111' : '#F3F4F6',
                    color:      doc.descripcion_vigencia === v ? '#fff' : '#555',
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Obligatorio */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
              ¿Es obligatorio?
            </label>
            <div className="flex gap-2">
              {[
                { val: true,  label: 'Obligatorio', bg: '#FEE2E2', color: '#991B1B' },
                { val: false, label: 'Opcional',     bg: '#EDE9FE', color: '#4C1D95' },
              ].map(o => (
                <button key={String(o.val)} type="button"
                  onClick={() => onUpdate(doc.id, 'obligatorio', o.val)}
                  className="flex-1 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border-none transition-all"
                  style={{
                    background: doc.obligatorio === o.val ? o.bg : '#F3F4F6',
                    color:      doc.obligatorio === o.val ? o.color : '#9CA3AF',
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo verificación */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
              Tipo de verificación
            </label>
            <div className="flex gap-2">
              {[
                { val: true,  label: 'IA automática', bg: '#E6F1FB', color: '#185FA5' },
                { val: false, label: 'Manual',         bg: '#F3F4F6', color: '#6B7280' },
              ].map(o => (
                <button key={String(o.val)} type="button"
                  onClick={() => onUpdate(doc.id, 'alerta_ia', o.val)}
                  className="flex-1 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border-none transition-all"
                  style={{
                    background: doc.alerta_ia === o.val ? o.bg : '#F3F4F6',
                    color:      doc.alerta_ia === o.val ? o.color : '#9CA3AF',
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Eliminar */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => onDelete(doc.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
              style={{ background: '#FEE2E2', color: '#991B1B' }}>
              Eliminar documento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}