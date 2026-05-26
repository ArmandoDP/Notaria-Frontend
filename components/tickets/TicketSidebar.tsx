'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AIButton from '@/components/sections/notaria-ai/AIButton'

interface Props {
  ticket:          any
  estado:          string
  saving:          boolean
  tramites:        any[]
  areas:           any[]
  conversacionId:  string | null
  folioDBA:        string
  folioEscritura:  string
  folioDBAVinculado:       boolean
  folioEscrituraVinculado: boolean
  reasignando:     boolean
  nuevoTramiteId:  string
  nuevoAreaId:     string
  onFolioDBAChange:        (val: string) => void
  onFolioEscrituraChange:  (val: string) => void
  onGuardarFolioDBA:       () => void
  onGuardarFolioEscritura: () => void
  onCambiarEstadoFolioDBA:     () => void
  onCambiarEstadoEscritura:    () => void
  onSetReasignando:    (val: boolean) => void
  onNuevoTramiteId:    (val: string) => void
  onNuevoAreaId:       (val: string) => void
  onGuardarReasignacion: () => void
  onEnviarRecordatorio:  () => void
  onDescargarExpediente: () => void
  onCopiarLink:          () => void
}

export default function TicketSidebar({
  ticket, estado, saving, tramites, areas, conversacionId,
  folioDBA, folioEscritura, folioDBAVinculado, folioEscrituraVinculado,
  reasignando, nuevoTramiteId, nuevoAreaId,
  onFolioDBAChange, onFolioEscrituraChange,
  onGuardarFolioDBA, onGuardarFolioEscritura,
  onCambiarEstadoFolioDBA, onCambiarEstadoEscritura,
  onSetReasignando, onNuevoTramiteId, onNuevoAreaId,
  onGuardarReasignacion, onEnviarRecordatorio,
  onDescargarExpediente, onCopiarLink,
}: Props) {
  const tramite = ticket.tramites_config
  const area    = ticket.areas

  return (
    <div className="flex flex-col gap-3">

      {/* Notaría AI */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Asistente de IA
        </div>
        <AIButton href={`/notaria-ai?ticket=${ticket.id}`} label="Consultar con Notaría AI" />
        <div className="text-[10px] mt-2 text-center" style={{ color: '#9C9890' }}>
          Powered by Notaria AI GPT-4o
        </div>
      </div>

      {/* Folios */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Folios
        </div>

        {/* Folio DBA */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Folio DBA</label>
          {folioDBA && (
            <div className="text-[12px] font-mono font-bold mb-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#FEF3C7', color: '#854F0B' }}>
              {folioDBA}
            </div>
          )}
          <input type="text" value={folioDBA} onChange={e => onFolioDBAChange(e.target.value)}
            placeholder="DBA-2026-XXXX"
            className="w-full px-3 py-2 rounded-xl text-[13px] font-mono outline-none mb-2"
            style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
          <button type="button" onClick={onGuardarFolioDBA} disabled={!folioDBA.trim() || saving}
            className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none mb-2"
            style={{ background: folioDBA.trim() ? '#111' : '#F0F0F0', color: folioDBA.trim() ? '#fff' : '#CCC' }}>
            Vincular folio DBA
          </button>
          {folioDBAVinculado && estado !== 'folio_dba' && estado !== 'escritura_dba' && (
            <button type="button" onClick={onCambiarEstadoFolioDBA} disabled={saving}
              className="w-full py-2 rounded-xl text-[12px] font-bold cursor-pointer border-none"
              style={{ background: '#FEF3C7', color: '#854F0B', border: '1px solid #F0B429' }}>
              → Cambiar estado a Folio DBA
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px' }} />

        {/* Folio Escritura */}
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Folio Escritura</label>
          {folioEscritura && (
            <div className="text-[12px] font-mono font-bold mb-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#D1FAE5', color: '#0F6E56' }}>
              {folioEscritura}
            </div>
          )}
          <input type="text" value={folioEscritura} onChange={e => onFolioEscrituraChange(e.target.value)}
            placeholder="ESC-2026-XXXX"
            className="w-full px-3 py-2 rounded-xl text-[13px] font-mono outline-none mb-2"
            style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
          <button type="button" onClick={onGuardarFolioEscritura} disabled={!folioEscritura.trim() || saving}
            className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none mb-2"
            style={{ background: folioEscritura.trim() ? '#1B5FA5' : '#F0F0F0', color: folioEscritura.trim() ? '#fff' : '#CCC' }}>
            Vincular folio escritura
          </button>
          {folioEscrituraVinculado && estado !== 'escritura_dba' && (
            <button type="button" onClick={onCambiarEstadoEscritura} disabled={saving}
              className="w-full py-2 rounded-xl text-[12px] font-bold cursor-pointer border-none"
              style={{ background: '#D1FAE5', color: '#0F6E56', border: '1px solid #86EFAC' }}>
              → Cambiar estado a Escritura DBA
            </button>
          )}
        </div>
      </div>

      {/* Link de carga */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Link de carga
        </div>
        <button onClick={onCopiarLink}
          className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
          style={{ background: '#E6F1FB', color: '#185FA5' }}>
          📋 Copiar link de carga
        </button>
        <div className="text-[10px] mt-2 text-center" style={{ color: '#9C9890' }}>
          Comparte este link con el cliente
        </div>
      </div>

      {/* Reasignar */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9C9890' }}>
            Trámite y área
          </div>
          <button onClick={() => onSetReasignando(!reasignando)}
            className="text-[11px] cursor-pointer border-none bg-transparent font-medium"
            style={{ color: reasignando ? '#E24B4A' : '#1B5FA5' }}>
            {reasignando ? 'Cancelar' : 'Reasignar'}
          </button>
        </div>
        {reasignando ? (
          <div className="flex flex-col gap-2">
            <select value={nuevoTramiteId} onChange={e => onNuevoTramiteId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
              style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
              {tramites.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <select value={nuevoAreaId} onChange={e => onNuevoAreaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
              style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <button onClick={onGuardarReasignacion} disabled={saving}
              className="w-full py-2 rounded-xl text-[12px] font-bold cursor-pointer border-none"
              style={{ background: '#111', color: '#fff' }}>
              Guardar reasignación
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: tramite?.color_hex || '#666' }} />
              <span className="text-[12.5px] font-medium" style={{ color: '#111' }}>{tramite?.nombre || '—'}</span>
            </div>
            <div className="text-[11px]" style={{ color: '#9C9890' }}>{area?.nombre || '—'}</div>
          </div>
        )}
      </div>

      {/* Descargar expediente */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Expediente
        </div>
        <button onClick={onDescargarExpediente}
          className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
          style={{ background: '#111', color: '#fff' }}>
          📦 Descargar expediente ZIP
        </button>
        <div className="text-[10px] mt-2 text-center" style={{ color: '#9C9890' }}>
          Requiere todos los documentos obligatorios subidos
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          WhatsApp
        </div>
        <button type="button" onClick={onEnviarRecordatorio}
          className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
          style={{ background: '#EAF3DE', color: '#3B6D11' }}>
          Enviar recordatorio
        </button>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Información
        </div>
        <div className="flex flex-col gap-2.5 text-[12px]">
          {[
            { label: 'Canal',  value: ticket.canal },
            { label: 'Creado', value: format(new Date(ticket.created_at), "d MMM yyyy", { locale: es }) },
            { label: 'SLA',    value: format(new Date(ticket.sla_vence_at), "d MMM yyyy", { locale: es }) },
          ].map(r => (
            <div key={r.label} className="flex justify-between">
              <span style={{ color: '#9C9890' }}>{r.label}</span>
              <span className="font-medium" style={{ color: '#333' }}>{r.value}</span>
            </div>
          ))}
          {conversacionId && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <a href={`/chats?conv=${conversacionId}`}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold no-underline"
                style={{ background: '#E9F7EF', color: '#1A6B3C' }}>
                💬 Ver conversación WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}