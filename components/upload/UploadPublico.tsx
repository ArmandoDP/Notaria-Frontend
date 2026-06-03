'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import UploadHeader    from './UploadHeader'
import UploadStepper   from './UploadStepper'
import UploadStepDatos from './UploadStepDatos'
import UploadStepDocs  from './UploadStepDocs'
import UploadCompleto  from './UploadCompleto'

interface Props {
  ticket:         any
  token:          string
  soloOperacion?: boolean
}

export default function UploadPublico({ ticket, token, soloOperacion = false }: Props) {
  const supabase    = createClient()
  const tramite     = ticket.tramites_config
  const color       = tramite?.color_hex || '#111'
  const partesConf: any[] = tramite?.requiere_partes || []
  const partesBD    = ticket.partes || []

  const [documentos, setDocumentos] = useState(ticket.documentos || [])
  const [subiendo,   setSubiendo]   = useState<string | null>(null)
  const [subidos,    setSubidos]    = useState<Record<string, boolean>>({})
  const [errores,    setErrores]    = useState<Record<string, string>>({})
  const [pasoActual, setPasoActual] = useState(0)
  const [completo,   setCompleto]   = useState(false)

  // Docs de operación siempre
  const docsOperacion = documentos.filter((d: any) =>
    !d.doc_tipos_config?.para_rol ||
    d.doc_tipos_config?.para_rol === 'operacion' ||
    d.doc_tipos_config?.para_rol === 'inmueble'
  )

  // Partes con docs — solo si NO es modo soloOperacion
  const partesConDocs = soloOperacion ? [] : partesConf.filter((pc: any) =>
    documentos.some((d: any) => d.doc_tipos_config?.para_rol === pc.rol)
  )

  // Generar lista de pasos
  const pasos: {
    tipo: 'datos' | 'docs' | 'operacion'
    parteConfig?: any
    parteReal?: any
    docs?: any[]
    label: string
    sublabel: string
  }[] = []

  // Pasos de partes solo si no es soloOperacion
  if (!soloOperacion) {
    partesConDocs.forEach((pc: any) => {
      const parteReal = partesBD.find((p: any) => p.rol === pc.rol)
      const docs = documentos.filter((d: any) => d.doc_tipos_config?.para_rol === pc.rol)
      const rolLabel = pc.rol.replace(/_/g, ' ')
      pasos.push({ tipo: 'datos', parteConfig: pc, parteReal, label: rolLabel, sublabel: 'Tus datos' })
      pasos.push({ tipo: 'docs',  parteConfig: pc, parteReal, docs, label: rolLabel, sublabel: 'Documentos' })
    })
  }

  // Paso de operación solo si hay docs de operación
  if (docsOperacion.length > 0) {
    pasos.push({ tipo: 'operacion', docs: docsOperacion, label: 'Operación', sublabel: 'Documentos' })
  }

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`upload-docs-${ticket.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'documentos',
        filter: `ticket_id=eq.${ticket.id}`,
      }, payload => setDocumentos((prev: any[]) =>
        prev.map((d: any) => d.id === payload.new.id ? { ...d, ...payload.new } : d)
      )).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticket.id])

  async function guardarDatosParte(parteConfig: any, datos: any) {
    const parteExistente = partesBD.find((p: any) => p.rol === parteConfig.rol)
    if (parteExistente?.id) {
      await supabase.from('partes').update({
        nombre_completo: datos.nombre_completo,
        curp:            datos.curp,
        rfc:             datos.rfc,
        telefono:        datos.telefono,
        email:           datos.email,
      }).eq('id', parteExistente.id)
    }
    avanzarPaso()
  }

  async function subirArchivo(docId: string, docTipoId: string, archivo: File) {
    setSubiendo(docId)
    setErrores(prev => ({ ...prev, [docId]: '' }))
    try {
      const formData = new FormData()
      formData.append('ticket_id',    ticket.id)
      formData.append('doc_tipo_id',  docTipoId)
      formData.append('archivo',      archivo)
      formData.append('upload_token', token)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload-publico`, {
        method: 'POST', body: formData,
      })
      if (!res.ok) throw new Error('Error al subir')
      setSubidos(prev => ({ ...prev, [docId]: true }))
    } catch {
      setErrores(prev => ({ ...prev, [docId]: 'Error al subir. Intenta de nuevo.' }))
    } finally {
      setSubiendo(null)
    }
  }

  function avanzarPaso() {
    if (pasoActual >= pasos.length - 1) {
      setCompleto(true)
    } else {
      setPasoActual(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const paso = pasos[pasoActual]

  if (pasos.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, sans-serif' }}>
        <UploadHeader color={color} tramite={tramite} ticket={ticket} />
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9890' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
          <div>Sin documentos configurados para este trámite</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, sans-serif' }}>
      <UploadHeader color={color} tramite={tramite} ticket={ticket} />

      {!completo && (
        <UploadStepper
          pasos={pasos.map(p => ({ label: p.label, sublabel: p.sublabel, tipo: p.tipo as any }))}
          pasoActual={pasoActual}
          color={color}
        />
      )}

      {completo ? (
        <UploadCompleto color={color} ticket={ticket} />
      ) : paso?.tipo === 'datos' ? (
        <UploadStepDatos
          parteConfig={paso.parteConfig}
          parteReal={paso.parteReal}
          color={color}
          onContinuar={datos => guardarDatosParte(paso.parteConfig, datos)}
        />
      ) : (
        <UploadStepDocs
          parteConfig={paso.parteConfig || { rol: 'operacion', color }}
          docs={paso.docs || []}
          color={color}
          subiendo={subiendo}
          subidos={subidos}
          errores={errores}
          onSubir={subirArchivo}
          onContinuar={avanzarPaso}
          esUltimoPaso={pasoActual >= pasos.length - 1}
        />
      )}
    </div>
  )
}