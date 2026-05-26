interface Props {
  documentos:  any[]
  tramite:     any
  ticket:      any
  onSubir:     (docId: string, docTipoId: string, parteId: string | null, archivo: File) => void
  onValidar:   (docId: string) => void
}

const docEstadoColor: Record<string, { bg: string, color: string, label: string }> = {
  pendiente:     { bg: '#F3F4F6', color: '#6B7280', label: 'Pendiente'  },
  recibido:      { bg: '#FAEEDA', color: '#854F0B', label: 'Recibido'   },
  ocr_procesado: { bg: '#E6F1FB', color: '#185FA5', label: 'OCR listo'  },
  validado:      { bg: '#EAF3DE', color: '#3B6D11', label: 'Validado'   },
  rechazado:     { bg: '#FCEBEB', color: '#A32D2D', label: 'Rechazado'  },
}

export default function TabDocs({ documentos, tramite, ticket, onSubir, onValidar }: Props) {
  const partesConfig: any[] = tramite?.requiere_partes || []

  const docsPartes = partesConfig.map((parte: any) => ({
    parte,
    docs: documentos.filter((d: any) => d.doc_tipos_config?.para_rol === parte.rol),
  })).filter(g => g.docs.length > 0)

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

  const renderDoc = (doc: any) => {
    const est = docEstadoColor[doc.estado] || docEstadoColor.pendiente
    return (
      <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: doc.doc_tipos_config?.obligatorio ? '#E24B4A' : '#9CA3AF' }} />
            <div className="text-[12.5px] font-semibold" style={{ color: '#111' }}>
              {doc.doc_tipos_config?.nombre}
            </div>
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
                : Object.entries(doc.datos_ocr.campos)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')
                }
            </div>
            )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
            style={{ background: est.bg, color: est.color }}>
            {est.label}
          </span>
          {(doc.estado === 'pendiente' || doc.estado === 'recibido') && (
            <label className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
              style={{ background: '#E6F1FB', color: '#185FA5' }}>
              Subir
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={e => {
                  const archivo = e.target.files?.[0]
                  if (archivo) onSubir(doc.id, doc.doc_tipo_id, doc.parte_id, archivo)
                }} />
            </label>
          )}
          {(doc.estado === 'ocr_procesado' || doc.estado === 'recibido') && (
            <button type="button" onClick={() => onValidar(doc.id)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
              style={{ background: '#EAF3DE', color: '#3B6D11' }}>
              Validar
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderGrupo = (titulo: string, docs: any[], avatar: string, color: string, extra?: string) => (
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
        {docs.map(renderDoc)}
      </div>
    </div>
  )

  if (documentos.length === 0) {
    return <p className="text-[13px] text-center py-4" style={{ color: '#CCC' }}>Sin documentos configurados</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {docsPartes.map(({ parte, docs }) =>
        renderGrupo(
          parte.rol.replace(/_/g, ' '),
          docs,
          parte.avatar || parte.rol.slice(0, 2).toUpperCase(),
          parte.color || tramite?.color_hex || '#666',
          `${docs.filter((d: any) => d.estado === 'validado').length}/${docs.length} validados`
        )
      )}
      {docsSinClasificar.length > 0 && renderGrupo('Sin clasificar', docsSinClasificar, '?', '#6B7280')}
      {docsOperacion.length > 0    && renderGrupo('Documentos de la operación', docsOperacion, 'OP', tramite?.color_hex || '#666')}
    </div>
  )
}