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
// import TabPreguntas   from './TabPreguntas'
import TicketTabs from './TicketTabs'
import ModalCopiarLink from '@/components/ui/ModalCopiarLink'

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
  const [activeTab,   setActiveTab]   = useState<'docs' | 'partes' | 'historial' | 'preguntas' | 'observaciones'>('docs')
  const [folioDBA,    setFolioDBA]    = useState(ticket.folio_dba     || '')
  const [folioEscritura, setFolioEscritura] = useState(ticket.folio_escritura || '')
  const [folioDBAVinculado,        setFolioDBAVinculado]        = useState(!!ticket.folio_dba)
  const [folioEscrituraVinculado,  setFolioEscrituraVinculado]  = useState(!!ticket.folio_escritura)
  const [reasignando,    setReasignando]    = useState(false)
  const [nuevoTramiteId, setNuevoTramiteId] = useState(ticket.tramite_id)
  const [nuevoAreaId, setNuevoAreaId] = useState(ticket.area_id)
  const [modalLink, setModalLink] = useState(false)
  const [modalLinkParte, setModalLinkParte] = useState<{ url: string, rolLabel: string } | null>(null)
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('usuarios_sistema')
        .select('id')
        .eq('email', user.email || '')
        .single()
      if (data) setUsuarioActualId(data.id)
    })
  }, [])
  
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
    await supabase.from('ticket_eventos').insert({
      ticket_id:   ticket.id,
      tipo:        'estado_cambio',
      descripcion: `Estado: ${estado} → ${nuevoEstado}`,
      usuario_id:  usuarioActualId,
    })

    // Notificar al área
    const { data: usuarios } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('area_id', ticket.area_id)
      .eq('activo', true)

    if (usuarios && usuarios.length > 0) {
      const ESTADOS_LABEL: Record<string, string> = {
        nuevo:         'Nuevo',
        asignado:      'Asignado',
        folio_dba:     'Folio DBA',
        escritura_dba: 'Escritura DBA',
      }
      await supabase.from('notificaciones').insert(
        usuarios.map(u => ({
          usuario_id:  u.id,
          tipo:        'estado_cambio',
          titulo:      `🔄 ${ticket.numero} — ${ESTADOS_LABEL[nuevoEstado] || nuevoEstado}`,
          descripcion: `Estado actualizado de ${ESTADOS_LABEL[estado] || estado} a ${ESTADOS_LABEL[nuevoEstado] || nuevoEstado}`,
          ticket_id:   ticket.id,
        }))
      )
    }

    setEstado(nuevoEstado)
    setSaving(false)
    router.refresh()
  }

  async function guardarFolioDBA() {
    if (!folioDBA.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ folio_dba: folioDBA }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'folio_dba', descripcion: `Folio DBA: ${folioDBA}`, usuario_id:  usuarioActualId })
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

  async function cancelarTicket() {
    setSaving(true)
    const { error } = await supabase
      .from('tickets')
      .update({ estado: 'cancelado' })
      .eq('id', ticket.id)
    
    console.log('>>> cancelar result:', error)
    
    if (error) {
      alert(`Error: ${error.message}`)
      setSaving(false)
      return
    }
    
    await supabase.from('ticket_eventos').insert({
      ticket_id:   ticket.id,
      tipo:        'estado_cambio',
      descripcion: 'Expediente cancelado',
      usuario_id:  usuarioActualId,
    })
    setSaving(false)
    router.push('/')
  }
  
  async function reactivarTicket() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'asignado' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({
      ticket_id:   ticket.id,
      tipo:        'estado_cambio',
      descripcion: 'Expediente reactivado',
      usuario_id:  usuarioActualId,
    })
    setSaving(false)
    router.push('/')  // ← regresa al Kanban
  }
  async function cambiarEstadoFolioDBA() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'folio_dba' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Estado: Folio DBA', usuario_id:  usuarioActualId })
    setEstado('folio_dba')
    setSaving(false)
    router.refresh()
  }

  async function cambiarEstadoEscritura() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'escritura_dba' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Estado: Escritura DBA', usuario_id:  usuarioActualId })
    setEstado('escritura_dba')
    setSaving(false)
    router.refresh()
  }

  async function guardarReasignacion() {
    setSaving(true)
    await supabase.from('tickets').update({ tramite_id: nuevoTramiteId, area_id: nuevoAreaId, estado: 'asignado' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'reasignacion', descripcion: 'Ticket reasignado', usuario_id:  usuarioActualId })
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
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'validacion_documento', descripcion: 'Documento validado', usuario_id:  usuarioActualId })
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

  async function copiarLink() {
    const url = `${window.location.origin}/upload/${ticket.upload_token}?tipo=operacion`
    navigator.clipboard.writeText(url)

    const { data: usuarios } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('area_id', ticket.area_id)
      .eq('activo', true)

    if (usuarios && usuarios.length > 0) {
      await supabase.from('notificaciones').insert(
        usuarios.map(u => ({
          usuario_id:  u.id,
          tipo:        'link_carga',
          titulo:      `🔗 Link enviado — ${ticket.numero}`,
          descripcion: 'Link de documentos de operación enviado al cliente',
          ticket_id:   ticket.id,
        }))
      )
    }
    setModalLink(false)
  }
  
  async function copiarLinkParte(url: string, rolLabel: string) {
    navigator.clipboard.writeText(url)
    
    const { data: usuarios } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('area_id', ticket.area_id)
      .eq('activo', true)

    if (usuarios && usuarios.length > 0) {
      await supabase.from('notificaciones').insert(
        usuarios.map(u => ({
          usuario_id:  u.id,
          tipo:        'link_carga',
          titulo:      `🔗 Link enviado — ${ticket.numero}`,
          descripcion: `Link de carga del ${rolLabel} enviado al cliente`,
          ticket_id:   ticket.id,
        }))
      )
    }
    setModalLinkParte(null)
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
          onCopiarLink={() => setModalLink(true)}
          onCopiarLinkParte={(url, rolLabel) => setModalLinkParte({ url, rolLabel })}
          onCancelar={cancelarTicket}
          onReactivar={reactivarTicket}
        />
      </div>

      {modalLink && (
      <ModalCopiarLink
        ticket={ticket}
        rolLabel="Documentos de la operación"
        onConfirmar={copiarLink}
        onCancelar={() => setModalLink(false)}
      />
    )}

    {modalLinkParte && (
      <ModalCopiarLink
        ticket={ticket}
        rolLabel={modalLinkParte.rolLabel}
        onConfirmar={() => copiarLinkParte(modalLinkParte.url, modalLinkParte.rolLabel)}
        onCancelar={() => setModalLinkParte(null)}
      />
    )}
    </div>
  )
}