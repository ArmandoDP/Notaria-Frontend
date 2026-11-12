'use client'

import { useEffect, useMemo, useState } from 'react'
import s from './wa.module.css'
import { apiGet, apiPost, nombrePlantilla, ApiError } from './waUtils'

type Plantilla = { nombre: string; idioma: string; categoria: string; texto: string; parametros: number }

let cachePlantillas: Plantilla[] | null = null

interface Props {
  conversacion: any
  onEnviada: () => void
  onError: (mensaje: string) => void
  onCerrar?: () => void
}

function valoresIniciales(p: Plantilla, conversacion: any): string[] {
  const valores = Array.from({ length: p.parametros }, () => '')
  if (!p.parametros) return valores
  const nombreCliente = conversacion.nombre && !/^\+?\d+$/.test(conversacion.nombre) ? conversacion.nombre : ''
  if (/hola\s*\{\{1\}\}/i.test(p.texto)) valores[0] = nombreCliente
  else if (p.nombre.includes('contacto_area')) valores[0] = conversacion.areas?.nombre || ''
  return valores
}

export default function PanelPlantillas({ conversacion, onEnviada, onError, onCerrar }: Props) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>(cachePlantillas || [])
  const [cargando, setCargando] = useState(!cachePlantillas)
  const [elegida, setElegida] = useState<Plantilla | null>(null)
  const [valores, setValores] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (cachePlantillas) return
    apiGet('/api/meta/plantillas')
      .then((data: Plantilla[]) => { cachePlantillas = data; setPlantillas(data) })
      .catch((e: Error) => onError(`No se pudieron cargar las plantillas: ${e.message}`))
      .finally(() => setCargando(false))
  }, [])

  const vistaPrevia = useMemo(() => {
    if (!elegida) return ''
    return elegida.texto.replace(/\{\{(\d+)\}\}/g, (_, n) => valores[Number(n) - 1] || `{{${n}}}`)
  }, [elegida, valores])

  function elegir(p: Plantilla) {
    setElegida(p)
    setValores(valoresIniciales(p, conversacion))
  }

  async function enviar() {
    if (!elegida) return
    setEnviando(true)
    try {
      await apiPost('/api/meta/enviar-plantilla', {
        conversacion_id: conversacion.id,
        plantilla: elegida.nombre,
        parametros: valores,
      })
      setElegida(null)
      onEnviada()
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'No se pudo enviar la plantilla')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <div className={s.lockedNote}>Cargando plantillas…</div>
  if (!plantillas.length) return <div className={s.lockedNote}>No hay plantillas aprobadas en Meta.</div>

  if (elegida) {
    const completas = valores.every(v => v.trim())
    return (
      <div className={s.tmplForm}>
        <div className={s.tmplPreview}>{vistaPrevia}</div>
        {valores.map((v, i) => (
          <label key={i} className={s.tmplField}>
            {`{{${i + 1}}}`}
            <input
              value={v}
              autoFocus={i === 0}
              onChange={e => setValores(prev => prev.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="Valor"
            />
          </label>
        ))}
        <div className={s.tmplActions}>
          <button className={s.btnGhost} onClick={() => setElegida(null)}>Cambiar plantilla</button>
          <button className={s.btnGreen} disabled={!completas || enviando} onClick={enviar}>
            {enviando ? 'Enviando…' : 'Enviar plantilla'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.tmplRow}>
      {plantillas.map(p => (
        <button key={p.nombre} className={s.tmplBtn} onClick={() => elegir(p)} title={p.texto}>
          {nombrePlantilla(p.nombre)}
        </button>
      ))}
      {onCerrar && <button className={s.btnGhost} onClick={onCerrar}>Cerrar</button>}
    </div>
  )
}