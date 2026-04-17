'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, isPast, format } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADOS = [
  { id: 'nuevo',      label: 'Nuevo',      color: '#534AB7' },
  { id: 'en_proceso', label: 'En proceso', color: '#185FA5' },
  { id: 'pend_docs',  label: 'Pend. docs', color: '#854F0B' },
  { id: 'firma',      label: 'Firma',      color: '#0F6E56' },
  { id: 'completo',   label: 'Completo',   color: '#3B6D11' },
  { id: 'demorado',   label: 'Demorado',   color: '#A32D2D' },
  { id: 'entregado',  label: 'Entregado',  color: '#166534' },
]

export default function TicketCaratula({ ticket }: { ticket: any }) {
  const router   = useRouter()
  const supabase = createClient()

  const tramite   = ticket.tramites_config
  const area      = ticket.areas
  const partes    = ticket.partes    || []
  const documentos = ticket.documentos || []
  const eventos   = ticket.ticket_eventos || []

  const [estado,      setEstado]      = useState(ticket.estado)
  const [folioDBA,    setFolioDBA]    = useState(ticket.folio_dba || '')
  const [notaDemora,  setNotaDemora]  = useState(ticket.nota_demora || '')
  const [modalDemora, setModalDemora] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [activeTab,   setActiveTab]   = useState<'docs' | 'partes' | 'historial'>('docs')

  const vencido = isPast(new Date(ticket.sla_vence_at))
  const estadoActual = ESTADOS.find(e => e.id === estado)

  // Progreso documentos
  const docsObligatorios = documentos.filter((d: any) => d.doc_tipos_config?.obligatorio)
  const docsValidados    = docsObligatorios.filter((d: any) => d.estado === 'validado')
  const progreso         = docsObligatorios.length > 0
    ? Math.round((docsValidados.length / docsObligatorios.length) * 100)
    : 0

  async function cambiarEstado(nuevoEstado: string) {
    if (nuevoEstado === 'demorado') {
      setModalDemora(true)
      return
    }
    setSaving(true)
    await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({
      ticket_id:   ticket.id,
      tipo:        'estado_cambio',
      descripcion: `Estado actualizado: ${estado} → ${nuevoEstado}`,
    })
    setEstado(nuevoEstado)
    setSaving(false)
  }

  async function guardarDemora() {
    if (!notaDemora.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ estado: 'demorado', nota_demora: notaDemora }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({
      ticket_id:   ticket.id,
      tipo:        'estado_cambio',
      descripcion: `Ticket marcado como demorado — ${notaDemora}`,
    })
    setEstado('demorado')
    setModalDemora(false)
    setSaving(false)
  }

  async function guardarFolioDBA() {
    if (!folioDBA.trim()) return
    setSaving(true)
    await supabase.from('tickets').update({ folio_dba: folioDBA }).eq('id', ticket.id)
    await supabase.from('ticket_eventos').insert({
      ticket_id:   ticket.id,
      tipo:        'folio_dba',
      descripcion: `Folio DBA vinculado: ${folioDBA}`,
    })
    setSaving(false)
  }
  
    async function subirDocumento(docId: string, docTipoId: string, parteId: string | null, archivo: File) {
        const formData = new FormData()
        formData.append('ticket_id',   ticket.id)
        formData.append('doc_tipo_id', docTipoId)
        formData.append('archivo',     archivo)
        if (parteId) formData.append('parte_id', parteId)

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/upload`, {
            method: 'POST',
            body:   formData,
        })

        if (!res.ok) {
            alert('Error al subir el documento')
            return
        }

  router.refresh()
}

  async function validarDocumento(docId: string) {
    await supabase.from('documentos').update({
      estado:      'validado',
      validado_at: new Date().toISOString(),
    }).eq('id', docId)
    router.refresh()
  }

  async function enviarRecordatorio() {
    alert('WA recordatorio enviado (requiere backend Twilio activo)')
  }

  const docEstadoColor: Record<string, { bg: string, color: string, label: string }> = {
    pendiente:     { bg: '#F3F4F6', color: '#6B7280', label: 'Pendiente'   },
    recibido:      { bg: '#FAEEDA', color: '#854F0B', label: 'Recibido'    },
    ocr_procesado: { bg: '#E6F1FB', color: '#185FA5', label: 'OCR listo'   },
    validado:      { bg: '#EAF3DE', color: '#3B6D11', label: 'Validado'    },
    rechazado:     { bg: '#FCEBEB', color: '#A32D2D', label: 'Rechazado'   },
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Back */}
      <button onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-[12px] mb-4 cursor-pointer border-none bg-transparent transition-all"
        style={{ color: '#9C9890' }}>
        ← Volver al Kanban
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: tramite?.color_hex || '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              {ticket.numero}
            </div>
            <h1 className="text-[20px] font-bold text-white leading-tight tracking-tight">
              {tramite?.nombre}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {area?.nombre}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span className="text-[12px]" style={{ color: vencido ? '#FCA5A5' : 'rgba(255,255,255,0.6)' }}>
                {vencido ? '⚠ Vencido ' : 'Vence '}
                {formatDistanceToNow(new Date(ticket.sla_vence_at), { locale: es, addSuffix: true })}
              </span>
              {ticket.folio_dba && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span className="text-[12px] font-mono font-bold" style={{ color: '#F0C040' }}>
                    {ticket.folio_dba}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Estado badge */}
          <div className="flex-shrink-0">
            <span className="px-3 py-1.5 rounded-xl text-[12px] font-bold"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}>
              {estadoActual?.label || estado}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        {docsObligatorios.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1.5"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span>Documentos validados</span>
              <span className="font-bold text-white">{progreso}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progreso}%`, background: progreso === 100 ? '#86EFAC' : 'rgba(255,255,255,0.8)' }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Columna principal */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Cambiar estado */}
          <div className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
              Estado del ticket
            </div>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map(e => (
                <button key={e.id} type="button"
                  onClick={() => cambiarEstado(e.id)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border-none"
                  style={{
                    background: estado === e.id ? e.color : `${e.color}14`,
                    color:      estado === e.id ? '#fff' : e.color,
                    boxShadow:  estado === e.id ? `0 3px 10px ${e.color}40` : 'none',
                  }}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Tab headers */}
            <div className="flex border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              {([
                { id: 'docs',      label: `Documentos (${documentos.length})` },
                { id: 'partes',    label: `Partes (${partes.length})` },
                { id: 'historial', label: `Historial (${eventos.length})` },
              ] as const).map(tab => (
                <button key={tab.id} type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="px-5 py-3 text-[12.5px] font-semibold transition-all cursor-pointer border-none bg-transparent border-b-2"
                  style={{
                    color:       activeTab === tab.id ? '#111' : '#9C9890',
                    borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">

              {/* Documentos */}
              {activeTab === 'docs' && (
                <div className="flex flex-col gap-2">
                  {documentos.length === 0 && (
                    <p className="text-[13px] text-center py-4" style={{ color: '#CCC' }}>
                      Sin documentos configurados
                    </p>
                  )}
                  {documentos.map((doc: any) => {
                    const est = docEstadoColor[doc.estado] || docEstadoColor.pendiente
                    return (
                      <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-semibold" style={{ color: '#111' }}>
                            {doc.doc_tipos_config?.nombre}
                          </div>
                          {doc.alerta_ia && (
                            <div className="text-[11px] mt-0.5" style={{ color: '#A32D2D' }}>
                              ⚠ {doc.alerta_ia}
                            </div>
                          )}
                          {doc.datos_ocr && Object.keys(doc.datos_ocr).length > 0 && (
                            <div className="text-[10px] mt-0.5" style={{ color: '#9C9890' }}>
                              OCR: {Object.entries(doc.datos_ocr).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            style={{ background: est.bg, color: est.color }}>
                            {est.label}
                        </span>

                        {/* Botón subir archivo */}
                        {doc.estado === 'pendiente' || doc.estado === 'recibido' ? (
                            <label className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
                            style={{ background: '#E6F1FB', color: '#185FA5' }}>
                            Subir
                            <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                onChange={e => {
                                const archivo = e.target.files?.[0]
                                if (archivo) subirDocumento(doc.id, doc.doc_tipo_id, doc.parte_id, archivo)
                                }}
                            />
                            </label>
                        ) : null}

                        {/* Botón validar */}
                        {doc.estado === 'ocr_procesado' || doc.estado === 'recibido' ? (
                            <button type="button"
                            onClick={() => validarDocumento(doc.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-all"
                            style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                            Validar
                            </button>
                        ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Partes */}
              {activeTab === 'partes' && (
                <div className="flex flex-col gap-3">
                  {partes.map((parte: any, i: number) => (
                    <div key={parte.id} className="p-4 rounded-xl"
                      style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                          style={{ background: tramite?.color_hex || '#666' }}>
                          {i + 1}
                        </div>
                        <span className="text-[12px] font-bold capitalize" style={{ color: '#666' }}>
                          {parte.rol}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[12px]">
                        {parte.nombre_completo && <div><span style={{ color: '#9C9890' }}>Nombre</span><div className="font-medium" style={{ color: '#111' }}>{parte.nombre_completo}</div></div>}
                        {parte.curp && <div><span style={{ color: '#9C9890' }}>CURP</span><div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.curp}</div></div>}
                        {parte.rfc && <div><span style={{ color: '#9C9890' }}>RFC</span><div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.rfc}</div></div>}
                        {parte.telefono && <div><span style={{ color: '#9C9890' }}>Teléfono</span><div style={{ color: '#111' }}>{parte.telefono}</div></div>}
                        {parte.email && <div><span style={{ color: '#9C9890' }}>Correo</span><div style={{ color: '#111' }}>{parte.email}</div></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Historial */}
              {activeTab === 'historial' && (
                <div className="flex flex-col gap-2">
                  {eventos
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((ev: any) => (
                    <div key={ev.id} className="flex gap-3 items-start p-3 rounded-xl"
                      style={{ background: '#F7F7F5' }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: ev.tipo === 'wa_enviado' ? '#0F6E56' : ev.tipo === 'folio_dba' ? '#B8820A' : '#534AB7' }} />
                      <div className="flex-1">
                        <div className="text-[12.5px]" style={{ color: '#333' }}>{ev.descripcion}</div>
                        <div className="text-[10.5px] mt-0.5" style={{ color: '#9C9890' }}>
                          {format(new Date(ev.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar derecho */}
        <div className="flex flex-col gap-4">

          {/* Folio DBA */}
          <div className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
              Folio DBA
            </div>
            <input
              type="text"
              value={folioDBA}
              onChange={e => setFolioDBA(e.target.value)}
              placeholder="DBA-2026-XXXX"
              className="w-full px-3 py-2 rounded-xl text-[13px] font-mono outline-none mb-2"
              style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
            />
            <button type="button" onClick={guardarFolioDBA}
              disabled={!folioDBA.trim() || saving}
              className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none transition-all"
              style={{ background: folioDBA.trim() ? '#111' : '#F0F0F0', color: folioDBA.trim() ? '#fff' : '#CCC' }}>
              Vincular folio
            </button>
          </div>

          {/* Recordatorio WA */}
          <div className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
              WhatsApp
            </div>
            <button type="button" onClick={enviarRecordatorio}
              className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none transition-all"
              style={{ background: '#EAF3DE', color: '#3B6D11' }}>
              Enviar recordatorio
            </button>
          </div>

          {/* Info del ticket */}
          <div className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
              Información
            </div>
            <div className="flex flex-col gap-2.5 text-[12px]">
              {[
                { label: 'Canal',   value: ticket.canal },
                { label: 'Creado',  value: format(new Date(ticket.created_at), "d MMM yyyy", { locale: es }) },
                { label: 'SLA',     value: format(new Date(ticket.sla_vence_at), "d MMM yyyy", { locale: es }) },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span style={{ color: '#9C9890' }}>{r.label}</span>
                  <span className="font-medium" style={{ color: '#333' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal demorado */}
      {modalDemora && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: '#111' }}>Marcar como demorado</h3>
            <p className="text-[12.5px] mb-4" style={{ color: '#9C9890' }}>
              La nota es obligatoria — explica el motivo del retraso.
            </p>
            <textarea
              value={notaDemora}
              onChange={e => setNotaDemora(e.target.value)}
              placeholder="Motivo del retraso..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none mb-4"
              style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setModalDemora(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F0F0F0', color: '#666' }}>
                Cancelar
              </button>
              <button type="button" onClick={guardarDemora}
                disabled={!notaDemora.trim() || saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: notaDemora.trim() ? '#E24B4A' : '#F0F0F0', color: notaDemora.trim() ? '#fff' : '#CCC' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}