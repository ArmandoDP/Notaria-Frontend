'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SeccionCanal, { nombreCanal } from '../nueva-solicitud/SeccionCanal'
import SeccionTramite   from '../nueva-solicitud/SeccionTramite'
import SeccionPartes, { parteCompleta } from '../nueva-solicitud/SeccionPartes'
import SeccionPreguntas from '../nueva-solicitud/SeccionPreguntas'
import SeccionRiesgos   from '../nueva-solicitud/SeccionRiesgos'
import ModalCreandoTicket from '../../ui/ModalCreandoTicket'
import s from './nuevaSolicitud.module.css'

type EstadoPaso = 'pendiente' | 'activo' | 'listo'

interface Paso {
  label:  string
  estado: EstadoPaso
}

interface Parte {
  rol:              string
  nombre_completo:  string
  curp:             string
  rfc:              string
  telefono:         string
  email:            string
  es_persona_moral: boolean
  es_extranjero:    boolean
  pasaporte:        string
  residencia:       string
  datos_adicionales: Record<string, string>
}

interface RespuestaPregunta {
  pregunta:  string
  respuesta: string
  orden:     number
}

function parteVacia(rol: string, esPM = false): Parte {
  return {
    rol,
    nombre_completo:  '',
    curp:             '',
    rfc:              '',
    telefono:         '',
    email:            '',
    es_persona_moral: esPM,
    es_extranjero:    false,
    pasaporte:        '',
    residencia:       '',
    datos_adicionales: {},
  }
}

export default function NuevaSolicitudForm({ tramites, areas }: { tramites: any[]; areas: any[] }) {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [canal,      setCanal]      = useState('front_desk')
  const [tramiteId,  setTramiteId]  = useState('')
  const [areaId,     setAreaId]     = useState('')
  const [partes,     setPartes]     = useState<Parte[]>([])
  const [respuestas, setRespuestas] = useState<RespuestaPregunta[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const [creando, setCreando] = useState(false)
  const [pasos, setPasos] = useState<Paso[]>([
    { label: 'Generando número de expediente...',     estado: 'pendiente' },
    { label: 'Asignando al área correspondiente...',  estado: 'pendiente' },
    { label: 'Configurando documentos requeridos...', estado: 'pendiente' },
    { label: 'Enviando confirmación al cliente...',   estado: 'pendiente' },
  ])

  const tramiteSeleccionado = tramites.find(t => t.id === tramiteId)
  const areaSeleccionada = areas.find(a => a.id === areaId)

  function onTramiteChange(id: string) {
    setTramiteId(id)
    setError('')
    const t = tramites.find(t => t.id === id)
    if (!t) { setPartes([]); setAreaId(''); setRespuestas([]); return }

    setAreaId(t.area_id_default || '')

    const partesConfig: any[] = t.requiere_partes || []
    setPartes(partesConfig
      .filter((p: any) => p.rol !== 'empresa' && p.rol !== 'inmueble')
      .map((p: any) => parteVacia(p.rol, p.es_pm || false)))

    const preguntas: string[] = t.preguntas_clave || []
    setRespuestas(preguntas.map((p, i) => ({ pregunta: p, respuesta: '', orden: i })))
  }

  function updateParte(index: number, field: keyof Parte, value: any) {
    setPartes(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function updateRespuesta(index: number, value: string) {
    setRespuestas(prev => prev.map((r, i) => (i === index ? { ...r, respuesta: value } : r)))
  }

  function agregarSocio() {
    const partesConfig: any[] = tramiteSeleccionado?.requiere_partes || []
    const rolRepetible = partesConfig.find((p: any) => p.rol === 'socio')
    if (!rolRepetible) return
    setPartes(prev => [...prev, parteVacia(rolRepetible.rol)])
  }

  function avanzarPaso(index: number) {
    setPasos(prev => prev.map((p, i) => ({
      ...p,
      estado: i < index ? 'listo' : i === index ? 'activo' : 'pendiente',
    })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tramiteId || !areaId) { setError('Selecciona un trámite y el área responsable.'); return }
    setLoading(true)
    setError('')
    setCreando(true)
    avanzarPaso(0)

    try {
      await new Promise(r => setTimeout(r, 600))
      avanzarPaso(1)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tramite_id:        tramiteId,
          canal,
          area_id:           areaId,
          areas_adicionales: [],
          partes:            partes
            .filter(p => p.nombre_completo || p.telefono)
            .map((p, i) => ({ ...p, orden: i })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Error al crear el ticket')
      }

      const ticket = await res.json()
      avanzarPaso(2)

      const respondidas = respuestas.filter(r => r.respuesta.trim())
      if (respondidas.length > 0) {
        await supabase.from('ticket_preguntas').insert(
          respondidas.map(r => ({
            ticket_id: ticket.id,
            pregunta:  r.pregunta,
            respuesta: r.respuesta,
            orden:     r.orden,
          }))
        )
      }

      avanzarPaso(3)
      await new Promise(r => setTimeout(r, 800))
      setPasos(prev => prev.map(p => ({ ...p, estado: 'listo' as const })))
      await new Promise(r => setTimeout(r, 600))

      router.push(`/tickets/${ticket.id}`)
    } catch (err: any) {
      setCreando(false)
      setError(err?.message === 'Failed to fetch'
        ? 'No hay conexión con el servidor. Intenta de nuevo en un momento.'
        : err?.message || 'Error al crear el ticket')
      setLoading(false)
    }
  }

  const tieneSocios = tramiteSeleccionado?.requiere_partes?.some((p: any) => p.rol === 'socio')

  // Numeración dinámica de secciones (algunas solo aparecen según el trámite)
  const hayRiesgos   = (tramiteSeleccionado?.riesgos || []).length > 0
  const hayPreguntas = respuestas.length > 0
  const hayPartes    = partes.length > 0
  let n = 2
  const numRiesgos   = hayRiesgos ? ++n : 0
  const numPreguntas = hayPreguntas ? ++n : 0
  const numPartes    = hayPartes ? ++n : 0

  // Resumen
  const partesCompletas = partes.filter(parteCompleta).length
  const respondidas = respuestas.filter(r => r.respuesta.trim()).length
  const faltantes = [
    !tramiteId && 'Seleccionar el trámite',
    tramiteId && !areaId && 'Seleccionar el área responsable',
  ].filter(Boolean) as string[]
  const sugerencias = [
    hayPartes && partesCompletas === 0 && 'Capturar al menos una parte con nombre y teléfono',
  ].filter(Boolean) as string[]

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Nueva solicitud</h1>
        <p>Captura los datos del cliente y del trámite para abrir el expediente.</p>
      </div>

      <form onSubmit={handleSubmit} className={s.layout} noValidate>
        <div className={s.form}>
          <SeccionCanal canal={canal} onChange={setCanal} numero={1} />

          <SeccionTramite
            tramites={tramites}
            areas={areas}
            tramiteId={tramiteId}
            areaId={areaId}
            onTramiteChange={onTramiteChange}
            onAreaChange={id => { setAreaId(id); setError('') }}
            numero={2}
          />

          {!tramiteId && (
            <div className={s.empty}>
              Selecciona un trámite para ver sus consideraciones, preguntas clave y las partes que intervienen.
            </div>
          )}

          <SeccionRiesgos riesgos={tramiteSeleccionado?.riesgos || []} numero={numRiesgos} />

          <SeccionPreguntas respuestas={respuestas} onUpdate={updateRespuesta} numero={numPreguntas} />

          <SeccionPartes
            partes={partes}
            tieneSocios={!!tieneSocios}
            onUpdate={updateParte}
            onAgregar={agregarSocio}
            onQuitar={i => setPartes(prev => prev.filter((_, idx) => idx !== i))}
            numero={numPartes}
          />
        </div>

        {/* Resumen */}
        <aside className={s.summary}>
          <div className={s.sumHead}><h3>Resumen</h3></div>
          <div className={s.sumList}>
            <div className={s.sumRow}><span>Canal</span><b>{nombreCanal(canal)}</b></div>
            <div className={s.sumRow}>
              <span>Trámite</span>
              <b className={tramiteSeleccionado ? '' : s.muted} title={tramiteSeleccionado?.nombre}>
                {tramiteSeleccionado?.nombre || 'Sin seleccionar'}
              </b>
            </div>
            <div className={s.sumRow}>
              <span>Área</span>
              <b className={areaSeleccionada ? '' : s.muted}>{areaSeleccionada?.nombre || 'Sin seleccionar'}</b>
            </div>
            <div className={s.sumRow}>
              <span>Plazo</span>
              <b className={tramiteSeleccionado ? '' : s.muted}>
                {tramiteSeleccionado ? `${tramiteSeleccionado.sla_dias_total} días hábiles` : '—'}
              </b>
            </div>
            {hayPartes && (
              <div className={s.sumRow}><span>Partes</span><b>{partesCompletas} de {partes.length} completas</b></div>
            )}
            {hayPreguntas && (
              <div className={s.sumRow}><span>Preguntas</span><b>{respondidas} de {respuestas.length} respondidas</b></div>
            )}
          </div>

          {(faltantes.length > 0 || sugerencias.length > 0) && (
            <div className={s.missing}>
              <b>{faltantes.length ? 'Falta' : 'Sugerencia'}</b>
              <ul style={{ margin: 0, padding: 0 }}>
                {[...faltantes, ...sugerencias].map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          <div className={s.sumFoot}>
            {error && (
              <div className={s.error} role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}
            <button type="submit" className={s.submit} disabled={loading || faltantes.length > 0}>
              {loading ? 'Creando ticket…' : 'Crear ticket'}
            </button>
            <p className={s.hint}>Se asignará un número de expediente y se notificará al área.</p>
          </div>
        </aside>

        {creando && <ModalCreandoTicket pasos={pasos} />}
      </form>
    </div>
  )
}