'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AIButton from '@/components/sections/notaria-ai/AIButton'
// import { useUsuario } from '@/hooks/useUsuario'

interface Props {
  ticket:                  any
  estado:                  string
  saving:                  boolean
  tramites:                any[]
  areas:                   any[]
  conversacionId:          string | null
  folioDBA:                string
  folioEscritura:          string
  folioDBAVinculado:       boolean
  folioEscrituraVinculado: boolean
  reasignando:             boolean
  nuevoTramiteId:          string
  nuevoAreaId:             string
  onFolioDBAChange:        (val: string) => void
  onFolioEscrituraChange:  (val: string) => void
  onGuardarFolioDBA:       () => void
  onGuardarFolioEscritura: () => void
  onCambiarEstadoFolioDBA:  () => void
  onCambiarEstadoEscritura: () => void
  onSetReasignando:         (val: boolean) => void
  onNuevoTramiteId:         (val: string) => void
  onNuevoAreaId:            (val: string) => void
  onGuardarReasignacion:    () => void
  onEnviarRecordatorio:     () => void
  onDescargarExpediente:    () => void
  onCopiarLink:             () => void
  onCopiarLinkParte:        (url: string, rolLabel: string) => void
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
  onCopiarLink, onCopiarLinkParte,
}: Props) {

  // ← Hook DENTRO del componente
  // const { esAdmin, esLead, esNotario, puedeEditar } = useUsuario()

  const tramite = ticket.tramites_config
  const area    = ticket.areas

  const [descargando, setDescargando] = useState(false)
  const [fase,        setFase]        = useState('')

  async function descargar() {
    setDescargando(true)
    setFase('Recopilando documentos...')
    const fases = ['Recopilando documentos...','Comprimiendo archivos...','Generando expediente ZIP...','Casi listo...']
    let i = 0
    const intervalo = setInterval(() => { i++; if (i < fases.length) setFase(fases[i]) }, 1200)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/descargar-expediente/${ticket.id}`)
      clearInterval(intervalo)
      if (!res.ok) { const err = await res.json(); alert(`❌ ${err.detail}`); return }
      setFase('¡Listo para descargar!')
      await new Promise(r => setTimeout(r, 600))
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `${ticket.numero}.zip`; a.click()
      URL.revokeObjectURL(url)
    } catch {
      clearInterval(intervalo)
      alert('Error al generar el expediente')
    } finally {
      setDescargando(false)
      setFase('')
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Notaría AI — solo si puede editar */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Asistente de IA
        </div>
        <AIButton href={`/notaria-ai?ticket=${ticket.id}`} label="Consultar con Notaría AI" />
        <div className="text-[10px] mt-2 text-center" style={{ color: '#9C9890' }}>
          Powered by Notaría AI GPT-4o
        </div>
      </div>

      {/* Folios — solo admin y lead */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>Folios</div>
        <div className="mb-4">
          <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Folio DBA</label>
          {folioDBA && (
            <div className="text-[12px] font-mono font-bold mb-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#FEF3C7', color: '#854F0B' }}>{folioDBA}</div>
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
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Folio Escritura</label>
          {folioEscritura && (
            <div className="text-[12px] font-mono font-bold mb-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#D1FAE5', color: '#0F6E56' }}>{folioEscritura}</div>
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
      

      {/* Links de carga — solo si puede editar */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Links de carga
        </div>
        {ticket.partes && ticket.partes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {ticket.partes
              .filter((p: any) => p.upload_token)
              .sort((a: any, b: any) => a.orden - b.orden)
              .map((parte: any) => {
                const rolLabel = parte.rol.replace(/_/g, ' ')
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/upload-parte/${parte.upload_token}`
                return (
                  <div key={parte.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold capitalize" style={{ color: '#333' }}>{rolLabel}</div>
                      {parte.nombre_completo && (
                        <div className="text-[10px]" style={{ color: '#9C9890' }}>{parte.nombre_completo}</div>
                      )}
                    </div>
                    <button onClick={() => onCopiarLinkParte(url, rolLabel)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none flex-shrink-0"
                      style={{ background: '#E6F1FB', color: '#185FA5' }}>
                      📋 Copiar
                    </button>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="text-[11px] text-center py-2" style={{ color: '#9C9890' }}>Sin partes configuradas</div>
        )}
        {(() => {
          const tieneDocsOperacion = (ticket.documentos || []).some((d: any) =>
            d.doc_tipos_config?.para_rol === 'operacion' ||
            d.doc_tipos_config?.para_rol === 'inmueble' ||
            (!d.doc_tipos_config?.para_rol && !d.parte_id)
          )
          if (!tieneDocsOperacion || !ticket.upload_token) return null
          return (
            <div className="flex items-center justify-between gap-2 py-1 pt-2"
              style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold" style={{ color: '#333' }}>Documentos de la operación</div>
                <div className="text-[10px]" style={{ color: '#9C9890' }}>Documentos generales del trámite</div>
              </div>
              <button onClick={() => onCopiarLink()}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none flex-shrink-0"
                style={{ background: '#E6F1FB', color: '#185FA5' }}>
                📋 Copiar
              </button>
            </div>
          )
        })()}
        <div className="text-[10px] mt-3 text-center" style={{ color: '#9C9890' }}>
          Cada link es exclusivo para su parte
        </div>
      </div>

      {/* Links Gubernamentales */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>
          Consultas y validaciones
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Validación INE vigente',          url: 'https://listanominal.ine.mx/scpln/' },
            { label: 'Cédula profesional',              url: 'https://cedulaprofesional.sep.gob.mx/cedula/indexAvanzada.action' },
            { label: 'Licencias Gto.',                  url: 'https://seguridad.guanajuato.gob.mx/licencias_conducir/consulta-de-licencia-de-conducir/' },
            { label: 'Validación actas',                url: 'https://cevar.registrocivil.gob.mx/eVAR/ConsultaFolio.jsp' },
            { label: 'Descarga CURP',                   url: 'https://www.gob.mx/curp/' },
            { label: 'Predial Celaya',                  url: 'https://td.celaya.biz/multipagosws/' },
            { label: 'Predial San Miguel de Allende',   url: 'https://pago-predial.sanmiguelallende.gob.mx/simprecad.php' },
            { label: 'Predial Apaseo el Grande',        url: 'https://pagos.apaseoelgrande.gob.mx/simprecad.php' },
            { label: 'RNOA (Alimentos)',                url: 'https://rnoa.dif.gob.mx/' },
            { label: 'Códigos postales',                url: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Descarga.aspx' },
            { label: 'Leyes federales',                 url: 'https://www.diputados.gob.mx/LeyesBiblio/index.htm' },
            { label: 'Leyes Guanajuato',                url: 'https://www.congresogto.gob.mx/' },
            { label: 'Portal UIF (Lavado)',             url: 'https://sppld.sat.gob.mx/pld/index.html' },
          ].map(link => (
            <div key={link.url} className="flex items-center justify-between">
              <div className="text-[11px] font-semibold truncate flex-1 mr-2" style={{ color: '#333' }}>
                {link.label}
              </div>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold no-underline flex-shrink-0"
                style={{ background: '#E6F1FB', color: '#185FA5' }}>
                ↗ Abrir
              </a>
            </div>
          ))}
        </div>
        <div className="text-[10px] mt-3 text-center" style={{ color: '#9C9890' }}>
          Portales gubernamentales de consulta
        </div>
      </div>

      {/* Reasignar — solo admin y lead */}
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

      {/* Descargar expediente — todos */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>Expediente</div>
        <button onClick={descargar} disabled={descargando}
          className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none transition-all"
          style={{ background: descargando ? '#F3F4F6' : '#111', color: descargando ? '#9CA3AF' : '#fff' }}>
          {descargando ? '⏳ Generando...' : '📦 Descargar expediente ZIP'}
        </button>
        <div className="text-[10px] mt-2 text-center" style={{ color: '#9C9890' }}>
          Descarga los documentos subidos hasta ahora
        </div>
      </div>

      {/* WhatsApp — solo si puede editar */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>WhatsApp</div>
        <button type="button" onClick={onEnviarRecordatorio}
          className="w-full py-2 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
          style={{ background: '#EAF3DE', color: '#3B6D11' }}>
          Enviar recordatorio
        </button>
      </div>

      {/* Info — todos */}
      <div className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9C9890' }}>Información</div>
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

      {/* Modal compresión */}
      {descargando && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl p-6 w-80 text-center"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center text-[28px]"
                style={{ background: '#F7F7F5' }}>📦</div>
              <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#F3F4F6" strokeWidth="4"/>
                <circle cx="32" cy="32" r="28" fill="none" stroke="#111" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray="175" strokeDashoffset="175"
                  style={{ animation: 'zipProgress 3s ease-in-out infinite' }}/>
              </svg>
            </div>
            <div className="text-[15px] font-bold mb-1" style={{ color: '#111' }}>Generando expediente</div>
            <div className="text-[13px] mb-4" style={{ color: '#666' }}>{fase}</div>
            <div className="flex justify-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: '#111', animation: `zipDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes zipProgress { 0%{stroke-dashoffset:175} 50%{stroke-dashoffset:44} 100%{stroke-dashoffset:175} }
        @keyframes zipDot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }
      `}</style>
    </div>
  )
}