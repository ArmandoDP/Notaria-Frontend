'use client'

interface Props {
  parteConfig:  any
  docs:         any[]
  color:        string
  subiendo:     string | null
  subidos:      Record<string, boolean>
  errores:      Record<string, string>
  onSubir:      (docId: string, docTipoId: string, archivo: File) => void
  onContinuar:  () => void
  esUltimoPaso: boolean
}

export default function UploadStepDocs({
  parteConfig, docs, color, subiendo, subidos, errores, onSubir, onContinuar, esUltimoPaso
}: Props) {
  const rolLabel    = parteConfig.rol.replace(/_/g, ' ')
  const avatar      = parteConfig.avatar || parteConfig.rol.slice(0, 2).toUpperCase()
  const avatarColor = parteConfig.color || color

  const obligatoriosCompletos = docs
    .filter(d => d.doc_tipos_config?.obligatorio)
    .every(d => subidos[d.id] || d.estado !== 'pendiente')

  const renderDoc = (doc: any) => {
    const config     = doc.doc_tipos_config
    const yaSubido   = subidos[doc.id] || doc.estado !== 'pendiente'
    const cargando   = subiendo === doc.id
    const error      = errores[doc.id]
    const estadoIA   = doc.datos_ocr?.estado_ia
    const mensajeIA  = doc.datos_ocr?.mensaje_ia
    const analizando = subidos[doc.id] && !estadoIA

    const borderColor = estadoIA === 'validado'  ? 'rgba(59,109,17,0.25)'  :
                        estadoIA === 'rechazado' ? 'rgba(153,27,27,0.25)'  :
                        estadoIA === 'revisar'   ? 'rgba(146,64,14,0.25)'  :
                        yaSubido ? 'rgba(59,109,17,0.15)' : 'rgba(0,0,0,0.06)'

    return (
      <div key={doc.id} style={{
        background: '#fff', borderRadius: '12px', padding: '12px 14px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
            background: estadoIA === 'validado'  ? '#EAF3DE' :
                        estadoIA === 'rechazado' ? '#FEE2E2' :
                        estadoIA === 'revisar'   ? '#FEF3C7' :
                        yaSubido ? '#EAF3DE' : config?.obligatorio ? '#FEE2E2' : '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px',
          }}>
            {estadoIA === 'validado'  ? <span style={{ color: '#1A6B3C', fontWeight: 700 }}>✓</span> :
             estadoIA === 'rechazado' ? <span style={{ color: '#991B1B', fontWeight: 700 }}>✗</span> :
             estadoIA === 'revisar'   ? <span style={{ color: '#92400E', fontWeight: 700 }}>⚠</span> :
             analizando ? <span style={{ fontSize: '9px' }}>⏳</span> :
             yaSubido ? <span style={{ color: '#1A6B3C', fontWeight: 700 }}>✓</span> :
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: config?.obligatorio ? '#E24B4A' : '#9CA3AF' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>
              {config?.nombre}
              {config?.obligatorio && (
                <span style={{ fontSize: '10px', color: '#E24B4A', fontWeight: 700, marginLeft: '6px' }}>obligatorio</span>
              )}
            </div>
            {config?.alerta_descripcion && (
              <div style={{ fontSize: '11px', color: '#9C9890', marginBottom: '4px', lineHeight: '1.4' }}>
                {config.alerta_descripcion}
              </div>
            )}
            {config?.descripcion_vigencia && config.descripcion_vigencia !== 'Sin vencimiento' && (
              <span style={{
                display: 'inline-block', fontSize: '10px', fontWeight: 600,
                padding: '2px 8px', borderRadius: '99px',
                background: '#FEF3C7', color: '#92400E', marginBottom: '6px',
              }}>
                {config.descripcion_vigencia}
              </span>
            )}
            {analizando && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '3px',
                background: 'linear-gradient(135deg, #E6F1FB, #EEF5FD)',
                border: '1px solid rgba(27,95,165,0.2)',
                borderRadius: '10px', padding: '8px 12px', marginBottom: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏳</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B5FA5' }}>✨ Verificando con IA...</span>
                </div>
              </div>
            )}
            {mensajeIA && (
              <div style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px',
                display: 'inline-block', marginBottom: '6px',
                background: estadoIA === 'validado' ? '#D1FAE5' : estadoIA === 'rechazado' ? '#FEE2E2' : '#FEF3C7',
                color:      estadoIA === 'validado' ? '#065F46' : estadoIA === 'rechazado' ? '#991B1B' : '#92400E',
              }}>
                {estadoIA === 'validado' ? '✓ ' : estadoIA === 'rechazado' ? '✗ ' : '⚠ '}
                {mensajeIA}
              </div>
            )}
            {yaSubido && !analizando && !mensajeIA ? (
              <div style={{ fontSize: '12px', color: '#1A6B3C', fontWeight: 600, marginTop: '4px' }}>✅ Documento recibido</div>
            ) : estadoIA === 'rechazado' ? (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '10px', cursor: 'pointer',
                background: '#FEE2E2', color: '#991B1B', fontSize: '12px', fontWeight: 600, marginTop: '6px',
              }}>
                🔄 Subir de nuevo
                <input type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onSubir(doc.id, doc.doc_tipo_id, f) }} />
              </label>
            ) : !yaSubido ? (
              <div style={{ marginTop: '8px' }}>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  background: cargando ? '#F3F4F6' : color,
                  color: cargando ? '#9CA3AF' : '#fff',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  {cargando ? '⏳ Subiendo...' : '📎 Seleccionar archivo'}
                  <input type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp,.pdf" disabled={cargando}
                    onChange={e => { const f = e.target.files?.[0]; if (f) onSubir(doc.id, doc.doc_tipo_id, f) }} />
                </label>
                {error && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '6px' }}>{error}</div>}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>

      {/* Header parte */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px', borderRadius: '14px', marginBottom: '16px',
        background: `${avatarColor}10`, border: `1px solid ${avatarColor}25`,
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: avatarColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 800, color: '#fff',
        }}>{avatar}</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>
            Documentos del {rolLabel}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Sube cada documento solicitado
          </div>
        </div>
      </div>

      {/* Instrucción */}
      <div style={{
        background: '#EAF3DE', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px',
        border: '1px solid rgba(59,109,17,0.15)', fontSize: '12px', color: '#3B6D11',
      }}>
        ✨ La IA verificará automáticamente la vigencia y validez de cada documento al subirlo.
      </div>

      {/* Documentos */}
      {docs.map(doc => renderDoc(doc))}

      {/* Botón continuar */}
      <button
        onClick={onContinuar}
        disabled={!obligatoriosCompletos}
        style={{
          width: '100%', padding: '14px', marginTop: '16px',
          borderRadius: '14px', fontSize: '14px', fontWeight: 700,
          background: obligatoriosCompletos ? color : '#E5E7EB',
          color: obligatoriosCompletos ? '#fff' : '#9CA3AF',
          border: 'none', cursor: obligatoriosCompletos ? 'pointer' : 'not-allowed',
          boxShadow: obligatoriosCompletos ? `0 4px 16px ${color}40` : 'none',
          transition: 'all 0.3s',
        }}>
        {esUltimoPaso ? '✅ Finalizar' : 'Continuar →'}
      </button>

      {!obligatoriosCompletos && (
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#9C9890' }}>
          Sube todos los documentos obligatorios para continuar
        </div>
      )}
    </div>
  )
}