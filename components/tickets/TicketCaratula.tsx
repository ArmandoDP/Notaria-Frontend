'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/client'
import TicketHeader   from './TicketHeader'
import TicketEstado   from './TicketEstado'
import TicketAlertas  from './TicketAlertas'
import TicketSidebar  from './TicketSidebar'
import TabDocs        from './tabs/TabDocs'
import TabPartes      from './tabs/TabPartes'
import TabHistorial   from './tabs/TabHistorial'
import TabPreguntas   from './TabPreguntas'
import TicketTabs from './TicketTabs'

export default function TicketCaratula({ ticket, tramites, areas, conversacionId }: {
  ticket:          any
  tramites:        any[]
  areas:           any[]
  conversacionId:  string | null
}) {
  const router   = useRouter()
  const supabase = createClient()

  const tramite = ticket.tramites_config
  const partes  = ticket.partes    || []
  const eventos = ticket.ticket_eventos || []

  const [documentos,  setDocumentos]  = useState(ticket.documentos || [])
  const [estado,      setEstado]      = useState(ticket.estado)
  const [saving,      setSaving]      = useState(false)
  const [activeTab,   setActiveTab]   = useState<'docs' | 'partes' | 'historial' | 'preguntas'>('docs')
  const [folioDBA,    setFolioDBA]    = useState(ticket.folio_dba     || '')
  const [folioEscritura, setFolioEscritura] = useState(ticket.folio_escritura || '')
  const [folioDBAVinculado,        setFolioDBAVinculado]        = useState(!!ticket.folio_dba)
  const [folioEscrituraVinculado,  setFolioEscrituraVinculado]  = useState(!!ticket.folio_escritura)
  const [reasignando,    setReasignando]    = useState(false)
  const [nuevoTramiteId, setNuevoTramiteId] = useState(ticket.tramite_id)
  const [nuevoAreaId,    setNuevoAreaId]    = useState(ticket.area_id)

  // Realtime docs
  useEffect(() => {
    const channel = supabase.channel(`docs-${ticket.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'documentos', filter: `ticket_id=eq.${ticket.id}` },
        payload => setDocumentos((prev: any[]) => prev.map((d: any) => d.id === payload.new.id ? { ...d, ...payload.new } : d))
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticket.id, supabase])

  async function cambiarEstado(nuevoEstado: string) {
    setSaving(true)
    await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: `Estado: ${estado} → ${nuevoEstado}` })
    setEstado(nuevoEstado)
    setSaving(false)
    router.refresh()
  }

  async function guardarFolioDBA() {
    if (!folioDBA.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ folio_dba: folioDBA }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'folio_dba', descripcion: `Folio DBA: ${folioDBA}` })
    setFolioDBAVinculado(true)
    setSaving(false)
  }

  async function guardarFolioEscritura() {
    if (!folioEscritura.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ folio_escritura: folioEscritura }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'folio_escritura', descripcion: `Folio escritura: ${folioEscritura}` })
    setFolioEscrituraVinculado(true)
    setSaving(false)
  }

  async function cambiarEstadoFolioDBA() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'folio_dba' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Estado: Folio DBA' })
    setEstado('folio_dba')
    setSaving(false)
    router.refresh()
  }

  async function cambiarEstadoEscritura() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'escritura_dba' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Estado: Escritura DBA' })
    setEstado('escritura_dba')
    setSaving(false)
    router.refresh()
  }

  async function guardarReasignacion() {
    setSaving(true)
    await supabase.from('tickets').update({ tramite_id: nuevoTramiteId, area_id: nuevoAreaId, estado: 'asignado' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'reasignacion', descripcion: 'Ticket reasignado' })
    setSaving(false)
    setReasignando(false)
    router.refresh()
  }

  async function subirDocumento(docId: string, docTipoId: string, parteId: string | null, archivo: File) {
    const formData = new FormData()
    formData.append('ticket_id',   ticket.id)
    formData.append('doc_tipo_id', docTipoId)
    formData.append('archivo',     archivo)
    if (parteId) formData.append('parte_id', parteId)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload`, { method: 'POST', body: formData })
    if (!res.ok) { alert('Error al subir el documento'); return }
    router.refresh()
  }

  async function validarDocumento(docId: string) {
    await supabase.from('documentos').update({ estado: 'validado', validado_at: new Date().toISOString() }).eq('id', docId)
    router.refresh()
  }

  async function enviarRecordatorio() {
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/twilio/recordatorio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: ticket.id }) })
    const data = await res.json()
    alert(res.ok ? `✅ Recordatorio enviado a ${data.telefono}` : `Error: ${data.detail}`)
  }

  async function descargarExpediente() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/descargar-expediente/${ticket.id}`)
    if (!res.ok) { const err = await res.json(); alert(`❌ ${err.detail}`); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${ticket.numero}.zip`; a.click()
    URL.revokeObjectURL(url)
  }

  const preguntasConfig     = tramite?.preguntas_clave || []
  const respuestasGuardadas = ticket.ticket_preguntas  || []
  const preguntasConResp    = preguntasConfig.map((p: string, i: number) => {
    const guardada = respuestasGuardadas.find((r: any) => r.orden === i)
    return { id: guardada?.id, pregunta: p, respuesta: guardada?.respuesta || '', orden: i }
  })

  const TABS = [
    { id: 'docs',      label: `Documentos (${documentos.length})` },
    { id: 'partes',    label: `Partes (${partes.length})`          },
    { id: 'preguntas', label: 'Preguntas'                          },
    { id: 'historial', label: `Historial (${eventos.length})`      },
  ] as const

  return (
    <div className="max-w-4xl mx-auto">

      <button onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-[12px] mb-4 cursor-pointer border-none bg-transparent"
        style={{ color: '#9C9890' }}>
        ← Volver al Kanban
      </button>

      <TicketHeader ticket={ticket} estado={estado} documentos={documentos} />

      <div className="grid grid-cols-3 gap-4">

        {/* Columna principal */}
        <div className="col-span-2 flex flex-col gap-4">

          <TicketEstado estado={estado} saving={saving} onChange={cambiarEstado} />

          <TicketAlertas
            documentos={documentos}
            ticket={ticket}
            apiUrl={process.env.NEXT_PUBLIC_API_URL || ''}
          />

          {/* Tabs */}
          <TicketTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            documentos={documentos}
            partes={partes}
            eventos={eventos}
            tramite={tramite}
            ticket={ticket}
            preguntas={preguntasConResp}
            onSubir={subirDocumento}
            onValidar={validarDocumento}
          />
        </div>

        {/* Sidebar */}
        <TicketSidebar
          ticket={ticket}
          estado={estado}
          saving={saving}
          tramites={tramites}
          areas={areas}
          conversacionId={conversacionId}
          folioDBA={folioDBA}
          folioEscritura={folioEscritura}
          folioDBAVinculado={folioDBAVinculado}
          folioEscrituraVinculado={folioEscrituraVinculado}
          reasignando={reasignando}
          nuevoTramiteId={nuevoTramiteId}
          nuevoAreaId={nuevoAreaId}
          onFolioDBAChange={setFolioDBA}
          onFolioEscrituraChange={setFolioEscritura}
          onGuardarFolioDBA={guardarFolioDBA}
          onGuardarFolioEscritura={guardarFolioEscritura}
          onCambiarEstadoFolioDBA={cambiarEstadoFolioDBA}
          onCambiarEstadoEscritura={cambiarEstadoEscritura}
          onSetReasignando={setReasignando}
          onNuevoTramiteId={setNuevoTramiteId}
          onNuevoAreaId={setNuevoAreaId}
          onGuardarReasignacion={guardarReasignacion}
          onEnviarRecordatorio={enviarRecordatorio}
          onDescargarExpediente={descargarExpediente}
          onCopiarLink={() => {
            navigator.clipboard.writeText(`${window.location.origin}/upload/${ticket.upload_token}`)
            alert('✅ Link copiado al portapapeles')
          }}
        />
      </div>
    </div>
  )
}