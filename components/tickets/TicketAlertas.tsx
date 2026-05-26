interface Props {
  documentos:  any[]
  ticket:      any
  apiUrl:      string
}

export default function TicketAlertas({ documentos, ticket, apiUrl }: Props) {
  const docsConAlerta = documentos.filter((d: any) =>
    d.datos_ocr?.estado_ia === 'rechazado' ||
    d.datos_ocr?.estado_ia === 'revisar'
  )

  if (docsConAlerta.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(226,75,74,0.2)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ background: '#FEF2F2', borderBottom: '1px solid rgba(226,75,74,0.15)' }}>
        <span className="text-[14px]">⚠️</span>
        <div>
          <div className="text-[12px] font-bold" style={{ color: '#991B1B' }}>
            Alertas de IA — {docsConAlerta.length} documento{docsConAlerta.length !== 1 ? 's' : ''} requiere{docsConAlerta.length === 1 ? '' : 'n'} acción
          </div>
          <div className="text-[10px]" style={{ color: '#C87171' }}>
            Revisión automática por Azure Document Intelligence
          </div>
        </div>
      </div>

      <div className="bg-white divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        {docsConAlerta.map((doc: any) => {
          const estadoIA  = doc.datos_ocr?.estado_ia
          const mensajeIA = doc.datos_ocr?.mensaje_ia
          const nombre    = doc.doc_tipos_config?.nombre || 'Documento'
          const icono     = estadoIA === 'rechazado' ? '❌' : '⚠️'

          return (
            <div key={doc.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-[13px] flex-shrink-0 mt-0.5">{icono}</span>
                <div className="flex-1">
                  <div className="text-[12.5px] font-bold" style={{ color: '#111' }}>{nombre}</div>
                  <div className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: '#666' }}>{mensajeIA}</div>

                  {doc.datos_ocr?.validaciones?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {doc.datos_ocr.validaciones.map((v: any, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                          style={{
                            background: v.valido === false ? '#FEE2E2' : v.valido === true ? '#D1FAE5' : '#FEF3C7',
                            color:      v.valido === false ? '#991B1B' : v.valido === true ? '#065F46' : '#92400E',
                          }}>
                          {v.campo}: {v.mensaje}
                        </span>
                      ))}
                    </div>
                  )}

                  {ticket.partes?.[0]?.telefono && (
                    <button
                      onClick={async () => {
                        const telefono = ticket.partes[0].telefono
                        const msg = `Hola, te escribimos de Notaría Pública No. 3. Tu documento *${nombre}* requiere atención: ${mensajeIA}. Por favor sube uno nuevo desde tu link de carga.`
                        await fetch(`${apiUrl}/api/twilio/enviar`, {
                          method:  'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body:    JSON.stringify({ telefono, mensaje: msg, conversacion_id: null }),
                        })
                        alert('✅ Mensaje enviado al cliente')
                      }}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                      style={{ background: '#E9F7EF', color: '#1A6B3C' }}>
                      💬 Notificar al cliente por WA
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}