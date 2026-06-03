'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SeccionCanal     from '../nueva-solicitud/SeccionCanal'
import SeccionTramite   from '../nueva-solicitud/SeccionTramite'
import SeccionPartes    from '../nueva-solicitud/SeccionPartes'
import SeccionPreguntas from '../nueva-solicitud/SeccionPreguntas'
import SeccionRiesgos from '../nueva-solicitud/SeccionRiesgos'
import ModalCreandoTicket from '../../ui/ModalCreandoTicket'

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
  datos_adicionales: Record<string, string>
}

interface RespuestaPregunta {
  pregunta:  string
  respuesta: string
  orden:     number
}

export default function NuevaSolicitudForm({ tramites, areas }: { tramites: any[], areas: any[] }) {
  const router   = useRouter()
  const supabase = createClient()

  const [canal,      setCanal]      = useState('front_desk')
  const [tramiteId,  setTramiteId]  = useState('')
  const [areaId,     setAreaId]     = useState('')
  const [partes,     setPartes]     = useState<Parte[]>([])
  const [respuestas, setRespuestas] = useState<RespuestaPregunta[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error, setError] = useState('')
  
  const [creando, setCreando] = useState(false)
  const [pasos, setPasos] = useState<Paso[]>([
    { label: 'Generando número de expediente...',    estado: 'pendiente' },
    { label: 'Asignando al área correspondiente...', estado: 'pendiente' },
    { label: 'Configurando documentos requeridos...', estado: 'pendiente' },
    { label: 'Enviando confirmación al cliente...',   estado: 'pendiente' },
  ])


  const tramiteSeleccionado = tramites.find(t => t.id === tramiteId)

  function onTramiteChange(id: string) {
    setTramiteId(id)
    const t = tramites.find(t => t.id === id)
    if (!t) { setPartes([]); setAreaId(''); setRespuestas([]); return }

    setAreaId(t.area_id_default || '')

    const partesConfig: any[] = t.requiere_partes || []
    setPartes(partesConfig
      .filter((p: any) => p.rol !== 'empresa' && p.rol !== 'inmueble')
      .map((p: any) => ({
        rol:              p.rol,
        nombre_completo:  '',
        curp:             '',
        rfc:              '',
        telefono:         '',
        email:            '',
        es_persona_moral: p.es_pm || false,
        es_extranjero:    false,   // ← nuevo
        pasaporte:        '',      // ← nuevo
        residencia:       '',      // ← nuevo
        datos_adicionales: {},
      }))
    )

    const preguntas: string[] = t.preguntas_clave || []
    setRespuestas(preguntas.map((p, i) => ({
      pregunta:  p,
      respuesta: '',
      orden:     i,
    })))
  }

  function updateParte(index: number, field: keyof Parte, value: any) {
    setPartes(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function updateRespuesta(index: number, value: string) {
    setRespuestas(prev => prev.map((r, i) => i === index ? { ...r, respuesta: value } : r))
  }

  function agregarSocio() {
    const partesConfig: any[] = tramiteSeleccionado?.requiere_partes || []
    const rolRepetible = partesConfig.find((p: any) => p.rol === 'socio')
    if (!rolRepetible) return
    setPartes(prev => [...prev, {
      rol: rolRepetible.rol, nombre_completo: '', curp: '', rfc: '',
      telefono: '', email: '', es_persona_moral: false, datos_adicionales: {},
    }])
  }

  function avanzarPaso(index: number) {
  setPasos(prev => prev.map((p, i) => ({
    ...p,
    estado: i < index  ? 'listo'    :
            i === index ? 'activo'   : 'pendiente'
  })))
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tramiteId || !areaId) { setError('Selecciona un trámite y área'); return }
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
        const err = await res.json()
        throw new Error(err.detail || 'Error al crear el ticket')
      }

      const ticket = await res.json()
      avanzarPaso(2)

      // Guardar respuestas
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

      // Todos listos
      setPasos(prev => prev.map(p => ({ ...p, estado: 'listo' as const })))
      await new Promise(r => setTimeout(r, 600))

      router.push(`/tickets/${ticket.id}`)

    } catch (err: any) {
      setCreando(false)
      setError(err.message || 'Error al crear el ticket')
      setLoading(false)
    }
  }

  const tieneSocios = tramiteSeleccionado?.requiere_partes?.some((p: any) => p.rol === 'socio')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#111' }}>
          Nueva solicitud
        </h1>
        <p className="text-[13px] mt-1" style={{ color: '#9C9890' }}>
          Completa los datos para crear el ticket
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <SeccionCanal canal={canal} onChange={setCanal} />

        <SeccionTramite
          tramites={tramites}
          areas={areas}
          tramiteId={tramiteId}
          areaId={areaId}
          onTramiteChange={onTramiteChange}
          onAreaChange={setAreaId}
        />

        <SeccionRiesgos riesgos={tramiteSeleccionado?.riesgos || []} />

        <SeccionPreguntas
          respuestas={respuestas}
          color={tramiteSeleccionado?.color_hex || '#F0B429'}
          onUpdate={updateRespuesta}
        />
        
        <SeccionPartes
          partes={partes}
          colorTramite={tramiteSeleccionado?.color_hex || '#666'}
          tieneSocios={!!tieneSocios}
          onUpdate={updateParte}
          onAgregar={agregarSocio}
          onQuitar={i => setPartes(prev => prev.filter((_, idx) => idx !== i))}
        />



        {error && (
          <div className="px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(226,75,74,0.08)', color: '#A32D2D', border: '1px solid rgba(226,75,74,0.2)' }}>
            {error}
          </div>
        )}

        {tramiteId && (
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all cursor-pointer border-none"
            style={{
              background: loading ? '#666' : '#111',
              boxShadow:  loading ? 'none' : '0 4px 20px rgba(0,0,0,0.2)',
            }}>
            {loading ? 'Creando ticket...' : 'Crear ticket →'}
          </button>
        )}
        {creando && <ModalCreandoTicket pasos={pasos} />}
      </form>
    </div>
  )
}