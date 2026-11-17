'use client'

import { useEffect, useMemo, useState } from 'react'
import s from './wa.module.css'
import { apiGet, nombrePlantilla, AREAS_PLANTILLA, useUsuarioActual } from './waUtils'

export type Plantilla = { nombre: string; idioma: string; categoria: string; texto: string; parametros: number; botones: string[] }

let cachePlantillas: Plantilla[] | null = null

interface Props {
  areaInicial?:  string | null
  textoBoton:    string
  nota?:         string
  bloqueado?:    boolean
  onEnviar:      (plantilla: string, parametros: string[]) => Promise<void>
  onError:       (mensaje: string) => void
  onCancelar?:   () => void
}

// Convierte *negritas* de WhatsApp en <b> para la vista previa
function conNegritas(texto: string) {
  return texto.split(/(\*[^*\n]+\*)/g).map((parte, i) =>
    parte.startsWith('*') && parte.endsWith('*') ? <b key={i}>{parte.slice(1, -1)}</b> : parte)
}

export default function FormPlantilla({ areaInicial, textoBoton, nota, bloqueado, onEnviar, onError, onCancelar }: Props) {
  const usuario = useUsuarioActual()
  const [plantillas, setPlantillas] = useState<Plantilla[]>(cachePlantillas || [])
  const [cargando, setCargando] = useState(!cachePlantillas)
  const [elegida, setElegida] = useState<string>(cachePlantillas?.[0]?.nombre || '')
  const [area, setArea] = useState(areaInicial || 'Recepción')
  const [quien, setQuien] = useState('')
  const [editoQuien, setEditoQuien] = useState(false)
  const [extras, setExtras] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (cachePlantillas) return
    apiGet('/api/meta/plantillas')
      .then((data: Plantilla[]) => {
        cachePlantillas = data
        setPlantillas(data)
        if (data[0]) setElegida(data[0].nombre)
      })
      .catch((e: Error) => onError(`No se pudieron cargar las plantillas: ${e.message}`))
      .finally(() => setCargando(false))
  }, [])

  // {{1}}: el área cambia si cambia el área de origen (p. ej. en nueva conversación)
  useEffect(() => { if (areaInicial) setArea(areaInicial) }, [areaInicial])
  // {{2}}: se autocompleta con quien tiene la sesión, pero se puede editar
  useEffect(() => { if (usuario?.nombre && !editoQuien) setQuien(usuario.nombre) }, [usuario?.nombre])

  const tpl = plantillas.find(p => p.nombre === elegida) || null
  const areas = useMemo(() => (area && !AREAS_PLANTILLA.includes(area) ? [area, ...AREAS_PLANTILLA] : AREAS_PLANTILLA), [area])

  // Las 5 plantillas usan {{1}} = área y {{2}} = quien escribe; si alguna trae más, se piden aparte
  const parametros = useMemo(() => {
    if (!tpl) return []
    const base = [area, quien]
    return Array.from({ length: tpl.parametros }, (_, i) => (i < 2 ? base[i] : extras[i - 2] || ''))
  }, [tpl, area, quien, extras])

  const vista = tpl ? tpl.texto.replace(/\{\{(\d+)\}\}/g, (_, n) => parametros[Number(n) - 1] || `{{${n}}}`) : ''
  const completo = !!tpl && parametros.every(p => p.trim())

  async function enviar() {
    if (!tpl || !completo) return
    setEnviando(true)
    try { await onEnviar(tpl.nombre, parametros.map(p => p.trim())) }
    finally { setEnviando(false) }
  }

  if (cargando) return <div className={s.lockedNote}>Cargando plantillas…</div>
  if (!plantillas.length) return <div className={s.lockedNote}>Las plantillas todavía no están aprobadas por Meta.</div>

  return (
    <div>
      <div className={s.tplPills} role="radiogroup" aria-label="Plantilla">
        {plantillas.map(p => (
          <button key={p.nombre} type="button" role="radio" aria-checked={elegida === p.nombre}
            className={`${s.tplPill} ${elegida === p.nombre ? s.tplPillOn : ''}`}
            onClick={() => setElegida(p.nombre)}>
            {nombrePlantilla(p.nombre)}
          </button>
        ))}
      </div>

      {tpl && (
        <>
          <div className={s.tplGrid}>
            <div>
              <label className={s.tplLabel} htmlFor="tpl-area">Área</label>
              <select id="tpl-area" className={s.tplInput} value={area} onChange={e => setArea(e.target.value)}>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className={s.tplLabel} htmlFor="tpl-quien">Nombre de quien escribe</label>
              <input id="tpl-quien" className={s.tplInput} value={quien} placeholder="Tu nombre"
                onChange={e => { setQuien(e.target.value); setEditoQuien(true) }} />
            </div>
            {tpl.parametros > 2 && Array.from({ length: tpl.parametros - 2 }, (_, i) => (
              <div key={i}>
                <label className={s.tplLabel}>{`Dato {{${i + 3}}}`}</label>
                <input className={s.tplInput} value={extras[i] || ''}
                  onChange={e => setExtras(prev => { const n = [...prev]; n[i] = e.target.value; return n })} />
              </div>
            ))}
          </div>

          <div className={s.previewWrap}>
            <div key={elegida} className={s.previewBubble}>{conNegritas(vista)}</div>
            {tpl.botones.length > 0 && (
              <div className={s.previewBtns}>
                {tpl.botones.map(b => <div key={b} className={s.previewBtn}>↩ {b}</div>)}
              </div>
            )}
          </div>

          <div className={s.tplFoot}>
            {nota ? <small>{nota}</small> : <small>Cuando el cliente toque un botón, se abre la conversación y lo demás es gratis.</small>}
            <div style={{ display: 'flex', gap: 8 }}>
              {onCancelar && <button type="button" className={s.btnGhost} onClick={onCancelar} disabled={enviando}>Cancelar</button>}
              <button type="button" className={s.btnGreen} onClick={enviar} disabled={!completo || enviando || bloqueado}>
                {enviando ? 'Enviando…' : textoBoton}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}