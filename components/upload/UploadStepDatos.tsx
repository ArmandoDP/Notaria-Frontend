'use client'

import { useState } from 'react'

interface Props {
  parteConfig: any
  parteReal:   any
  color:       string
  onContinuar: (datos: any) => void
}

const CAMPOS = [
  { field: 'nombre_completo', label: 'Nombre completo',  placeholder: 'Nombre y apellidos completos', tipo: 'text',  requerido: true  },
  { field: 'curp',            label: 'CURP',             placeholder: 'XXXX000000XXXXXX00',           tipo: 'text',  requerido: false },
  { field: 'rfc',             label: 'RFC',              placeholder: 'XXXX000000XXX',                tipo: 'text',  requerido: false },
  { field: 'telefono',        label: 'Teléfono',         placeholder: '+52 477 000 0000',             tipo: 'tel',   requerido: false },
  { field: 'email',           label: 'Correo electrónico', placeholder: 'correo@ejemplo.com',         tipo: 'email', requerido: false },
]

export default function UploadStepDatos({ parteConfig, parteReal, color, onContinuar }: Props) {
  const [modalAviso, setModalAviso] = useState(true)

  const [datos, setDatos] = useState({
    nombre_completo: parteReal?.nombre_completo || '',
    curp:            parteReal?.curp            || '',
    rfc:             parteReal?.rfc             || '',
    telefono:        parteReal?.telefono        || '',
    email:           parteReal?.email           || '',
  })
  const [error, setError] = useState('')

  const rolLabel = parteConfig.rol.replace(/_/g, ' ')
  const avatar   = parteConfig.avatar || parteConfig.rol.slice(0, 2).toUpperCase()
  const avatarColor = parteConfig.color || color

  function handleContinuar() {
    if (!datos.nombre_completo.trim()) {
      setError('El nombre completo es obligatorio')
      return
    }
    setError('')
    onContinuar(datos)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>

      {/* Header de la parte */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px', borderRadius: '16px', marginBottom: '20px',
        background: `${avatarColor}10`, border: `1px solid ${avatarColor}25`,
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: avatarColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 800, color: '#fff',
        }}>
          {avatar}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>
            Datos del {rolLabel}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            Por favor completa tus datos personales para continuar
          </div>
        </div>
      </div>

      {/* modal  */}
      {modalAviso && (
      <div className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
        <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-[24px]"
              style={{ background: '#E6F1FB' }}>
              📋
            </div>
            <div className="text-[16px] font-bold mb-2" style={{ color: '#111' }}>
              Antes de continuar
            </div>
            <div className="text-[13px] leading-relaxed mb-3" style={{ color: '#555' }}>
              Para completar tu expediente correctamente, ten a la mano tus documentos oficiales vigentes.
            </div>

            {/* Tips */}
            <div className="flex flex-col gap-2">
              {[
                { emoji: '🪪', texto: 'Los datos deben coincidir exactamente con tu identificación oficial (INE, pasaporte).' },
                { emoji: '✍️', texto: 'Escribe tu nombre completo tal como aparece en tus documentos, sin abreviaturas.' },
                { emoji: '📄', texto: 'Ten listos los documentos que se te solicitarán: INE, CURP, comprobante de domicilio, etc.' },
                { emoji: '📅', texto: 'Verifica que tus documentos estén vigentes antes de subirlos.' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: '#F7F7F5' }}>
                  <span className="text-[16px] flex-shrink-0">{tip.emoji}</span>
                  <span className="text-[12px] leading-relaxed" style={{ color: '#444' }}>{tip.texto}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />

          {/* Botón */}
          <div className="px-6 py-4">
            <button onClick={() => setModalAviso(false)}
              className="w-full py-3 rounded-xl text-[14px] font-bold cursor-pointer border-none"
              style={{ background: '#111', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              Entendido, continuar →
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Formulario */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {CAMPOS.map(campo => (
          <div key={campo.field}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>
              {campo.label}
              {campo.requerido && <span style={{ color: '#E24B4A', marginLeft: '4px' }}>*</span>}
            </label>
            <input
              type={campo.tipo}
              value={(datos as any)[campo.field]}
              onChange={e => setDatos(prev => ({ ...prev, [campo.field]: e.target.value }))}
              placeholder={campo.placeholder}
              onKeyDown={e => { if (e.key === 'Enter') handleContinuar() }}
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '12px', fontSize: '14px',
                border: `1px solid ${campo.field === 'nombre_completo' && error ? '#E24B4A' : 'rgba(0,0,0,0.1)'}`,
                background: '#fff', color: '#111', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
          background: '#FEE2E2', color: '#991B1B', fontSize: '12px', fontWeight: 600,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Botón continuar */}
      <button
        onClick={handleContinuar}
        style={{
          width: '100%', padding: '14px',
          borderRadius: '14px', fontSize: '14px', fontWeight: 700,
          background: color, color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 16px ${color}40`,
        }}>
        Continuar → Subir documentos
      </button>

      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#9C9890' }}>
        Tus datos son confidenciales y solo serán utilizados para este trámite
      </div>
    </div>
  )
}