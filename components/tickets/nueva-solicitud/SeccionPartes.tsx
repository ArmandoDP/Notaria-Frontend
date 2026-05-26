'use client'

import { useState } from 'react'

interface Parte {
  rol:              string
  nombre_completo:  string
  curp:             string
  rfc:              string
  telefono:         string
  email:            string
  es_persona_moral: boolean
  es_extranjero:    boolean
  pasaporte:        string
  residencia:       string
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
  comprador:      'Comprador',
  vendedor:       'Vendedor',
  poderdante:     'Poderdante',
  apoderado:      'Apoderado',
  deudor:         'Deudor',
  socio:          'Socio',
  testador:       'Testador',
  solicitante:    'Solicitante',
  representante:  'Representante',
  donante:        'Donante',
  donatario:      'Donatario',
  herederos:      'Herederos',
  liquidador:     'Liquidador',
  comparecientes: 'Compareciente',
}

export default function SeccionPartes({ partes, colorTramite, tieneSocios, onUpdate, onAgregar, onQuitar }: Props) {
  if (partes.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {partes.map((parte, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          {/* Header parte */}
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

          {/* Checkbox extranjero */}
          <label className="flex items-center gap-2.5 mb-4 cursor-pointer w-fit">
            <div
              onClick={() => onUpdate(idx, 'es_extranjero', !parte.es_extranjero)}
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
              style={{
                background:  parte.es_extranjero ? colorTramite : '#F3F4F6',
                border:      parte.es_extranjero ? `2px solid ${colorTramite}` : '2px solid #D1D5DB',
              }}>
              {parte.es_extranjero && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-[12.5px] font-medium" style={{ color: '#555' }}>
              Es extranjero
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#9C9890' }}>
              opcional
            </span>
          </label>

          {/* Campos principales */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: 'nombre_completo', label: 'Nombre completo', placeholder: 'Nombre y apellidos', col: 2 },
              ...(parte.es_extranjero ? [] : [
                { field: 'curp', label: 'CURP', placeholder: 'XXXX000000XXXXXX00' },
              ]),
              { field: 'rfc',      label: 'RFC',      placeholder: 'XXXX000000XXX' },
              { field: 'telefono', label: 'Teléfono', placeholder: '+52 477 000 0000' },
              { field: 'email',    label: 'Correo',   placeholder: 'correo@ejemplo.com' },
            ].map((f: any) => (
              <div key={f.field} className={f.col === 2 ? 'col-span-2' : ''}>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>
                  {f.label}
                </label>
                <input type="text"
                  value={(parte as any)[f.field] || ''}
                  onChange={e => onUpdate(idx, f.field as keyof Parte, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                />
              </div>
            ))}

            {/* Campos exclusivos para extranjero */}
            {parte.es_extranjero && (
              <>
                <div>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>
                    Número de pasaporte
                  </label>
                  <input type="text"
                    value={parte.pasaporte || ''}
                    onChange={e => onUpdate(idx, 'pasaporte', e.target.value)}
                    placeholder="Ej. AB123456"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={{ background: '#F7F7F5', border: `1px solid ${colorTramite}40`, color: '#111' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>
                    No. residencia / FM2 / FM3
                  </label>
                  <input type="text"
                    value={parte.residencia || ''}
                    onChange={e => onUpdate(idx, 'residencia', e.target.value)}
                    placeholder="Número de documento migratorio"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={{ background: '#F7F7F5', border: `1px solid ${colorTramite}40`, color: '#111' }}
                  />
                </div>

                {/* Nota informativa */}
                <div className="col-span-2 rounded-xl px-3 py-2.5 flex items-start gap-2"
                  style={{ background: `${colorTramite}10`, border: `1px solid ${colorTramite}25` }}>
                  <span className="text-[12px] flex-shrink-0">📋</span>
                  <span className="text-[11.5px] leading-relaxed" style={{ color: colorTramite }}>
                    Para extranjeros se solicitará <strong>pasaporte vigente</strong> y <strong>documento migratorio</strong> (forma migratoria) en lugar de INE/CURP. Verifica la vigencia de ambos documentos.
                  </span>
                </div>
              </>
            )}
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