'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ModalConfirm from '@/components/ui/ModalConfirm'

interface Props {
  documentos: any[]
  tramite:    any
  ticket:     any
  onSubir:    (docId: string, docTipoId: string, parteId: string | null, archivo: File) => void
  onValidar:  (docId: string) => void
}

const docEstadoColor: Record<string, { bg: string, color: string, label: string }> = {
  pendiente:     { bg: '#F3F4F6', color: '#6B7280', label: 'Pendiente'  },
  recibido:      { bg: '#FAEEDA', color: '#854F0B', label: 'Recibido'   },
  ocr_procesado: { bg: '#E6F1FB', color: '#185FA5', label: 'OCR listo'  },
  validado:      { bg: '#EAF3DE', color: '#3B6D11', label: 'Validado'   },
  rechazado:     { bg: '#FCEBEB', color: '#A32D2D', label: 'Rechazado'  },
}

export default function TabDocs({ documentos, tramite, ticket, onSubir, onValidar }: Props) {
  const [docModal, setDocModal] = useState<any | null>(null)
  const partesConfig: any[] = tramite?.requiere_partes || []
  const [confirmEliminar, setConfirmEliminar] = useState(false)

  const [avisoParteId,    setAvisoParteId]    = useState<string | null>(null)
  const [avisoParteLabel, setAvisoParteLabel] = useState('')
  const [archivoPendiente, setArchivoPendiente] = useState<{
    docId: string, docTipoId: string, parteId: string | null, archivo: File
  } | null>(null)

  // Set de partes que ya vieron el aviso — para no repetirlo
  const [partesAvisadas, setPartesAvisadas] = useState<Set<string>>(new Set())

 // Incluir TODAS las partes del trámite — tengan docs o no
  const docsPartes = partesConfig.map((parte: any) => ({
    parte,
    docs: documentos.filter((d: any) => d.doc_tipos_config?.para_rol === parte.rol),
  }))

  const docsOperacion = documentos.filter((d: any) =>
    !d.doc_tipos_config?.para_rol ||
    d.doc_tipos_config?.para_rol === 'operacion' ||
    d.doc_tipos_config?.para_rol === 'inmueble'
  )

  const rolesConfig       = partesConfig.map((p: any) => p.rol)
  const docsSinClasificar = documentos.filter((d: any) => {
    const rol = d.doc_tipos_config?.para_rol
    return rol && rol !== 'operacion' && rol !== 'inmueble' && !rolesConfig.includes(rol)
  })

  const isPDF = (url: string) => url?.toLowerCase().includes('.pdf')

  function handleSubirConAviso(
    docId: string, docTipoId: string, parteId: string | null,
    archivo: File, rolLabel: string
  ) {
    // Si la parte ya vio el aviso o no tiene parteId, subir directo
    if (!parteId || partesAvisadas.has(parteId)) {
      onSubir(docId, docTipoId, parteId, archivo)
      return
    }
    // Primera vez — mostrar aviso
    setArchivoPendiente({ docId, docTipoId, parteId, archivo })
    setAvisoParteId(parteId)
    setAvisoParteLabel(rolLabel)
  }
  
  const renderDoc = (doc: any) => {

    const est       = docEstadoColor[doc.estado] || docEstadoColor.pendiente
    const tieneFile = !!doc.archivo_url
    return (
      <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.05)' }}>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: doc.doc_tipos_config?.obligatorio ? '#E24B4A' : '#9CA3AF' }} />
            <button
              onClick={() => tieneFile && setDocModal(doc)}
              className="text-[12.5px] font-semibold text-left border-none bg-transparent p-0 transition-all"
              style={{
                color:  tieneFile ? '#185FA5' : '#111',
                cursor: tieneFile ? 'pointer' : 'default',
                textDecoration: tieneFile ? 'underline' : 'none',
                textDecorationStyle: 'dotted',
              }}>
              {doc.doc_tipos_config?.nombre}
            </button>
            {doc.datos_ocr?.estado_ia && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: doc.datos_ocr.estado_ia === 'validado'  ? '#D1FAE5' :
                              doc.datos_ocr.estado_ia === 'rechazado' ? '#FEE2E2' :
                              doc.datos_ocr.estado_ia === 'revisar'   ? '#FEF3C7' : '#F3F4F6',
                  color:      doc.datos_ocr.estado_ia === 'validado'  ? '#065F46' :
                              doc.datos_ocr.estado_ia === 'rechazado' ? '#991B1B' :
                              doc.datos_ocr.estado_ia === 'revisar'   ? '#92400E' : '#6B7280',
                }}>
                {doc.datos_ocr.estado_ia === 'validado'  ? '✓ ' :
                 doc.datos_ocr.estado_ia === 'rechazado' ? '✗ ' :
                 doc.datos_ocr.estado_ia === 'revisar'   ? '⚠ ' : '· '}
                {doc.datos_ocr.mensaje_ia}
              </span>
            )}
          </div>
          {doc.doc_tipos_config?.alerta_descripcion && (
            <div className="text-[11px] mt-0.5 ml-3" style={{ color: '#9C9890' }}>
              {doc.doc_tipos_config.alerta_descripcion}
            </div>
          )}
          {doc.datos_ocr?.campos && Object.keys(doc.datos_ocr.campos).length > 0 && (
            <div className="text-[10px] mt-2 ml-3 leading-relaxed" style={{ color: '#9C9890' }}>
              {doc.datos_ocr.campos.texto_completo
                ? doc.datos_ocr.campos.texto_completo.slice(0, 120) + '...'
                : Object.entries(doc.datos_ocr.campos).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')
              }
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
            style={{ background: est.bg, color: est.color }}>
            {est.label}
          </span>

          {(doc.estado === 'ocr_procesado' || doc.estado === 'recibido') && (
            <button type="button" onClick={() => onValidar(doc.id)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
              style={{ background: '#EAF3DE', color: '#3B6D11' }}>
              Validar
            </button>
          )}

          {/* Descargar documento */}
          {/* {tieneFile && (
            <a
              href={doc.archivo_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold no-underline"
              style={{ background: '#EAF3DE', color: '#3B6D11' }}
              title="Descargar documento">
              ⬇
            </a>
          )} */}

          {/* Subir — siempre disponible si está pendiente */}
          {doc.estado === 'pendiente' && (
            <label className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
              style={{ background: '#E6F1FB', color: '#185FA5' }}>
              Subir
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={e => {
                  const archivo = e.target.files?.[0]
                  if (archivo) handleSubirConAviso(doc.id, doc.doc_tipo_id, doc.parte_id, archivo, doc.rolLabel)
                }} />
            </label>
          )}

          {/* Resubir */}
          {doc.estado !== 'pendiente' && (
            <label className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
              style={{ background: '#FEF3C7', color: '#854F0B' }}>
              🔄
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={e => {
                  const archivo = e.target.files?.[0]
                  if (archivo) onSubir(doc.id, doc.doc_tipo_id, doc.parte_id, archivo)
                  // Resubir no muestra aviso
                }} />
            </label>
          )}

          {/* Ver documento */}
          {tieneFile && (
            <button onClick={() => setDocModal(doc)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
              style={{ background: '#F3F4F6', color: '#555' }}
              title="Ver documento">
              👁
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderGrupo = (titulo: string, docs: any[], avatar: string, color: string, extra?: string, sinDocs?: boolean) => (
    <div key={titulo}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
          style={{ background: color }}>
          {avatar}
        </div>
        <span className="text-[12px] font-bold capitalize" style={{ color: '#333' }}>{titulo}</span>
        {extra && <span className="text-[10px]" style={{ color: '#9C9890' }}>{extra}</span>}
      </div>
      <div className="flex flex-col gap-2 ml-2">
        {sinDocs ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl"
            style={{ background: '#FEF3C7', border: '1px solid rgba(240,180,41,0.3)' }}>
            <span className="text-[14px] flex-shrink-0">⚠️</span>
            <div>
              <div className="text-[12px] font-semibold" style={{ color: '#92400E' }}>
                Sin documentos configurados
              </div>
              <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#92400E', opacity: 0.8 }}>
                Esta parte no tiene documentos asignados. Ve al configurador del trámite y agrega los documentos requeridos en la sección "Partes y documentos".
              </div>
            </div>
          </div>
        ) : (
          docs.map(renderDoc)
        )}
      </div>
    </div>
  )

  if (documentos.length === 0) {
    return <p className="text-[13px] text-center py-4" style={{ color: '#CCC' }}>Sin documentos configurados</p>
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {docsPartes.map(({ parte, docs }) =>
          renderGrupo(
            parte.rol.replace(/_/g, ' '),
            docs,
            parte.avatar || parte.rol.slice(0, 2).toUpperCase(),
            parte.color || tramite?.color_hex || '#666',
            docs.length > 0
              ? `${docs.filter((d: any) => d.estado === 'validado').length}/${docs.length} validados`
              : undefined,
            docs.length === 0  // ← sinDocs flag
          )
        )}
        {docsSinClasificar.length > 0 && renderGrupo('Sin clasificar', docsSinClasificar, '?', '#6B7280')}
        {docsOperacion.length > 0    && renderGrupo('Documentos de la operación', docsOperacion, 'OP', tramite?.color_hex || '#666')}
      </div>

      {/* Modal ver documento */}
      {docModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDocModal(null)}>

          <div className="rounded-2xl overflow-hidden w-full mx-4 flex flex-col"
            style={{
              background: '#fff',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              maxWidth: '720px',
              maxHeight: '90vh',
            }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold truncate" style={{ color: '#111' }}>
                  {docModal.doc_tipos_config?.nombre}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const est = docEstadoColor[docModal.estado] || docEstadoColor.pendiente
                    return (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: est.bg, color: est.color }}>
                        {est.label}
                      </span>
                    )
                  })()}
                  {docModal.datos_ocr?.mensaje_ia && (
                    <span className="text-[11px]" style={{ color: '#9C9890' }}>
                      {docModal.datos_ocr.mensaje_ia}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {/* Botón resubir en modal */}
                <label className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
                  style={{ background: '#FEF3C7', color: '#854F0B' }}>
                  🔄 Resubir
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={e => {
                      const archivo = e.target.files?.[0]
                      if (archivo) {
                        onSubir(docModal.id, docModal.doc_tipo_id, docModal.parte_id, archivo)
                        setDocModal(null)
                      }
                    }} />
                </label>
                {/* Botón eliminar en modal */}
                <button
                  onClick={() => setConfirmEliminar(true)}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
                  style={{ background: '#FEE2E2', color: '#991B1B' }}>
                  🗑 Eliminar
                </button>
                {/* Descargar documento */}
                <a
                  href={docModal.archivo_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold no-underline"
                  style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                  ⬇ Descargar
                </a>
                {/* Abrir en nueva pestaña */}
                <a href={docModal.archivo_url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold no-underline"
                  style={{ background: '#E6F1FB', color: '#185FA5' }}>
                  ↗ Abrir
                </a>
                <button onClick={() => setDocModal(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-none text-[13px]"
                  style={{ background: '#F3F4F6', color: '#666' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto p-4" style={{ background: '#F7F7F5', minHeight: '300px' }}>
              {docModal.archivo_url ? (
                isPDF(docModal.archivo_url) ? (
                  <iframe
                    src={docModal.archivo_url}
                    className="w-full rounded-xl"
                    style={{ height: '60vh', border: 'none' }}
                    title={docModal.doc_tipos_config?.nombre}
                  />
                ) : (
                  <img
                    src={docModal.archivo_url}
                    alt={docModal.doc_tipos_config?.nombre}
                    className="max-w-full mx-auto rounded-xl"
                    style={{ maxHeight: '60vh', objectFit: 'contain', display: 'block' }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <span className="text-[32px]">📄</span>
                  <span className="text-[13px]" style={{ color: '#9C9890' }}>Sin archivo subido</span>
                </div>
              )}
            </div>

            {/* Datos OCR si hay */}
            {docModal.datos_ocr?.campos && Object.keys(docModal.datos_ocr.campos).length > 0 && (
              <div className="px-5 py-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
                  Datos extraídos por IA
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {Object.entries(docModal.datos_ocr.campos)
                    .filter(([k]) => k !== 'texto_completo')
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-1.5">
                        <span style={{ color: '#9C9890' }}>{k}:</span>
                        <span className="font-medium truncate" style={{ color: '#333' }}>{String(v)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de confirmación — fuera del modal principal: */}
      {confirmEliminar && (
        <ModalConfirm
          titulo="Eliminar documento"
          descripcion={`¿Eliminar "${docModal?.doc_tipos_config?.nombre}"? El documento quedará como pendiente y el cliente deberá subirlo de nuevo.`}
          labelConfirm="Sí, eliminar"
          peligroso
          onConfirm={async () => {
            const supabase = createClient()
            await supabase.from('documentos').update({
              estado:      'pendiente',
              archivo_url: null,
              datos_ocr:   null,
            }).eq('id', docModal.id)
            setConfirmEliminar(false)
            setDocModal(null)
          }}
          onCancel={() => setConfirmEliminar(false)}
        />
      )}
      {/* Modal aviso primera subida */}
      {avisoParteId && archivoPendiente && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-[28px]"
                style={{ background: '#FEF3C7' }}>
                📋
              </div>
              <div className="text-[16px] font-bold mb-2" style={{ color: '#111' }}>
                Antes de subir el documento
              </div>
              <div className="text-[13px] leading-relaxed mb-4" style={{ color: '#555' }}>
                Para que la IA pueda validar correctamente este documento, asegúrate de que los datos de la parte <strong style={{ color: '#111' }}>{avisoParteLabel.replace(/_/g, ' ')}</strong> estén completos en la pestaña de <strong style={{ color: '#111' }}>Partes</strong>.
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { emoji: '👤', texto: 'Nombre completo tal como aparece en documentos oficiales.' },
                  { emoji: '🪪', texto: 'CURP y RFC correctos para que la IA los compare con el documento.' },
                  { emoji: '📄', texto: 'El documento debe pertenecer a esta parte — no subas documentos de otra persona.' },
                  { emoji: '✅', texto: 'Solo documentos vigentes y legibles serán validados correctamente.' },
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

            <div className="flex gap-3 px-6 py-4">
              <button onClick={() => {
                setAvisoParteId(null)
                setArchivoPendiente(null)
              }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#444' }}>
                Cancelar
              </button>
              <button onClick={() => {
                if (archivoPendiente) {
                  // Marcar esta parte como avisada para no repetir
                  setPartesAvisadas(prev => new Set([...prev, archivoPendiente.parteId!]))
                  onSubir(archivoPendiente.docId, archivoPendiente.docTipoId, archivoPendiente.parteId, archivoPendiente.archivo)
                }
                setAvisoParteId(null)
                setArchivoPendiente(null)
              }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: '#111', color: '#fff' }}>
                Sí, datos correctos →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}