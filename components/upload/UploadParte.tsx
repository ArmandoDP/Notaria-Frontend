'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import UploadHeader    from './UploadHeader'
import UploadStepDatos from './UploadStepDatos'
import UploadStepDocs  from './UploadStepDocs'
import UploadCompleto  from './UploadCompleto'

interface Props {
  parte:      any
  ticket:     any
  documentos: any[]
  token:      string
}

export default function UploadParte({ parte, ticket, documentos: docsIniciales, token }: Props) {
  const supabase  = createClient()
  const tramite   = ticket.tramites_config
  const color     = tramite?.color_hex || '#111'
  const parteConf = tramite?.requiere_partes?.find((p: any) => p.rol === parte.rol) || { rol: parte.rol }
  
  // Docs de esta parte
  const docsDeEstaParte = docsIniciales.filter((d: any) =>
    d.parte_id === parte.id ||
    d.doc_tipos_config?.para_rol === parte.rol
  )

  const [documentos, setDocumentos] = useState(docsIniciales || [])
  const [subiendo,   setSubiendo]   = useState<string | null>(null)
  const [subidos,    setSubidos]    = useState<Record<string, boolean>>({})
  const [errores,    setErrores]    = useState<Record<string, string>>({})
  const [paso, setPaso] = useState<'datos' | 'docs'>('datos')

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`upload-parte-${parte.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'documentos', filter: `ticket_id=eq.${ticket.id}` },
        payload => setDocumentos(prev => prev.map((d: any) => d.id === payload.new.id ? { ...d, ...payload.new } : d))
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [parte.id, ticket.id])

  async function guardarDatos(datos: any) {
    await supabase.from('partes').update({
      nombre_completo: datos.nombre_completo,
      curp:            datos.curp,
      rfc:             datos.rfc,
      telefono:        datos.telefono,
      email:           datos.email,
    }).eq('id', parte.id)
    setPaso('docs')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      formData.append('parte_id',     parte.id)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload-parte`, {
        method: 'POST',
        body:   formData,
      })
      if (!res.ok) throw new Error('Error al subir')
      setSubidos(prev => ({ ...prev, [docId]: true }))
    } catch {
      setErrores(prev => ({ ...prev, [docId]: 'Error al subir. Intenta de nuevo.' }))
    } finally {
      setSubiendo(null)
    }
  }

  // Stepper simple — datos → docs
  const stepperPasos = [
    { label: parte.rol.replace(/_/g, ' '), sublabel: 'Tus datos',    tipo: 'datos' as const },
    { label: parte.rol.replace(/_/g, ' '), sublabel: 'Documentos',   tipo: 'docs'  as const },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, sans-serif' }}>
      <UploadHeader color={color} tramite={tramite} ticket={ticket} />

      {paso !== 'completo' && (
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px 20px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ height: '4px', background: '#F3F4F6', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px', background: color,
                width: paso === 'datos' ? '50%' : '100%',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {paso === 'datos' && (
        <UploadStepDatos
          parteConfig={parteConf}
          parteReal={parte}
          color={color}
          onContinuar={guardarDatos}
        />
      )}

      {paso === 'docs' && (
        <UploadStepDocs
          parteConfig={parteConf}
          docs={documentos}
          color={color}
          subiendo={subiendo}
          subidos={subidos}
          errores={errores}
          onSubir={subirArchivo}
          onContinuar={() => setPaso('datos')}  // ← regresa a datos en lugar de ir a completo
          esUltimoPaso={true}
        />
      )}
    </div>
  )
}