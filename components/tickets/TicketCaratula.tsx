'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TicketHeader      from './TicketHeader'
import TicketEstado      from './TicketEstado'
import TicketAlertas     from './TicketAlertas'
import TicketSidebar     from './TicketSidebar'
import TicketTabs        from './TicketTabs'
import ModalCopiarLink   from '@/components/ui/ModalCopiarLink'
import ModalValidandoDoc from './ModalValidandoDoc'
import t from './ticket.module.css'
import { Ic, Toast, useAviso } from './ticketUi'

const ESTADOS_LABEL: Record<string, string> = {
  nuevo:         'Nuevo',
  asignado:      'Asignado',
  folio_dba:     'Folio DBA',
  escritura_dba: 'Escritura DBA',
  completado:    'Completado',
  cancelado:     'Cancelado',
}

export default function TicketCaratula({ ticket, tramites, areas, conversacionId }: {
  ticket:         any
  tramites:       any[]
  areas:          any[]
  conversacionId: string | null
}) {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { aviso, mostrar } = useAviso()

  const tramite = ticket.tramites_config
  const partes  = ticket.partes || []
  const eventos = ticket.ticket_eventos || []

  const [documentos,  setDocumentos]  = useState(ticket.documentos || [])
  const [estado,      setEstado]      = useState(ticket.estado)
  const [saving,      setSaving]      = useState(false)
  const [activeTab,   setActiveTab]   = useState<'docs' | 'partes' | 'historial' | 'preguntas' | 'observaciones'>('docs')
  const [folioDBA,    setFolioDBA]    = useState(ticket.folio_dba || '')
  const [folioEscritura, setFolioEscritura] = useState(ticket.folio_escritura || '')
  const [folioDBAVinculado,       setFolioDBAVinculado]       = useState(!!ticket.folio_dba)
  const [folioEscrituraVinculado, setFolioEscrituraVinculado] = useState(!!ticket.folio_escritura)
  const [reasignando,    setReasignando]    = useState(false)
  const [nuevoTramiteId, setNuevoTramiteId] = useState(ticket.tramite_id)
  const [nuevoAreaId,    setNuevoAreaId]    = useState(ticket.area_id)
  const [nuevoCanal,     setNuevoCanal]     = useState(ticket.canal || 'front_desk')
  const [modalLink,      setModalLink]      = useState(false)
  const [modalLinkParte, setModalLinkParte] = useState<{ url: string; rolLabel: string } | null>(null)
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null)
  const [validandoDoc,   setValidandoDoc]   = useState<{ docId: string; nombreDoc: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return
      const { data } = await supabase.from('usuarios_sistema').select('id').eq('email', user.email || '').single()
      if (data) setUsuarioActualId(data.id)
    })
  }, [])

  // Documentos en tiempo real: nuevos (subida masiva), cambios (IA, clasificación) y eliminados
  useEffect(() => {
    const channel = supabase.channel(`docs-${ticket.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos', filter: `ticket_id=eq.${ticket.id}` },
        async (payload: any) => {
          if (payload.eventType === 'DELETE') {
            setDocumentos((prev: any[]) => prev.filter((d: any) => d.id !== payload.old.id))
            return
          }
          // Se vuelve a leer con su tipo de documento para tener nombre, parte y obligatorio
          const { data } = await supabase.from('documentos').select('*, doc_tipos_config(*)').eq('id', payload.new.id).single()
          const fila = data || payload.new
          setDocumentos((prev: any[]) => prev.some((d: any) => d.id === fila.id)
            ? prev.map((d: any) => (d.id === fila.id ? { ...d, ...fila } : d))
            : [...prev, fila])
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticket.id, supabase])

  async function notificarArea(titulo: string, descripcion: string, tipo: string) {
    const { data: usuarios } = await supabase.from('usuarios_sistema').select('id').eq('area_id', ticket.area_id).eq('activo', true)
    if (usuarios?.length) {
      await supabase.from('notificaciones').insert(usuarios.map((u: any) => ({
        usuario_id: u.id, tipo, titulo, descripcion, ticket_id: ticket.id,
      })))
    }
  }

  async function cambiarEstado(nuevoEstado: string) {
    setSaving(true)
    const { error } = await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', ticket.id)
    if (error) { mostrar(`No se pudo cambiar la etapa: ${error.message}`, true); setSaving(false); return }
    await supabase.from('ticket_eventos').insert({
      ticket_id: ticket.id, tipo: 'estado_cambio',
      descripcion: `Estado: ${estado} → ${nuevoEstado}`, usuario_id: usuarioActualId,
    })
    await notificarArea(
      `${ticket.numero} — ${ESTADOS_LABEL[nuevoEstado] || nuevoEstado}`,
      `Etapa actualizada de ${ESTADOS_LABEL[estado] || estado} a ${ESTADOS_LABEL[nuevoEstado] || nuevoEstado}`,
      'estado_cambio',
    )
    setEstado(nuevoEstado)
    setSaving(false)
    mostrar(`Etapa cambiada a ${ESTADOS_LABEL[nuevoEstado] || nuevoEstado}`)
    router.refresh()
  }

  async function guardarFolioDBA() {
    if (!folioDBA.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ folio_dba: folioDBA }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'folio_dba', descripcion: `Folio DBA: ${folioDBA}`, usuario_id: usuarioActualId })
    setFolioDBAVinculado(true)
    setSaving(false)
    mostrar('Folio DBA vinculado')
  }

  async function guardarFolioEscritura() {
    if (!folioEscritura.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ folio_escritura: folioEscritura }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'folio_escritura', descripcion: `Folio escritura: ${folioEscritura}`, usuario_id: usuarioActualId })
    setFolioEscrituraVinculado(true)
    setSaving(false)
    mostrar('Folio de escritura vinculado')
  }

  async function cancelarTicket() {
    setSaving(true)
    const { error } = await supabase.from('tickets').update({ estado: 'cancelado' }).eq('id', ticket.id)
    if (error) { mostrar(`No se pudo cancelar: ${error.message}`, true); setSaving(false); return }
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Expediente cancelado', usuario_id: usuarioActualId })
    setSaving(false)
    router.push('/')
  }

  async function reactivarTicket() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'asignado' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Expediente reactivado', usuario_id: usuarioActualId })
    setSaving(false)
    router.push('/')
  }

  async function cambiarEstadoFolioDBA() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'folio_dba' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Estado: Folio DBA', usuario_id: usuarioActualId })
    setEstado('folio_dba')
    setSaving(false)
    mostrar('Etapa cambiada a Folio DBA')
    router.refresh()
  }

  async function cambiarEstadoEscritura() {
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'escritura_dba' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Estado: Escritura DBA', usuario_id: usuarioActualId })
    setEstado('escritura_dba')
    setSaving(false)
    mostrar('Etapa cambiada a Escritura DBA')
    router.refresh()
  }

  async function guardarReasignacion() {
    setSaving(true)
    await supabase.from('tickets').update({ tramite_id: nuevoTramiteId, area_id: nuevoAreaId, estado: 'asignado', canal: nuevoCanal }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'reasignacion', descripcion: 'Ticket reasignado', usuario_id: usuarioActualId })
    setSaving(false)
    setReasignando(false)
    mostrar('Reasignación guardada')
    router.refresh()
  }

  async function subirDocumento(docId: string, docTipoId: string, parteId: string | null, archivo: File) {
    const formData = new FormData()
    formData.append('ticket_id',   ticket.id)
    formData.append('doc_tipo_id', docTipoId)
    formData.append('archivo',     archivo)
    if (parteId) formData.append('parte_id', parteId)

    const doc = documentos.find((d: any) => d.id === docId)
    const nombreDoc = doc?.doc_tipos_config?.nombre || 'Documento'

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload`, { method: 'POST', body: formData })
      if (!res.ok) { mostrar('No se pudo subir el documento', true); return }
      setValidandoDoc({ docId, nombreDoc })
    } catch {
      mostrar('No hay conexión con el servidor', true)
    }
  }

  async function validarDocumento(docId: string) {
    await supabase.from('documentos').update({ estado: 'validado', validado_at: new Date().toISOString() }).eq('id', docId)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'validacion_documento', descripcion: 'Documento validado', usuario_id: usuarioActualId })
    mostrar('Documento validado')
    router.refresh()
  }

  async function enviarRecordatorio() {
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/twilio/recordatorio`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: ticket.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) mostrar(`Recordatorio enviado a ${data.telefono || 'el cliente'}`)
      else mostrar(data.detail || 'No se pudo enviar el recordatorio', true)
    } catch {
      mostrar('No hay conexión con el servidor', true)
    }
  }

  async function copiarLink() {
    const url = `${window.location.origin}/upload/${ticket.upload_token}?tipo=operacion`
    await navigator.clipboard.writeText(url)
    await notificarArea(`Link enviado — ${ticket.numero}`, 'Link de documentos de operación enviado al cliente', 'link_carga')
    setModalLink(false)
    mostrar('Link copiado')
  }

  async function copiarLinkParte(url: string, rolLabel: string) {
    await navigator.clipboard.writeText(url)
    await notificarArea(`Link enviado — ${ticket.numero}`, `Link de carga del ${rolLabel} enviado al cliente`, 'link_carga')
    setModalLinkParte(null)
    mostrar(`Link del ${rolLabel} copiado`)
  }

  async function completarTicket(comentario: string) {
    setSaving(true)
    if (usuarioActualId) {
      await supabase.from('observaciones').insert({ ticket_id: ticket.id, usuario_id: usuarioActualId, contenido: comentario, estatus: 'ok' })
    }
    await supabase.from('tickets').update({ estado: 'completado' }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({ ticket_id: ticket.id, tipo: 'estado_cambio', descripcion: 'Expediente marcado como completado', usuario_id: usuarioActualId })
    setEstado('completado')
    setSaving(false)
    router.push('/')
  }

  const preguntasConfig     = tramite?.preguntas_clave || []
  const respuestasGuardadas = ticket.ticket_preguntas || []
  const preguntasConResp    = preguntasConfig.map((p: string, i: number) => {
    const guardada = respuestasGuardadas.find((r: any) => r.orden === i)
    return { id: guardada?.id, pregunta: p, respuesta: guardada?.respuesta || '', orden: i }
  })

  return (
    <div className={t.page}>
      <button type="button" className={t.back} onClick={() => router.push('/')}>
        <Ic n="back" size={16} /> Tablero de solicitudes
      </button>

      <TicketHeader ticket={ticket} estado={estado} documentos={documentos} />

      <div className={t.layout}>
        <div className={t.main}>
          <div className={`${t.rise} ${t.d1}`}>
            <TicketEstado estado={estado} saving={saving} onChange={cambiarEstado} />
          </div>

          <div className={`${t.rise} ${t.d2}`}>
            <TicketAlertas
              documentos={documentos}
              ticket={ticket}
              apiUrl={process.env.NEXT_PUBLIC_API_URL || ''}
              conversacionId={conversacionId}
              onAviso={mostrar}
            />
          </div>

          <div className={`${t.rise} ${t.d3}`}>
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
        </div>

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
          nuevoCanal={nuevoCanal}
          onFolioDBAChange={setFolioDBA}
          onFolioEscrituraChange={setFolioEscritura}
          onGuardarFolioDBA={guardarFolioDBA}
          onGuardarFolioEscritura={guardarFolioEscritura}
          onCambiarEstadoFolioDBA={cambiarEstadoFolioDBA}
          onCambiarEstadoEscritura={cambiarEstadoEscritura}
          onSetReasignando={setReasignando}
          onNuevoTramiteId={setNuevoTramiteId}
          onNuevoAreaId={setNuevoAreaId}
          onNuevoCanal={setNuevoCanal}
          onGuardarReasignacion={guardarReasignacion}
          onEnviarRecordatorio={enviarRecordatorio}
          onDescargarExpediente={() => {}}
          onCopiarLink={() => setModalLink(true)}
          onCopiarLinkParte={(url, rolLabel) => setModalLinkParte({ url, rolLabel })}
          onCancelar={cancelarTicket}
          onReactivar={reactivarTicket}
          onCompletar={completarTicket}
          onAviso={mostrar}
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

      {validandoDoc && (
        <ModalValidandoDoc
          docId={validandoDoc.docId}
          nombreDoc={validandoDoc.nombreDoc}
          onClose={() => { setValidandoDoc(null); router.refresh() }}
        />
      )}

      <Toast aviso={aviso} />
    </div>
  )
}