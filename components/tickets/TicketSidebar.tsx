'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import t from './ticket.module.css'
import { Ic, Modal, useModal, CANAL_LABEL } from './ticketUi'

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
  nuevoCanal:              string
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
  onEnviarRecordatorio:     () => void | Promise<void>
  onDescargarExpediente:    () => void
  onCopiarLink:             () => void
  onCancelar:               () => void | Promise<void>
  onReactivar:              () => void | Promise<void>
  onCopiarLinkParte:        (url: string, rolLabel: string) => void
  onCompletar:              (comentario: string) => void | Promise<void>
  onNuevoCanal:             (val: string) => void
  onAviso?:                 (texto: string, error?: boolean) => void
}

const CONSULTAS = [
  { label: 'Validación INE vigente',        url: 'https://listanominal.ine.mx/scpln/' },
  { label: 'Descarga CURP',                 url: 'https://www.gob.mx/curp/' },
  { label: 'Validación de actas',           url: 'https://cevar.registrocivil.gob.mx/eVAR/ConsultaFolio.jsp' },
  { label: 'Portal UIF (lavado de dinero)', url: 'https://sppld.sat.gob.mx/pld/index.html' },
  { label: 'Cédula profesional',            url: 'https://cedulaprofesional.sep.gob.mx/cedula/indexAvanzada.action' },
  { label: 'Licencias Guanajuato',          url: 'https://seguridad.guanajuato.gob.mx/licencias_conducir/consulta-de-licencia-de-conducir/' },
  { label: 'Predial Celaya',                url: 'https://td.celaya.biz/multipagosws/' },
  { label: 'Predial San Miguel de Allende', url: 'https://pago-predial.sanmiguelallende.gob.mx/simprecad.php' },
  { label: 'Predial Apaseo el Grande',      url: 'https://pagos.apaseoelgrande.gob.mx/simprecad.php' },
  { label: 'RNOA (alimentos)',              url: 'https://rnoa.dif.gob.mx/' },
  { label: 'Códigos postales',              url: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Descarga.aspx' },
  { label: 'Leyes federales',               url: 'https://www.diputados.gob.mx/LeyesBiblio/index.htm' },
  { label: 'Leyes de Guanajuato',           url: 'https://www.congresogto.gob.mx/' },
]
const CONSULTAS_VISIBLES = 4

export default function TicketSidebar({
  ticket, estado, saving, tramites, areas, conversacionId,
  folioDBA, folioEscritura, folioDBAVinculado, folioEscrituraVinculado,
  reasignando, nuevoTramiteId, nuevoAreaId, nuevoCanal,
  onFolioDBAChange, onFolioEscrituraChange,
  onGuardarFolioDBA, onGuardarFolioEscritura,
  onCambiarEstadoFolioDBA, onCambiarEstadoEscritura,
  onSetReasignando, onNuevoTramiteId, onNuevoAreaId, onNuevoCanal,
  onGuardarReasignacion, onEnviarRecordatorio,
  onCopiarLink, onCopiarLinkParte, onCancelar, onReactivar, onCompletar,
  onAviso,
}: Props) {
  const tramite = ticket.tramites_config
  const area    = ticket.areas
  const api     = process.env.NEXT_PUBLIC_API_URL

  const [descargando, setDescargando] = useState(false)
  const [fase, setFase] = useState('')
  const [enviandoRec, setEnviandoRec] = useState(false)
  const [verConsultas, setVerConsultas] = useState(false)
  const [comentarioCierre, setComentarioCierre] = useState('')
  const [guardandoCierre, setGuardandoCierre] = useState(false)
  const [reactivandoAhora, setReactivandoAhora] = useState(false)

  const mCancelar  = useModal()
  const mReactivar = useModal()
  const mCompletar = useModal()

  const avisar = (texto: string, error = false) => (onAviso ? onAviso(texto, error) : alert(texto))

  async function descargar() {
    setDescargando(true)
    const fases = ['Recopilando documentos…', 'Comprimiendo archivos…', 'Generando expediente ZIP…', 'Casi listo…']
    setFase(fases[0])
    let i = 0
    const intervalo = setInterval(() => { i++; if (i < fases.length) setFase(fases[i]) }, 1200)
    try {
      const res = await fetch(`${api}/api/docs/descargar-expediente/${ticket.id}`)
      clearInterval(intervalo)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        avisar(err.detail || 'No se pudo generar el expediente', true)
        return
      }
      setFase('Listo, descargando…')
      await new Promise(r => setTimeout(r, 500))
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `${ticket.numero}.zip`; a.click()
      URL.revokeObjectURL(url)
      avisar('Expediente descargado')
    } catch {
      clearInterval(intervalo)
      avisar('No se pudo generar el expediente', true)
    } finally {
      setDescargando(false)
      setFase('')
    }
  }

  async function recordatorio() {
    setEnviandoRec(true)
    try { await onEnviarRecordatorio() } finally { setEnviandoRec(false) }
  }

  const partesConLink = (ticket.partes || [])
    .filter((p: any) => p.upload_token)
    .sort((a: any, b: any) => a.orden - b.orden)
  const tieneDocsOperacion = (ticket.documentos || []).some((d: any) =>
    d.doc_tipos_config?.para_rol === 'operacion' ||
    d.doc_tipos_config?.para_rol === 'inmueble' ||
    (!d.doc_tipos_config?.para_rol && !d.parte_id)
  )

  let n = 0
  const delay = () => `${t.rise} ${[t.d1, t.d2, t.d3, t.d4, t.d5, t.d6, t.d7, t.d8, t.d9][Math.min(n++, 8)]}`

  return (
    <aside className={t.side}>

      {/* Acciones rápidas */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}><span className={t.cardTitle}>Acciones</span></div>
        <div className={`${t.cardBody} ${t.stack}`}>
          <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={recordatorio} disabled={enviandoRec}>
            {enviandoRec ? <span className={t.spin} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> : <Ic n="wa" />}
            {enviandoRec ? 'Enviando…' : 'Enviar recordatorio por WhatsApp'}
          </button>
          {conversacionId && (
            <a href={`/chats?conv=${conversacionId}`} className={`${t.btn} ${t.btnLine}`}>
              <Ic n="wa" /> Ver conversación
            </a>
          )}
          <a href={`/notaria-ai?ticket=${ticket.id}`} className={`${t.btn} ${t.btnLine}`}>
            <Ic n="ai" /> Consultar con Notaría AI
          </a>
        </div>
      </section>

      {/* Documentos y descargas */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}><span className={t.cardTitle}>Descargas</span></div>
        <div className={`${t.cardBody} ${t.stack}`}>
          <button type="button" className={`${t.btn} ${t.btnLine}`} onClick={descargar} disabled={descargando}>
            <Ic n="box" /> Expediente completo (ZIP)
          </button>
          <div className={t.row2}>
            <a href={`${api}/api/docs/generar-solicitud/${ticket.id}?formato=docx`} target="_blank" rel="noopener noreferrer" className={`${t.btn} ${t.btnGhost}`}>
              <Ic n="download" size={15} /> Word
            </a>
            <a href={`${api}/api/docs/generar-solicitud/${ticket.id}?formato=pdf`} target="_blank" rel="noopener noreferrer" className={`${t.btn} ${t.btnGhost}`}>
              <Ic n="download" size={15} /> PDF
            </a>
          </div>
          <div className={t.cardNote} style={{ marginTop: 0 }}>Word y PDF generan la solicitud del trámite</div>
        </div>
      </section>

      {/* Folios */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}><span className={t.cardTitle}>Folios</span></div>
        <div className={t.cardBody}>
          <label className={t.label} htmlFor="tk-folio-dba">Folio DBA</label>
          {folioDBAVinculado && folioDBA && (
            <div className={t.folio}><span>{folioDBA}</span><small>Vinculado</small></div>
          )}
          <div className={t.stack}>
            <input id="tk-folio-dba" className={`${t.input} ${t.mono}`} value={folioDBA}
              onChange={e => onFolioDBAChange(e.target.value)} placeholder="DBA-2026-XXXX" />
            <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={onGuardarFolioDBA} disabled={!folioDBA.trim() || saving}>
              <Ic n="link" size={15} /> Vincular folio DBA
            </button>
            {folioDBAVinculado && estado !== 'folio_dba' && estado !== 'escritura_dba' && (
              <button type="button" className={`${t.btn} ${t.btnLine} ${t.fadeSwap}`} onClick={onCambiarEstadoFolioDBA} disabled={saving}>
                Pasar a etapa Folio DBA →
              </button>
            )}
          </div>

          <div className={t.divider} />

          <label className={t.label} htmlFor="tk-folio-esc">Folio de escritura</label>
          {folioEscrituraVinculado && folioEscritura && (
            <div className={t.folio}><span>{folioEscritura}</span><small>Vinculado</small></div>
          )}
          <div className={t.stack}>
            <input id="tk-folio-esc" className={`${t.input} ${t.mono}`} value={folioEscritura}
              onChange={e => onFolioEscrituraChange(e.target.value)} placeholder="ESC-2026-XXXX" />
            <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={onGuardarFolioEscritura} disabled={!folioEscritura.trim() || saving}>
              <Ic n="link" size={15} /> Vincular folio de escritura
            </button>
            {folioEscrituraVinculado && estado !== 'escritura_dba' && (
              <button type="button" className={`${t.btn} ${t.btnLine} ${t.fadeSwap}`} onClick={onCambiarEstadoEscritura} disabled={saving}>
                Pasar a etapa Escritura DBA →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Links de carga */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}><span className={t.cardTitle}>Links de carga</span></div>
        <div className={t.cardBody}>
          {partesConLink.length === 0 && !(tieneDocsOperacion && ticket.upload_token) ? (
            <div className={t.cardNote} style={{ marginTop: 0 }}>Sin partes configuradas</div>
          ) : (
            <div className={t.list}>
              {partesConLink.map((parte: any) => {
                const rolLabel = parte.rol.replace(/_/g, ' ')
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/upload-parte/${parte.upload_token}`
                return (
                  <div key={parte.id} className={t.listRow}>
                    <div>
                      <b>{rolLabel}</b>
                      {parte.nombre_completo && <small>{parte.nombre_completo}</small>}
                    </div>
                    <button type="button" className={t.chipBtn} onClick={() => onCopiarLinkParte(url, rolLabel)}>
                      <Ic n="link" size={12} /> Copiar
                    </button>
                  </div>
                )
              })}
              {tieneDocsOperacion && ticket.upload_token && (
                <div className={t.listRow}>
                  <div>
                    <b style={{ textTransform: 'none' }}>Documentos de la operación</b>
                    <small>Generales del trámite</small>
                  </div>
                  <button type="button" className={t.chipBtn} onClick={() => onCopiarLink()}>
                    <Ic n="link" size={12} /> Copiar
                  </button>
                </div>
              )}
            </div>
          )}
          <div className={t.cardNote}>Cada link es exclusivo para su parte</div>
        </div>
      </section>

      {/* Trámite, área y canal */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}>
          <span className={t.cardTitle}>Trámite, área y canal</span>
          <button type="button" className={`${t.linkBtn} ${reasignando ? t.linkBtnRed : ''}`} onClick={() => onSetReasignando(!reasignando)}>
            {reasignando ? 'Cancelar' : 'Reasignar'}
          </button>
        </div>
        <div className={t.cardBody}>
          {reasignando ? (
            <div key="editar" className={`${t.fieldGap} ${t.fadeSwap}`}>
              <div>
                <label className={t.label} htmlFor="tk-re-tramite">Trámite</label>
                <select id="tk-re-tramite" className={t.select} value={nuevoTramiteId} onChange={e => onNuevoTramiteId(e.target.value)}>
                  {[...tramites].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={t.label} htmlFor="tk-re-canal">Canal</label>
                <select id="tk-re-canal" className={t.select} value={nuevoCanal} onChange={e => onNuevoCanal(e.target.value)}>
                  {Object.entries(CANAL_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className={t.label} htmlFor="tk-re-area">Área</label>
                <select id="tk-re-area" className={t.select} value={nuevoAreaId} onChange={e => onNuevoAreaId(e.target.value)}>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={onGuardarReasignacion} disabled={saving}>
                Guardar reasignación
              </button>
            </div>
          ) : (
            <div key="ver" className={`${t.list} ${t.fadeSwap}`}>
              <div className={t.kv}><span>Trámite</span><b style={{ textTransform: 'none' }}>{tramite?.nombre || '—'}</b></div>
              <div className={t.kv}><span>Área</span><b>{area?.nombre || '—'}</b></div>
              <div className={t.kv}><span>Canal</span><b>{CANAL_LABEL[ticket.canal] || ticket.canal || '—'}</b></div>
            </div>
          )}
        </div>
      </section>

      {/* Información */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}><span className={t.cardTitle}>Información</span></div>
        <div className={t.cardBody}>
          <div className={t.list}>
            <div className={t.kv}><span>Creado</span><b>{format(new Date(ticket.created_at), "d 'de' MMM yyyy", { locale: es })}</b></div>
            <div className={t.kv}><span>Vence (plazo)</span><b>{format(new Date(ticket.sla_vence_at), "d 'de' MMM yyyy", { locale: es })}</b></div>
          </div>
        </div>
      </section>

      {/* Consultas y validaciones */}
      <section className={`${t.card} ${delay()}`}>
        <div className={t.cardHead}><span className={t.cardTitle}>Consultas y validaciones</span></div>
        <div className={t.cardBody}>
          <div className={t.list}>
            {CONSULTAS.slice(0, CONSULTAS_VISIBLES).map(link => (
              <div key={link.url} className={t.listRow}>
                <div><b style={{ textTransform: 'none' }}>{link.label}</b></div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={t.chipBtn}><Ic n="external" size={12} /> Abrir</a>
              </div>
            ))}
          </div>
          <div className={`${t.collapse} ${verConsultas ? t.collapseOpen : ''}`}>
            <div>
              <div className={t.list} style={{ borderTop: '1px dashed var(--line)' }}>
                {CONSULTAS.slice(CONSULTAS_VISIBLES).map(link => (
                  <div key={link.url} className={t.listRow}>
                    <div><b style={{ textTransform: 'none' }}>{link.label}</b></div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={t.chipBtn} tabIndex={verConsultas ? 0 : -1}>
                      <Ic n="external" size={12} /> Abrir
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button type="button" className={`${t.btn} ${t.btnGhost}`} style={{ marginTop: 10 }} onClick={() => setVerConsultas(v => !v)} aria-expanded={verConsultas}>
            {verConsultas ? 'Ver menos' : `Ver las ${CONSULTAS.length}`}
            <span style={{ display: 'flex', transition: 'transform .3s', transform: verConsultas ? 'rotate(180deg)' : 'none' }}><Ic n="chevron" size={14} /></span>
          </button>
        </div>
      </section>

      {/* Cierre del expediente */}
      {estado === 'completado' ? (
        <section className={`${t.card} ${t.doneCard} ${delay()}`}>
          <div className={t.doneIc}><Ic n="check" size={22} sw={2.6} /></div>
          <b>Expediente completado</b>
          <span>Este expediente se cerró correctamente</span>
        </section>
      ) : estado === 'cancelado' ? (
        <section className={`${t.card} ${delay()}`}>
          <div className={t.cardHead}><span className={t.cardTitle}>Expediente cancelado</span></div>
          <div className={t.cardBody}>
            <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={mReactivar.abrir}>
              <Ic n="undo" /> Reactivar expediente
            </button>
            <div className={t.cardNote}>Volverá a la etapa Asignado</div>
          </div>
        </section>
      ) : (
        <section className={`${t.card} ${delay()}`}>
          <div className={t.cardHead}><span className={t.cardTitle}>Cierre</span></div>
          <div className={`${t.cardBody} ${t.stack}`}>
            <button type="button" className={`${t.btn} ${t.btnDark}`} onClick={() => { setComentarioCierre(''); mCompletar.abrir() }}>
              <Ic n="check" /> Marcar como completado
            </button>
            <button type="button" className={`${t.btn} ${t.btnRed}`} onClick={mCancelar.abrir}>
              <Ic n="ban" /> Cancelar expediente
            </button>
          </div>
        </section>
      )}

      {/* ── Modales ── */}
      {descargando && (
        <Modal ancho={320}>
          <div className={t.zip}>
            <div className={t.zipRing}>
              <svg viewBox="0 0 64 64" width="64" height="64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#ececea" strokeWidth="3" />
                <circle className={t.arc} cx="32" cy="32" r="28" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span><Ic n="box" size={22} /></span>
            </div>
            <h3>Generando expediente</h3>
            <p key={fase}>{fase}</p>
          </div>
        </Modal>
      )}

      {mCancelar.abierto && (
        <Modal saliendo={mCancelar.saliendo} onClose={mCancelar.cerrar}>
          <div className={t.modalBody}>
            <div className={`${t.modalIc} ${t.modalIcRed}`}><Ic n="ban" size={20} /></div>
            <h3>¿Cancelar este expediente?</h3>
            <p>El expediente <strong>{ticket.numero}</strong> quedará como cancelado. Podrás consultarlo, pero ya no aparecerá en el flujo activo.</p>
            <div className={t.modalNote}>No se elimina nada: solo cambia su estado.</div>
          </div>
          <div className={t.modalFoot}>
            <button type="button" className={`${t.btn} ${t.btnGhost}`} onClick={mCancelar.cerrar}>No, mantener</button>
            <button type="button" className={`${t.btn} ${t.btnSolidRed}`} disabled={saving}
              onClick={async () => { mCancelar.cerrar(); await onCancelar() }}>
              Sí, cancelar
            </button>
          </div>
        </Modal>
      )}

      {mReactivar.abierto && (
        <Modal saliendo={mReactivar.saliendo} onClose={reactivandoAhora ? undefined : mReactivar.cerrar}>
          <div className={t.modalBody}>
            <div className={t.modalIc}><Ic n="undo" size={20} /></div>
            <h3>¿Reactivar este expediente?</h3>
            <p>El expediente <strong>{ticket.numero}</strong> volverá a la etapa <strong>Asignado</strong> y aparecerá de nuevo en el tablero.</p>
          </div>
          <div className={t.modalFoot}>
            <button type="button" className={`${t.btn} ${t.btnGhost}`} onClick={mReactivar.cerrar} disabled={reactivandoAhora}>Cancelar</button>
            <button type="button" className={`${t.btn} ${t.btnDark}`} disabled={reactivandoAhora}
              onClick={async () => { setReactivandoAhora(true); try { await onReactivar() } finally { setReactivandoAhora(false); mReactivar.cerrar() } }}>
              {reactivandoAhora ? 'Reactivando…' : 'Sí, reactivar'}
            </button>
          </div>
        </Modal>
      )}

      {mCompletar.abierto && (
        <Modal saliendo={mCompletar.saliendo} onClose={guardandoCierre ? undefined : mCompletar.cerrar} ancho={440}>
          <div className={t.modalBody}>
            <div className={t.modalIc}><Ic n="check" size={20} sw={2.4} /></div>
            <h3>Completar expediente</h3>
            <p>Escribe un comentario de cierre. Quedará en las observaciones del expediente.</p>
            <textarea
              autoFocus
              className={t.textarea}
              style={{ marginTop: 14 }}
              rows={4}
              value={comentarioCierre}
              onChange={e => setComentarioCierre(e.target.value)}
              placeholder="Ej. Escritura firmada y entregada al cliente."
            />
            <div className={t.counter}>{comentarioCierre.length} caracteres</div>
          </div>
          <div className={t.modalFoot}>
            <button type="button" className={`${t.btn} ${t.btnGhost}`} onClick={mCompletar.cerrar} disabled={guardandoCierre}>Cancelar</button>
            <button type="button" className={`${t.btn} ${t.btnDark}`} disabled={!comentarioCierre.trim() || guardandoCierre}
              onClick={async () => {
                setGuardandoCierre(true)
                try { await onCompletar(comentarioCierre) } finally { setGuardandoCierre(false); mCompletar.cerrar() }
              }}>
              {guardandoCierre ? 'Guardando…' : 'Completar'}
            </button>
          </div>
        </Modal>
      )}
    </aside>
  )
}