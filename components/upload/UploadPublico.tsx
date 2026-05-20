'use client'

import { useState } from 'react'

interface Props {
  ticket: any
  token:  string
}

export default function UploadPublico({ ticket, token }: Props) {
  const tramite    = ticket.tramites_config
  const partes     = (ticket.partes || []).sort((a: any, b: any) => a.orden - b.orden)
  const documentos = ticket.documentos || []

  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [subidos,  setSubidos]  = useState<Record<string, boolean>>({})
  const [errores,  setErrores]  = useState<Record<string, string>>({})

  const partesConfig: any[] = tramite?.requiere_partes || []

  // Agrupar docs por para_rol
  const docsPartes = partesConfig.map((pc: any) => ({
    parteConfig: pc,
    parteReal:   partes.find((p: any) => p.rol === pc.rol),
    docs:        documentos.filter((d: any) => d.doc_tipos_config?.para_rol === pc.rol),
  })).filter((g: any) => g.docs.length > 0)

  // Docs de operación
  const docsOperacion = documentos.filter((d: any) =>
    !d.doc_tipos_config?.para_rol ||
    d.doc_tipos_config?.para_rol === 'operacion' ||
    d.doc_tipos_config?.para_rol === 'inmueble'
  )

  const totalDocs   = documentos.length
  const totalSubidos = documentos.filter((d: any) => subidos[d.id] || d.estado !== 'pendiente').length

  async function subirArchivo(docId: string, docTipoId: string, archivo: File) {
    setSubiendo(docId)
    setErrores(prev => ({ ...prev, [docId]: '' }))
    try {
      const formData = new FormData()
      formData.append('ticket_id',    ticket.id)
      formData.append('doc_tipo_id',  docTipoId)
      formData.append('archivo',      archivo)
      formData.append('upload_token', token)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload-publico`, {
        method: 'POST',
        body:   formData,
      })
      if (!res.ok) throw new Error('Error al subir')
      setSubidos(prev => ({ ...prev, [docId]: true }))
    } catch {
      setErrores(prev => ({ ...prev, [docId]: 'Error al subir. Intenta de nuevo.' }))
    } finally {
      setSubiendo(null)
    }
  }

  const color = tramite?.color_hex || '#111'

  const renderDoc = (doc: any) => {
    const config   = doc.doc_tipos_config
    const yaSubido = subidos[doc.id] || doc.estado !== 'pendiente'
    const cargando = subiendo === doc.id
    const error    = errores[doc.id]

    return (
      <div key={doc.id} style={{
        background:   '#fff',
        borderRadius: '12px',
        padding:      '12px 14px',
        border:       `1px solid ${yaSubido ? 'rgba(59,109,17,0.2)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
            background: yaSubido ? '#EAF3DE' : config?.obligatorio ? '#FEE2E2' : '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px',
          }}>
            {yaSubido
              ? <span style={{ color: '#1A6B3C', fontWeight: 700 }}>✓</span>
              : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: config?.obligatorio ? '#E24B4A' : '#9CA3AF' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>
              {config?.nombre}
              {config?.obligatorio && (
                <span style={{ fontSize: '10px', color: '#E24B4A', fontWeight: 700, marginLeft: '6px' }}>
                  obligatorio
                </span>
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
                background: '#FEF3C7', color: '#92400E', marginBottom: '8px',
              }}>
                {config.descripcion_vigencia}
              </span>
            )}
            {yaSubido ? (
              <div style={{ fontSize: '12px', color: '#1A6B3C', fontWeight: 600, marginTop: '6px' }}>
                ✅ Documento recibido
              </div>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', cursor: cargando ? 'not-allowed' : 'pointer',
                  background: cargando ? '#F3F4F6' : color,
                  color: cargando ? '#9CA3AF' : '#fff',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  {cargando ? '⏳ Subiendo...' : '📎 Seleccionar archivo'}
                  <input type="file" style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.webp,.pdf" disabled={cargando}
                    onChange={e => {
                      const archivo = e.target.files?.[0]
                      if (archivo) subirArchivo(doc.id, doc.doc_tipo_id, archivo)
                    }} />
                </label>
                {error && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '6px' }}>{error}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: color }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 800, color: '#fff',
            }}>N3</div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Notaría Pública No. 3
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Celaya, Guanajuato</div>
            </div>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Subir documentos
          </h1>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            {tramite?.nombre} · Folio {ticket.numero}
          </div>
          {partes[0]?.nombre_completo && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '8px', fontWeight: 500 }}>
              Hola, {partes[0].nombre_completo.split(' ')[0]} 👋
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

        {/* Progreso */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>Progreso de documentos</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color }}>
              {totalSubidos}/{totalDocs}
            </span>
          </div>
          <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px', background: color,
              width: `${totalDocs > 0 ? (totalSubidos / totalDocs) * 100 : 0}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#9C9890', marginTop: '6px' }}>
            Formatos aceptados: JPG, PNG, PDF · Máx 10MB por archivo
          </div>
        </div>

        {/* Instrucciones */}
        <div style={{ background: '#EAF3DE', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', border: '1px solid rgba(59,109,17,0.15)' }}>
          <div style={{ fontSize: '12px', color: '#3B6D11', lineHeight: '1.6' }}>
            📋 <strong>Instrucciones:</strong> Sube cada documento solicitado organizados por persona. 
            Los marcados con <span style={{ color: '#E24B4A', fontWeight: 700 }}>obligatorio</span> son indispensables para continuar tu trámite.
          </div>
        </div>

        {/* Documentos por parte */}
        {docsPartes.map(({ parteConfig, parteReal, docs }: any) => {
          const avatarColor = parteConfig.color || color
          const avatar      = parteConfig.avatar || parteConfig.rol.slice(0, 2).toUpperCase()
          const nombreParte = parteReal?.nombre_completo || parteConfig.rol.replace(/_/g, ' ')
          const obligatorios = docs.filter((d: any) => d.doc_tipos_config?.obligatorio).length
          const opcionales   = docs.filter((d: any) => !d.doc_tipos_config?.obligatorio).length

          return (
            <div key={parteConfig.rol} style={{ marginBottom: '20px' }}>
              {/* Header parte */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '12px 12px 0 0',
                background: `${avatarColor}12`,
                border: `1px solid ${avatarColor}25`,
                borderBottom: 'none',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: avatarColor, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 800, color: '#fff',
                }}>
                  {avatar}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>
                    {parteConfig.rol.replace(/_/g, ' ')}
                  </div>
                  {parteReal?.nombre_completo && (
                    <div style={{ fontSize: '11px', color: '#666' }}>{nombreParte}</div>
                  )}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#9C9890' }}>
                  {obligatorios > 0 && `${obligatorios} obl.`}
                  {opcionales > 0  && ` · ${opcionales} opc.`}
                </div>
              </div>

              {/* Docs de la parte */}
              <div style={{
                padding: '12px',
                background: '#FAFAF8',
                border: `1px solid ${avatarColor}25`,
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
              }}>
                {docs.map((doc: any) => renderDoc(doc))}
              </div>
            </div>
          )
        })}

        {/* Docs de operación */}
        {docsOperacion.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '12px 12px 0 0',
              background: `${color}12`, border: `1px solid ${color}25`, borderBottom: 'none',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, color: '#fff',
              }}>
                OP
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>
                Documentos de la operación
              </div>
            </div>
            <div style={{
              padding: '12px', background: '#FAFAF8',
              border: `1px solid ${color}25`, borderTop: 'none', borderRadius: '0 0 12px 12px',
            }}>
              {docsOperacion.map((doc: any) => renderDoc(doc))}
            </div>
          </div>
        )}

        {/* Sin documentos */}
        {docsPartes.length === 0 && docsOperacion.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9C9890' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
            <div style={{ fontSize: '14px' }}>Sin documentos configurados para este trámite</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0 16px', fontSize: '11px', color: '#9C9890' }}>
          Notaría Pública No. 3 · Celaya, Guanajuato<br />
          Este enlace es personal y confidencial · No lo compartas con terceros
        </div>
      </div>
    </div>
  )
}