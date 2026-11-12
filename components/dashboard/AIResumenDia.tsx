'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import d from './dashboard.module.css'
import { Ic } from './dashUtil'

export interface DatosResumen {
  periodoTexto: string
  ingresados:   number
  anterior:     number | null
  porEstado:    Record<string, number>
  enRiesgo:     number
  vencidos:     number
  topAreas:     { area: string; total: number }[]
  topTramites:  { tramite: string; total: number }[]
}

export default function AIResumenDia({ datos }: { datos: DatosResumen }) {
  const [resumen, setResumen] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(false)

  async function generar() {
    setCargando(true)
    setError(false)
    setResumen('')
    const e = datos.porEstado
    const mensaje = `Genera un resumen ejecutivo para el notario sobre ${datos.periodoTexto}, con estos datos de la notaría:
- Expedientes ingresados: ${datos.ingresados}${datos.anterior !== null ? ` (periodo anterior: ${datos.anterior})` : ''}
- Por etapa: Nuevo (sin asignar) ${e.nuevo || 0}, Asignado ${e.asignado || 0}, Folio DBA ${e.folio_dba || 0}, Escritura DBA ${e.escritura_dba || 0}, Completados ${e.completado || 0}, Cancelados ${e.cancelado || 0}
- Expedientes activos con plazo vencido: ${datos.vencidos}
- Expedientes en riesgo (vencidos o que vencen en 3 días): ${datos.enRiesgo}
- Áreas con más carga: ${datos.topAreas.slice(0, 3).map(a => `${a.area} (${a.total})`).join(', ') || 'sin datos'}
- Trámites más frecuentes: ${datos.topTramites.slice(0, 3).map(t => `${t.tramite} (${t.total})`).join(', ') || 'sin datos'}
Sé breve, directo y profesional. Máximo 4 puntos concretos en lista. Incluye recomendaciones de acción para hoy. Usa negritas solo para lo más importante.`

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, historial: [] }),
      })
      const data = await res.json()
      if (!res.ok || !data.respuesta) throw new Error()
      setResumen(data.respuesta)
    } catch {
      setError(true)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className={d.ai}>
      {cargando && <span className={d.aiSweep} />}
      <div className={d.aiHead}>
        <span className={`${d.aiIc} ${cargando ? d.aiIcBusy : ''}`}><Ic n="ai" size={17} /></span>
        <div>
          <h3>Resumen con Notaría AI</h3>
          <p>Lectura ejecutiva de {datos.periodoTexto} con recomendaciones</p>
        </div>
        <button type="button" className={d.btn} onClick={generar} disabled={cargando}>
          {cargando ? 'Analizando…' : resumen ? 'Analizar de nuevo' : 'Analizar'}
        </button>
      </div>
      <div className={d.aiBody}>
        {cargando ? (
          <div className={d.skeleton}>
            <i style={{ width: '92%' }} /><i style={{ width: '78%' }} /><i style={{ width: '85%' }} /><i style={{ width: '60%' }} />
          </div>
        ) : error ? (
          <div className={d.aiHint} style={{ color: '#b42318' }}>No se pudo generar el resumen. Intenta de nuevo en un momento.</div>
        ) : resumen ? (
          <div className={d.aiText} key={resumen}>
            <ReactMarkdown>{resumen}</ReactMarkdown>
          </div>
        ) : (
          <div className={d.aiHint}>Presiona "Analizar" para obtener un resumen del periodo seleccionado con recomendaciones de acción.</div>
        )}
      </div>
    </section>
  )
}