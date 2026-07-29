'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  docId:         string
  nombreDoc:     string
  onClose:       () => void
}

const PASOS = [
  { id: 'subiendo',    label: 'Subiendo documento',           emoji: '📤', duracion: 1500 },
  { id: 'extrayendo',  label: 'Extrayendo texto con OCR',     emoji: '🔍', duracion: 3000 },
  { id: 'analizando',  label: 'Analizando con Inteligencia Artificial', emoji: '🤖', duracion: 3000 },
  { id: 'validando',   label: 'Validando campos críticos',    emoji: '✅', duracion: 2000 },
  { id: 'completado',  label: 'Análisis completado',          emoji: '🎉', duracion: 0    },
]

const ESTADO_CONFIG = {
  validado:           { color: '#065F46', bg: '#D1FAE5', icono: '✅', label: 'Documento válido'         },
  rechazado:          { color: '#991B1B', bg: '#FEE2E2', icono: '❌', label: 'Documento rechazado'      },
  revision_requerida: { color: '#92400E', bg: '#FEF3C7', icono: '⚠️', label: 'Requiere revisión'        },
  recibido:           { color: '#185FA5', bg: '#E6F1FB', icono: '📥', label: 'Recibido — procesando...' },
}

export default function ModalValidandoDoc({ docId, nombreDoc, onClose }: Props) {
  const supabase    = createClient()
  const [pasoActual, setPasoActual] = useState(0)
  const [resultado,  setResultado]  = useState<any | null>(null)
  const [campos,     setCampos]     = useState<Record<string, any>>({})

  // Avanzar pasos animados
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (pasoActual < PASOS.length - 1) {
      timeout = setTimeout(() => {
        setPasoActual(prev => prev + 1)
      }, PASOS[pasoActual].duracion)
    }
    return () => clearTimeout(timeout)
  }, [pasoActual])

  // Polling al documento hasta que tenga resultado
  useEffect(() => {
    if (!docId) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('documentos')
        .select('estado, datos_ocr')
        .eq('id', docId)
        .single()

      if (data && data.estado !== 'recibido' && data.datos_ocr?.estado_ia) {
        setResultado(data.datos_ocr)
        setCampos(data.datos_ocr.campos || {})
        setPasoActual(PASOS.length - 1)
        clearInterval(interval)
      }
    }, 2000)

    // Timeout de 60 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!resultado) {
        setResultado({ estado_ia: 'recibido', mensaje_ia: 'El análisis está tardando más de lo esperado. Revisa en unos momentos.', campos: {} })
        setPasoActual(PASOS.length - 1)
      }
    }, 60000)

    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [docId])

  const completado   = pasoActual === PASOS.length - 1 && resultado
  const estadoConfig = resultado ? (ESTADO_CONFIG[resultado.estado_ia as keyof typeof ESTADO_CONFIG] || ESTADO_CONFIG.recibido) : null

  // Campos con valor para mostrar
  const camposConValor = Object.entries(campos)
    .filter(([k, v]) => k !== 'texto_completo' && (v as any)?.valor)
    .slice(0, 6)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
              style={{ background: completado && estadoConfig ? estadoConfig.bg : '#F0F4FF' }}>
              {completado && estadoConfig ? estadoConfig.icono : '📄'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate" style={{ color: '#111' }}>{nombreDoc}</div>
              <div className="text-[11px]" style={{ color: '#9C9890' }}>
                {completado && estadoConfig ? estadoConfig.label : 'Verificando documento...'}
              </div>
            </div>
          </div>
        </div>

        {/* Pasos */}
        <div className="px-5 py-4">
          <div className="flex flex-col gap-2.5">
            {PASOS.map((paso, i) => {
              const done    = i < pasoActual || (i === pasoActual && completado)
              const current = i === pasoActual && !completado
              const pending = i > pasoActual

              return (
                <div key={paso.id} className="flex items-center gap-3">
                  {/* Indicador */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] transition-all"
                    style={{
                      background: done    ? '#D1FAE5' :
                                  current ? '#EEF4FF' : '#F3F4F6',
                      border:     current ? '2px solid #185FA5' : '2px solid transparent',
                    }}>
                    {done ? '✓' : current ? (
                      <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
                    ) : paso.emoji}
                  </div>

                  {/* Label */}
                  <span className="text-[12.5px] transition-all"
                    style={{
                      color:      done ? '#065F46' : current ? '#185FA5' : '#9C9890',
                      fontWeight: current ? 600 : done ? 500 : 400,
                    }}>
                    {paso.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resultado — solo cuando completado */}
        {completado && resultado && (
          <>
            {/* Badge resultado */}
            <div className="px-5 pb-3">
              <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                style={{ background: estadoConfig!.bg, border: `1px solid ${estadoConfig!.color}20` }}>
                <span className="text-[16px] flex-shrink-0">{estadoConfig!.icono}</span>
                <div>
                  <div className="text-[12px] font-bold" style={{ color: estadoConfig!.color }}>
                    {resultado.mensaje_ia}
                  </div>
                  {resultado.observaciones && (
                    <div className="text-[11px] mt-0.5" style={{ color: estadoConfig!.color, opacity: 0.8 }}>
                      {resultado.observaciones}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Campos extraídos */}
            {camposConValor.length > 0 && (
              <div className="px-5 pb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
                  Datos extraídos
                </div>
                <div className="flex flex-col gap-1">
                  {camposConValor.map(([clave, campo]) => {
                    const c    = campo as any
                    const baja = c.confianza < 0.8
                    const key  = clave.split('.')[1] || clave
                    return (
                      <div key={clave} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="capitalize" style={{ color: '#9C9890' }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium truncate text-right"
                          style={{
                            color:      baja ? '#F59E0B' : '#111',
                            maxWidth:   '60%',
                          }}>
                          {baja && '⚠ '}{c.valor}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: '#111', color: '#fff' }}>
                Entendido
              </button>
            </div>
          </>
        )}

        {/* Loading sin resultado aún */}
        {!completado && (
          <div className="px-5 pb-5 text-center">
            <div className="text-[11px]" style={{ color: '#9C9890' }}>
              La IA está analizando el documento...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}