'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import t from './ticket.module.css'
import { Ic, Modal } from './ticketUi'

interface Props {
  docId:     string
  nombreDoc: string
  onClose:   () => void
}

const PASOS = [
  { id: 'subiendo',   label: 'Subiendo documento',                  icono: 'upload', duracion: 1500 },
  { id: 'extrayendo', label: 'Leyendo el texto del documento',      icono: 'scan',   duracion: 3000 },
  { id: 'analizando', label: 'Analizando con inteligencia artificial', icono: 'ai',  duracion: 3000 },
  { id: 'validando',  label: 'Validando campos importantes',        icono: 'doc',    duracion: 2000 },
  { id: 'completado', label: 'Análisis terminado',                  icono: 'check',  duracion: 0    },
]

const RESULTADO: Record<string, { titulo: string; malo?: boolean; icono: string }> = {
  validado:           { titulo: 'Documento válido',     icono: 'check' },
  rechazado:          { titulo: 'Documento rechazado',  icono: 'x', malo: true },
  revision_requerida: { titulo: 'Requiere revisión',    icono: 'alert' },
  revisar:            { titulo: 'Requiere revisión',    icono: 'alert' },
  recibido:           { titulo: 'Recibido, en proceso', icono: 'clock' },
}

export default function ModalValidandoDoc({ docId, nombreDoc, onClose }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [pasoActual, setPasoActual] = useState(0)
  const [resultado,  setResultado]  = useState<any | null>(null)
  const [campos,     setCampos]     = useState<Record<string, any>>({})
  const [saliendo,   setSaliendo]   = useState(false)
  const resultadoRef = useRef<any>(null)

  // Avance animado de pasos (se detiene antes del último hasta tener resultado)
  useEffect(() => {
    if (pasoActual >= PASOS.length - 2 && !resultado) return
    if (pasoActual >= PASOS.length - 1) return
    const timeout = setTimeout(() => setPasoActual(p => p + 1), PASOS[pasoActual].duracion)
    return () => clearTimeout(timeout)
  }, [pasoActual, resultado])

  // Consulta al documento hasta que la IA termine
  useEffect(() => {
    if (!docId) return
    const intervalo = setInterval(async () => {
      const { data } = await supabase.from('documentos').select('estado, datos_ocr').eq('id', docId).single()
      if (data && data.estado !== 'recibido' && data.datos_ocr?.estado_ia) {
        resultadoRef.current = data.datos_ocr
        setResultado(data.datos_ocr)
        setCampos(data.datos_ocr.campos || {})
        setPasoActual(PASOS.length - 1)
        clearInterval(intervalo)
      }
    }, 2000)

    const limite = setTimeout(() => {
      clearInterval(intervalo)
      if (!resultadoRef.current) {
        setResultado({ estado_ia: 'recibido', mensaje_ia: 'El análisis está tardando más de lo normal. Revisa el documento en unos minutos.', campos: {} })
        setPasoActual(PASOS.length - 1)
      }
    }, 120000)

    return () => { clearInterval(intervalo); clearTimeout(limite) }
  }, [docId])

  const completado = pasoActual === PASOS.length - 1 && !!resultado
  const res = resultado ? (RESULTADO[resultado.estado_ia] || RESULTADO.recibido) : null
  const avance = completado ? 100 : Math.round((pasoActual / (PASOS.length - 1)) * 100)

  const camposConValor = Object.entries(campos)
    .filter(([k, v]) => k !== 'texto_completo' && (v as any)?.valor)
    .slice(0, 6)

  function cerrar() {
    setSaliendo(true)
    setTimeout(onClose, 190)
  }

  return (
    <Modal saliendo={saliendo} onClose={completado ? cerrar : undefined} ancho={420}>
      <div className={t.vbar}><i style={{ ['--w' as any]: `${avance}%` }} /></div>

      <div className={t.modalBody} style={{ paddingBottom: 8 }}>
        <div className={`${t.modalIc} ${res?.malo ? t.modalIcRed : ''}`} key={completado ? 'fin' : 'proceso'}>
          {completado && res ? <Ic n={res.icono} size={20} sw={2.2} /> : <span className={t.spin} style={{ width: 18, height: 18 }} />}
        </div>
        <h3>{completado && res ? res.titulo : 'Verificando documento'}</h3>
        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombreDoc}</p>
      </div>

      <div className={t.steps}>
        {PASOS.map((paso, i) => {
          const hecho = i < pasoActual || (i === pasoActual && completado)
          const ahora = i === pasoActual && !completado
          return (
            <div key={paso.id} className={`${t.vstep} ${hecho ? t.vstepDone : ''} ${ahora ? t.vstepNow : ''}`}>
              <span className={t.vstepDot}>
                {hecho ? <Ic n="check" size={13} sw={2.6} /> : ahora ? <span className={t.spin} /> : <Ic n={paso.icono} size={13} />}
              </span>
              {paso.label}
            </div>
          )
        })}
      </div>

      {completado && resultado && (
        <>
          {resultado.mensaje_ia && (
            <div className={`${t.result} ${res?.malo ? t.resultBad : ''}`}>
              <div>
                <b>{resultado.mensaje_ia}</b>
                {resultado.observaciones && <span>{resultado.observaciones}</span>}
              </div>
            </div>
          )}

          {camposConValor.length > 0 && (
            <div className={t.fields}>
              <h5>Datos extraídos</h5>
              {camposConValor.map(([clave, campo]) => {
                const c = campo as any
                const baja = typeof c.confianza === 'number' && c.confianza < 0.8
                const nombre = (clave.split('.')[1] || clave).replace(/_/g, ' ')
                return (
                  <div key={clave} className={t.field}>
                    <span>{nombre}</span>
                    <b className={baja ? t.low : ''} title={baja ? 'Confianza baja: verifícalo manualmente' : undefined}>
                      {baja ? 'Verificar · ' : ''}{c.valor}
                    </b>
                  </div>
                )
              })}
            </div>
          )}

          <div className={t.modalFoot}>
            <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={cerrar} autoFocus>Entendido</button>
          </div>
        </>
      )}

      {!completado && (
        <div className={t.cardNote} style={{ margin: '0 0 18px' }}>
          Esto toma unos segundos. No cierres esta ventana.
        </div>
      )}
    </Modal>
  )
}