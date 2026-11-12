'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import s from './tabs.module.css'
import { Ic, Toast, useAviso } from '../ticketUi'
import { rolLabel } from './tabsUtil'

interface Props {
  documentos: any[]
  tramite:    any
  ticket:     any
  onSubir:    (docId: string, docTipoId: string, parteId: string | null, archivo: File) => void
  onValidar:  (docId: string) => void
}

type Filtro = 'todos' | 'sin_clasificar' | 'por_revisar' | 'recibidos' | 'validados'
type Agrupar = 'ninguno' | 'parte' | 'tipo'
type Cola = { id: string; nombre: string; progreso: number; estado: 'esperando' | 'subiendo' | 'listo' | 'error'; detalle?: string }

const EXT_OK = /\.(pdf|jpe?g|png|webp)$/i
const LOTE = 4

const ESTADO: Record<string, { label: string; tono?: 'dark' | 'red' | 'line' }> = {
  sin_clasificar:     { label: 'Sin clasificar', tono: 'line' },
  pendiente:          { label: 'Pendiente' },
  recibido:           { label: 'Recibido' },
  ocr_procesado:      { label: 'Leído por IA' },
  revision_requerida: { label: 'Revisar', tono: 'red' },
  revisar:            { label: 'Revisar', tono: 'red' },
  rechazado:          { label: 'Rechazado', tono: 'red' },
  validado:           { label: 'Validado', tono: 'dark' },
}

const esImagen = (url?: string) => !!url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)
const esPDF = (url?: string) => !!url && /\.pdf(\?|$)/i.test(url)
const esSuelto = (d: any) => !d.doc_tipo_id
const conProblema = (d: any) =>
  ['rechazado', 'revision_requerida', 'revisar'].includes(d.estado) ||
  ['rechazado', 'revisar', 'revision_requerida'].includes(d.datos_ocr?.estado_ia)

// Lee archivos sueltos y carpetas completas (con subcarpetas) de un arrastre
async function leerArrastre(dt: DataTransfer): Promise<File[]> {
  const entradas = Array.from(dt.items || [])
    .map(i => (i as any).webkitGetAsEntry?.())
    .filter(Boolean)
  if (!entradas.length) return Array.from(dt.files || [])

  const archivos: File[] = []
  async function recorrer(entry: any): Promise<void> {
    if (entry.isFile) {
      const f = await new Promise<File | null>(res => entry.file(res, () => res(null)))
      if (f) archivos.push(f)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      let lote: any[] = []
      do {
        lote = await new Promise<any[]>(res => reader.readEntries(res, () => res([])))
        for (const e of lote) await recorrer(e)
      } while (lote.length)
    }
  }
  for (const e of entradas) await recorrer(e)
  return archivos
}

function subirLote(api: string, ticketId: string, archivos: File[], alProgresar: (p: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('ticket_id', ticketId)
    archivos.forEach(a => form.append('archivos', a, a.name))
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${api}/api/docs/upload-masivo`)
    xhr.upload.onprogress = e => e.lengthComputable && alProgresar(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) } catch { resolve({ resultados: [] }) }
      } else reject(new Error(`Error ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Sin conexión'))
    xhr.send(form)
  })
}

export default function TabDocs({ documentos, tramite, ticket, onSubir, onValidar }: Props) {
  const api = process.env.NEXT_PUBLIC_API_URL || ''
  const supabase = useMemo(() => createClient(), [])
  const { aviso, mostrar } = useAviso()

  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [vista, setVista] = useState<'cuadricula' | 'lista'>('cuadricula')
  const [agrupar, setAgrupar] = useState<Agrupar>('ninguno')
  const [checklistAbierto, setChecklistAbierto] = useState(true)
  const [cola, setCola] = useState<Cola[]>([])
  const [arrastrandoArchivos, setArrastrandoArchivos] = useState(false)
  const [arrastrandoDoc, setArrastrandoDoc] = useState<string | null>(null)
  const [slotEncima, setSlotEncima] = useState<string | null>(null)
  const [visorId, setVisorId] = useState<string | null>(null)
  const [visorSaliendo, setVisorSaliendo] = useState(false)
  const [clasificando, setClasificando] = useState<{ doc: any; destino: string | null; ocupado: boolean } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmar, setConfirmar] = useState<string | null>(null)

  const inputArchivos = useRef<HTMLInputElement>(null)
  const inputCarpeta = useRef<HTMLInputElement>(null)
  const contadorArrastre = useRef(0)

  // ─── Datos derivados ───
  const partesPorId = useMemo(() => {
    const m: Record<string, any> = {}
    ;(ticket.partes || []).forEach((p: any) => { m[p.id] = p })
    return m
  }, [ticket.partes])

  function grupoParte(d: any): { clave: string; label: string } {
    if (esSuelto(d)) return { clave: 'zz_sin', label: 'Sin clasificar' }
    const parte = d.parte_id ? partesPorId[d.parte_id] : null
    if (parte) return { clave: `p_${parte.id}`, label: `${rolLabel(parte.rol)}${parte.nombre_completo ? ` · ${parte.nombre_completo}` : ''}` }
    const rol = d.doc_tipos_config?.para_rol
    if (rol && rol !== 'operacion' && rol !== 'inmueble') return { clave: `r_${rol}`, label: rolLabel(rol) }
    return { clave: 'zy_op', label: 'Documentos de la operación' }
  }
  const nombreDoc = (d: any) => (esSuelto(d) ? d.nombre_archivo || 'Archivo sin nombre' : d.doc_tipos_config?.nombre || 'Documento')
  const etiquetaSlot = (d: any) => `${d.doc_tipos_config?.nombre || 'Documento'} · ${grupoParte(d).label}`

  const slots = documentos.filter(d => !esSuelto(d))
  const sueltos = documentos.filter(esSuelto)
  const conArchivo = documentos.filter(d => d.archivo_url)
  const slotsRecibidos = slots.filter(d => d.archivo_url)
  const obligatorios = slots.filter(d => d.doc_tipos_config?.obligatorio)
  const obligatoriosRecibidos = obligatorios.filter(d => d.archivo_url)
  const validados = slots.filter(d => d.estado === 'validado')

  const conteo: Record<Filtro, number> = {
    todos:          conArchivo.length,
    sin_clasificar: sueltos.length,
    por_revisar:    conArchivo.filter(conProblema).length,
    recibidos:      slotsRecibidos.filter(d => d.estado !== 'validado' && !conProblema(d)).length,
    validados:      validados.length,
  }

  const visibles = conArchivo.filter(d => {
    if (filtro === 'sin_clasificar') return esSuelto(d)
    if (filtro === 'por_revisar') return conProblema(d)
    if (filtro === 'recibidos') return !esSuelto(d) && d.estado !== 'validado' && !conProblema(d)
    if (filtro === 'validados') return d.estado === 'validado'
    return true
  }).sort((a, b) => Number(!esSuelto(a)) - Number(!esSuelto(b)))

  const grupos = useMemo(() => {
    if (agrupar === 'ninguno') return [{ clave: 'todos', label: '', docs: visibles }]
    const m = new Map<string, { clave: string; label: string; docs: any[] }>()
    visibles.forEach(d => {
      const g = agrupar === 'parte' ? grupoParte(d) : esSuelto(d)
        ? { clave: 'zz_sin', label: 'Sin clasificar' }
        : { clave: `t_${d.doc_tipos_config?.nombre}`, label: d.doc_tipos_config?.nombre || 'Documento' }
      if (!m.has(g.clave)) m.set(g.clave, { ...g, docs: [] })
      m.get(g.clave)!.docs.push(d)
    })
    return [...m.values()].sort((a, b) => a.clave.localeCompare(b.clave))
  }, [visibles, agrupar])

  const checklist = useMemo(() => {
    const m = new Map<string, { clave: string; label: string; docs: any[] }>()
    slots.forEach(d => {
      const g = grupoParte(d)
      if (!m.has(g.clave)) m.set(g.clave, { ...g, docs: [] })
      m.get(g.clave)!.docs.push(d)
    })
    return [...m.values()].sort((a, b) => a.clave.localeCompare(b.clave))
  }, [slots])

  // ─── Subida masiva ───
  async function subirArchivos(archivos: File[]) {
    const validos = archivos.filter(a => !a.name.startsWith('.') && EXT_OK.test(a.name))
    const rechazados = archivos.filter(a => !a.name.startsWith('.') && !EXT_OK.test(a.name))
    if (!validos.length && !rechazados.length) return

    const base = Date.now()
    const nuevos: Cola[] = [
      ...validos.map((a, i) => ({ id: `${base}-${i}`, nombre: a.name, progreso: 0, estado: 'esperando' as const })),
      ...rechazados.map((a, i) => ({ id: `${base}-x${i}`, nombre: a.name, progreso: 0, estado: 'error' as const, detalle: 'Formato no permitido (PDF, JPG o PNG)' })),
    ]
    setCola(prev => [...nuevos, ...prev.filter(c => c.estado === 'subiendo' || c.estado === 'esperando')])

    let auto = 0, pendientesClasificar = 0, errores = rechazados.length
    for (let i = 0; i < validos.length; i += LOTE) {
      const lote = validos.slice(i, i + LOTE)
      const ids = lote.map((_, j) => `${base}-${i + j}`)
      setCola(prev => prev.map(c => (ids.includes(c.id) ? { ...c, estado: 'subiendo' } : c)))
      try {
        const res = await subirLote(api, ticket.id, lote, p =>
          setCola(prev => prev.map(c => (ids.includes(c.id) ? { ...c, progreso: p } : c))))
        const resultados: any[] = res.resultados || []
        setCola(prev => prev.map(c => {
          const k = ids.indexOf(c.id)
          if (k === -1) return c
          const r = resultados[k]
          if (!r || !r.ok) { errores++; return { ...c, estado: 'error', progreso: 1, detalle: r?.error || 'No se pudo subir' } }
          if (r.clasificado_en) { auto++; return { ...c, estado: 'listo', progreso: 1, detalle: `Acomodado en: ${r.clasificado_en}` } }
          pendientesClasificar++
          return { ...c, estado: 'listo', progreso: 1, detalle: r.sugerencia ? `Sugerencia: ${r.sugerencia}` : 'Por clasificar' }
        }))
      } catch (e: any) {
        errores += lote.length
        setCola(prev => prev.map(c => (ids.includes(c.id) ? { ...c, estado: 'error', detalle: e?.message || 'No se pudo subir' } : c)))
      }
    }

    const subidos = validos.length - (errores - rechazados.length)
    if (subidos > 0) {
      const partesTxt = [auto && `${auto} acomodado${auto !== 1 ? 's' : ''} solo${auto !== 1 ? 's' : ''}`, pendientesClasificar && `${pendientesClasificar} por clasificar`].filter(Boolean).join(' · ')
      mostrar(`${subidos} archivo${subidos !== 1 ? 's' : ''} subido${subidos !== 1 ? 's' : ''}${partesTxt ? ` · ${partesTxt}` : ''}`)
      if (pendientesClasificar) setFiltro('sin_clasificar')
    }
    if (errores) mostrar(`${errores} archivo${errores !== 1 ? 's' : ''} no se pudo subir`, true)
  }

  // Arrastre de archivos del explorador sobre toda la pestaña
  const traeArchivos = (e: React.DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files')
  function alEntrar(e: React.DragEvent) {
    if (!traeArchivos(e)) return
    e.preventDefault()
    contadorArrastre.current++
    setArrastrandoArchivos(true)
  }
  function alSalir(e: React.DragEvent) {
    if (!traeArchivos(e)) return
    contadorArrastre.current = Math.max(0, contadorArrastre.current - 1)
    if (contadorArrastre.current === 0) setArrastrandoArchivos(false)
  }
  async function alSoltar(e: React.DragEvent) {
    if (!traeArchivos(e)) return
    e.preventDefault()
    contadorArrastre.current = 0
    setArrastrandoArchivos(false)
    const archivos = await leerArrastre(e.dataTransfer)
    subirArchivos(archivos)
  }

  // ─── Clasificar ───
  async function clasificar(doc: any, destinoId: string, reemplazar = false) {
    setGuardando(true)
    try {
      const res = await fetch(`${api}/api/docs/${doc.id}/clasificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino_id: destinoId, reemplazar }),
      })
      if (res.status === 409) {
        setClasificando({ doc, destino: destinoId, ocupado: true })
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        mostrar(typeof err.detail === 'object' ? err.detail.mensaje : err.detail || 'No se pudo clasificar', true)
        return
      }
      const destino = slots.find(d => d.id === destinoId)
      mostrar(`Clasificado como ${destino ? etiquetaSlot(destino) : 'documento'}`)
      setClasificando(null)
      if (visorId === doc.id) cerrarVisor()
    } catch {
      mostrar('No hay conexión con el servidor', true)
    } finally {
      setGuardando(false)
    }
  }

  function abrirClasificar(doc: any, destino?: string | null) {
    setClasificando({ doc, destino: destino ?? doc.sugerencia?.destino_id ?? null, ocupado: false })
  }

  async function eliminarSuelto(doc: any) {
    await supabase.from('documentos').delete().eq('id', doc.id)
    setConfirmar(null)
    mostrar('Archivo eliminado')
    if (visorId === doc.id) cerrarVisor()
  }

  async function quitarArchivo(doc: any) {
    await supabase.from('documentos').update({ estado: 'pendiente', archivo_url: null, datos_ocr: null, nombre_archivo: null }).eq('id', doc.id)
    setConfirmar(null)
    mostrar('Archivo quitado; el documento quedó pendiente')
    cerrarVisor()
  }

  // ─── Visor ───
  const indiceVisor = visibles.findIndex(d => d.id === visorId)
  const docVisor = indiceVisor >= 0 ? visibles[indiceVisor] : conArchivo.find(d => d.id === visorId) || null
  function cerrarVisor() {
    setVisorSaliendo(true)
    setTimeout(() => { setVisorId(null); setVisorSaliendo(false); setConfirmar(null) }, 170)
  }
  function moverVisor(paso: number) {
    if (!visibles.length) return
    const i = (indiceVisor + paso + visibles.length) % visibles.length
    setVisorId(visibles[i].id)
    setConfirmar(null)
  }
  useEffect(() => {
    if (!visorId) return
    const tecla = (e: KeyboardEvent) => {
      if (clasificando) return
      if (e.key === 'Escape') cerrarVisor()
      if (e.key === 'ArrowRight') moverVisor(1)
      if (e.key === 'ArrowLeft') moverVisor(-1)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [visorId, indiceVisor, visibles.length, clasificando])

  // ─── Render de una tarjeta ───
  function etiqueta(d: any) {
    const e = conProblema(d) && !esSuelto(d) ? ESTADO.rechazado : ESTADO[d.estado] || ESTADO.recibido
    const label = conProblema(d) && d.datos_ocr?.estado_ia === 'revisar' ? 'Revisar' : e.label
    return <span className={`${s.chip} ${e.tono === 'dark' ? s.chipDark : e.tono === 'red' ? s.chipRed : e.tono === 'line' ? s.chipLine : ''}`}>{label}</span>
  }

  function miniatura(d: any, chica = false) {
    if (esImagen(d.archivo_url)) return <img src={d.archivo_url} alt="" loading="lazy" />
    return (
      <span className={s.fileIc}>
        <Ic n="doc" size={chica ? 16 : 30} sw={1.4} />
        {!chica && <span>{esPDF(d.archivo_url) ? 'PDF' : 'ARCHIVO'}</span>}
      </span>
    )
  }

  function tarjeta(d: any, i: number) {
    const suelto = esSuelto(d)
    const clases = [s.card, suelto ? s.cardLoose : '', conProblema(d) ? s.cardBad : '', arrastrandoDoc === d.id ? s.cardDragging : ''].join(' ')
    const comun = {
      draggable: suelto,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData('application/x-doc', d.id)
        e.dataTransfer.effectAllowed = 'move'
        requestAnimationFrame(() => setArrastrandoDoc(d.id))
        setChecklistAbierto(true)
      },
      onDragEnd: () => { setArrastrandoDoc(null); setSlotEncima(null) },
    }
    const subtitulo = suelto ? 'Arrástralo a su lugar o clasifícalo' : grupoParte(d).label

    if (vista === 'lista') {
      return (
        <button key={d.id} type="button" className={s.row} style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }} onClick={() => setVisorId(d.id)} {...comun}>
          <span className={s.rowIc}>{miniatura(d, true)}</span>
          <span className={s.rowMain}>
            <b>{nombreDoc(d)}</b>
            <small>{suelto && d.sugerencia ? `Sugerencia: ${d.sugerencia.nombre}` : subtitulo}</small>
          </span>
          {etiqueta(d)}
          {suelto && (
            <span className={`${s.btn} ${s.btnLine} ${s.btnSm}`} role="button" onClick={e => { e.stopPropagation(); abrirClasificar(d) }}>
              Clasificar
            </span>
          )}
        </button>
      )
    }

    return (
      <div key={d.id} className={clases} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} onClick={() => setVisorId(d.id)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setVisorId(d.id)} {...comun}>
        <div className={s.thumb}>
          {miniatura(d)}
          <span className={s.thumbTag}>{etiqueta(d)}</span>
        </div>
        <div className={s.cardBody}>
          <b>{nombreDoc(d)}</b>
          <small>{subtitulo}</small>
          {suelto && (
            <div className={s.suggest} onClick={e => e.stopPropagation()}>
              {d.sugerencia ? <span>¿Es <b>{d.sugerencia.nombre}</b>?</span> : <span>Sin clasificar</span>}
              <div>
                {d.sugerencia && (
                  <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnSm}`} disabled={guardando}
                    onClick={() => clasificar(d, d.sugerencia.destino_id)}>Sí</button>
                )}
                <button type="button" className={`${s.btn} ${s.btnLine} ${s.btnSm}`} onClick={() => abrirClasificar(d)}>
                  {d.sugerencia ? 'Otro' : 'Clasificar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const subiendo = cola.some(c => c.estado === 'subiendo' || c.estado === 'esperando')
  const sinArchivos = conArchivo.length === 0

  return (
    <div className={s.wrap} onDragEnter={alEntrar} onDragLeave={alSalir} onDragOver={e => traeArchivos(e) && e.preventDefault()} onDrop={alSoltar}>
      {arrastrandoArchivos && (
        <div className={s.overlay}>
          <span className={s.dropIc}><Ic n="upload" size={22} /></span>
          <b>Suelta para subir</b>
          <span>Archivos o carpetas completas · el sistema los acomoda</span>
        </div>
      )}

      {/* Zona para subir */}
      <div className={`${s.drop} ${sinArchivos ? s.dropBig : ''} ${arrastrandoArchivos ? s.dropOn : ''}`}>
        <span className={s.dropIc}><Ic n="upload" size={22} /></span>
        <div className={s.dropText}>
          <b>{sinArchivos ? 'Arrastra aquí todos los documentos' : 'Agregar más documentos'}</b>
          <span>Archivos sueltos o una carpeta completa, sin importar el orden. PDF, JPG o PNG.</span>
        </div>
        <div className={s.dropActions}>
          <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={() => inputArchivos.current?.click()} disabled={subiendo}>
            <Ic n="upload" size={15} /> Subir archivos
          </button>
          <button type="button" className={`${s.btn} ${s.btnLine}`} onClick={() => inputCarpeta.current?.click()} disabled={subiendo}>
            <Ic n="box" size={15} /> Subir carpeta
          </button>
        </div>
        <input ref={inputArchivos} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={e => { const f = Array.from(e.target.files || []); e.target.value = ''; subirArchivos(f) }} />
        <input ref={inputCarpeta} type="file" multiple hidden
          {...({ webkitdirectory: '', directory: '' } as any)}
          onChange={e => { const f = Array.from(e.target.files || []); e.target.value = ''; subirArchivos(f) }} />
      </div>

      {cola.length > 0 && (
        <div className={s.queue}>
          <div className={s.queueHead}>
            <span>{subiendo ? `Subiendo ${cola.filter(c => c.estado === 'subiendo' || c.estado === 'esperando').length} archivo(s)…` : 'Subida terminada'}</span>
            {!subiendo && <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setCola([])}>Cerrar</button>}
          </div>
          <div className={s.queueList}>
            {cola.map(c => (
              <div key={c.id} className={s.qItem}>
                <span className={s.qName}>{c.nombre}{c.detalle && <small className={c.estado === 'error' ? s.qErr : ''}>{c.detalle}</small>}</span>
                {c.estado === 'subiendo' || c.estado === 'esperando'
                  ? <span className={s.qBar}><i style={{ width: `${Math.round(c.progreso * 100)}%` }} /></span>
                  : <span className={c.estado === 'error' ? s.qErr : s.qOk}><Ic n={c.estado === 'error' ? 'x' : 'check'} size={15} sw={2.4} /></span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      {slots.length > 0 && (
        <div className={s.summary}>
          <div className={s.sumItem}>
            <small>Obligatorios recibidos</small>
            <b>{obligatoriosRecibidos.length}<em> / {obligatorios.length}</em></b>
          </div>
          <div className={s.sumItem}>
            <small>Validados</small>
            <b>{validados.length}<em> / {slots.length}</em></b>
          </div>
          <div className={`${s.sumItem} ${conteo.por_revisar ? s.sumAlert : ''}`}>
            <small>{conteo.por_revisar ? 'Por revisar' : 'Por clasificar'}</small>
            <b>{conteo.por_revisar || sueltos.length}</b>
          </div>
        </div>
      )}

      {/* Checklist de lo que pide el trámite */}
      {slots.length > 0 && (
        <div className={s.check}>
          <button type="button" className={s.checkHead} onClick={() => setChecklistAbierto(v => !v)} aria-expanded={checklistAbierto}>
            <b>Lo que pide el trámite</b>
            <span>
              {slotsRecibidos.length} de {slots.length} recibidos
              <span className={`${s.chev} ${checklistAbierto ? s.chevOpen : ''}`}><Ic n="chevron" size={14} /></span>
            </span>
          </button>
          <div className={`${s.collapse} ${checklistAbierto ? s.collapseOpen : ''}`}>
            <div>
              {checklist.map(g => (
                <div key={g.clave} className={s.checkGroup}>
                  <div className={s.checkGroupTitle}>
                    <span>{g.label}</span>
                    <span>{g.docs.filter(d => d.archivo_url).length}/{g.docs.length}</span>
                  </div>
                  {g.docs.map(d => {
                    const recibido = !!d.archivo_url
                    const malo = conProblema(d)
                    const ok = d.estado === 'validado'
                    const objetivo = !!arrastrandoDoc
                    return (
                      <div
                        key={d.id}
                        className={[s.slot, objetivo ? s.slotTarget : '', slotEncima === d.id ? s.slotHover : ''].join(' ')}
                        onDragOver={e => {
                          if (!Array.from(e.dataTransfer.types).includes('application/x-doc')) return
                          e.preventDefault()
                          if (slotEncima !== d.id) setSlotEncima(d.id)
                        }}
                        onDragLeave={() => setSlotEncima(x => (x === d.id ? null : x))}
                        onDrop={e => {
                          const id = e.dataTransfer.getData('application/x-doc')
                          if (!id) return
                          e.preventDefault()
                          e.stopPropagation()
                          setSlotEncima(null)
                          setArrastrandoDoc(null)
                          const doc = sueltos.find(x => x.id === id)
                          if (!doc) return
                          if (recibido) setClasificando({ doc, destino: d.id, ocupado: true })
                          else clasificar(doc, d.id)
                        }}
                      >
                        <span className={`${s.slotDot} ${ok ? s.slotDotOk : malo ? s.slotDotBad : recibido ? s.slotDotIn : ''}`}>
                          {ok ? <Ic n="check" size={11} sw={3} /> : malo ? <Ic n="x" size={11} sw={3} /> : recibido ? <Ic n="check" size={11} sw={2.4} /> : null}
                        </span>
                        <span className={s.slotName}>
                          {d.doc_tipos_config?.nombre}
                          {d.doc_tipos_config?.obligatorio && <span className={s.slotReq} title="Obligatorio">*</span>}
                        </span>
                        {recibido ? (
                          <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setVisorId(d.id)}>Ver</button>
                        ) : (
                          <>
                            <span className={s.slotState}>{objetivo ? 'Suelta aquí' : 'Falta'}</span>
                            <label className={`${s.btn} ${s.btnLine} ${s.btnSm}`} title="Subir directo a este documento">
                              Subir
                              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={e => {
                                  const f = e.target.files?.[0]
                                  e.target.value = ''
                                  if (f) onSubir(d.id, d.doc_tipo_id, d.parte_id, f)
                                }} />
                            </label>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Archivos */}
      {!sinArchivos && (
        <>
          <div className={s.filters}>
            <div className={s.pills}>
              {([
                ['todos', 'Todos'],
                ['sin_clasificar', 'Sin clasificar'],
                ['por_revisar', 'Por revisar'],
                ['recibidos', 'Por validar'],
                ['validados', 'Validados'],
              ] as [Filtro, string][]).map(([id, label]) => (
                (id === 'todos' || conteo[id] > 0 || filtro === id) && (
                  <button key={id} type="button"
                    className={[s.pill, filtro === id ? s.pillOn : '', id === 'por_revisar' ? s.pillRed : ''].join(' ')}
                    onClick={() => setFiltro(id)}>
                    {label} <b>{conteo[id]}</b>
                  </button>
                )
              ))}
            </div>
            <div className={s.viewTools}>
              <select className={s.miniSelect} value={agrupar} onChange={e => setAgrupar(e.target.value as Agrupar)} aria-label="Agrupar">
                <option value="ninguno">Sin agrupar</option>
                <option value="parte">Agrupar por parte</option>
                <option value="tipo">Agrupar por tipo</option>
              </select>
              <div className={s.seg} role="group" aria-label="Vista">
                <button type="button" className={vista === 'cuadricula' ? s.segOn : ''} onClick={() => setVista('cuadricula')} title="Cuadrícula">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                </button>
                <button type="button" className={vista === 'lista' ? s.segOn : ''} onClick={() => setVista('lista')} title="Lista">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                </button>
              </div>
            </div>
          </div>

          {visibles.length === 0 ? (
            <div className={s.empty}><b>Nada en este filtro</b><span>Prueba con "Todos".</span></div>
          ) : grupos.map(g => (
            <div key={`${g.clave}-${vista}`}>
              {g.label && <div className={s.groupTitle}>{g.label} · {g.docs.length}</div>}
              {vista === 'cuadricula'
                ? <div className={s.grid}>{g.docs.map((d, i) => tarjeta(d, i))}</div>
                : <div className={s.list}>{g.docs.map((d, i) => tarjeta(d, i))}</div>}
            </div>
          ))}
        </>
      )}

      {slots.length === 0 && sinArchivos && (
        <div className={s.empty} style={{ marginTop: 12 }}>
          <b>Este trámite no tiene documentos configurados</b>
          <span>Igual puedes subir archivos; quedarán como "sin clasificar".</span>
        </div>
      )}

      {/* ── Visor ── */}
      {docVisor && (
        <div className={`${s.viewer} ${visorSaliendo ? s.viewerOut : ''}`} onClick={cerrarVisor}>
          <div className={s.vBox} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={s.vHead}>
              <div className={s.vTitle}>
                <b>{nombreDoc(docVisor)}</b>
                <small>
                  {etiqueta(docVisor)}
                  {esSuelto(docVisor) ? 'Sin clasificar' : grupoParte(docVisor).label}
                  {!esSuelto(docVisor) && docVisor.nombre_archivo && <> · {docVisor.nombre_archivo}</>}
                </small>
              </div>
              <div className={s.vActions}>
                {esSuelto(docVisor) ? (
                  <>
                    <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnSm}`} onClick={() => abrirClasificar(docVisor)}>Clasificar</button>
                    {confirmar === docVisor.id
                      ? <button type="button" className={`${s.btn} ${s.btnRed} ${s.btnSm}`} onClick={() => eliminarSuelto(docVisor)}>¿Eliminar? Sí</button>
                      : <button type="button" className={`${s.btn} ${s.btnLine} ${s.btnSm}`} onClick={() => setConfirmar(docVisor.id)}>Eliminar</button>}
                  </>
                ) : (
                  <>
                    {['recibido', 'ocr_procesado', 'revision_requerida', 'revisar'].includes(docVisor.estado) && (
                      <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnSm}`} onClick={() => onValidar(docVisor.id)}>
                        <Ic n="check" size={13} sw={2.4} /> Validar
                      </button>
                    )}
                    <label className={`${s.btn} ${s.btnLine} ${s.btnSm}`}>
                      Reemplazar
                      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) { onSubir(docVisor.id, docVisor.doc_tipo_id, docVisor.parte_id, f); cerrarVisor() }
                      }} />
                    </label>
                    {confirmar === docVisor.id
                      ? <button type="button" className={`${s.btn} ${s.btnRed} ${s.btnSm}`} onClick={() => quitarArchivo(docVisor)}>¿Quitar? Sí</button>
                      : <button type="button" className={`${s.btn} ${s.btnLine} ${s.btnSm}`} onClick={() => setConfirmar(docVisor.id)}>Quitar archivo</button>}
                  </>
                )}
                <a className={s.iconBtn} href={docVisor.archivo_url} target="_blank" rel="noopener noreferrer" title="Abrir en otra pestaña"><Ic n="external" size={14} /></a>
                <a className={s.iconBtn} href={docVisor.archivo_url} download title="Descargar"><Ic n="download" size={14} /></a>
                <button type="button" className={s.iconBtn} onClick={cerrarVisor} title="Cerrar (Esc)"><Ic n="x" size={14} /></button>
              </div>
            </div>
            <div className={s.vBody}>
              <div className={s.vPreview}>
                {visibles.length > 1 && indiceVisor >= 0 && (
                  <>
                    <button type="button" className={`${s.vNav} ${s.vPrev}`} onClick={() => moverVisor(-1)} title="Anterior (←)"><Ic n="back" size={16} /></button>
                    <button type="button" className={`${s.vNav} ${s.vNext}`} onClick={() => moverVisor(1)} title="Siguiente (→)">
                      <span style={{ display: 'flex', transform: 'rotate(180deg)' }}><Ic n="back" size={16} /></span>
                    </button>
                    <span className={s.vCount}>{indiceVisor + 1} de {visibles.length}</span>
                  </>
                )}
                {esPDF(docVisor.archivo_url)
                  ? <iframe key={docVisor.id} src={docVisor.archivo_url} title={nombreDoc(docVisor)} />
                  : <img key={docVisor.id} src={docVisor.archivo_url} alt={nombreDoc(docVisor)} />}
              </div>
              <aside className={s.vSide}>
                {docVisor.datos_ocr?.mensaje_ia && (
                  <div>
                    <h5>Revisión con IA</h5>
                    <div className={`${s.iaBox} ${conProblema(docVisor) ? s.iaBad : ''}`}>
                      {docVisor.datos_ocr.mensaje_ia}
                      {docVisor.datos_ocr.observaciones && <div style={{ marginTop: 4, opacity: 0.85 }}>{docVisor.datos_ocr.observaciones}</div>}
                    </div>
                  </div>
                )}
                {esSuelto(docVisor) && docVisor.sugerencia && (
                  <div>
                    <h5>Sugerencia</h5>
                    <div className={s.iaBox}>
                      Parece <b>{docVisor.sugerencia.nombre}</b>
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnSm}`} disabled={guardando}
                          onClick={() => clasificar(docVisor, docVisor.sugerencia.destino_id)}>Sí, es ese</button>
                      </div>
                    </div>
                  </div>
                )}
                {docVisor.datos_ocr?.campos && Object.keys(docVisor.datos_ocr.campos).length > 0 && (
                  <div>
                    <h5>Datos extraídos</h5>
                    {Object.entries(docVisor.datos_ocr.campos)
                      .filter(([k, v]) => k !== 'texto_completo' && (v as any)?.valor)
                      .slice(0, 10)
                      .map(([k, v]) => {
                        const c = v as any
                        const baja = typeof c.confianza === 'number' && c.confianza < 0.8
                        return (
                          <div key={k} className={s.kv}>
                            <span>{(k.split('.')[1] || k).replace(/_/g, ' ')}</span>
                            <b className={baja ? s.low : ''} title={baja ? 'Confianza baja: verifícalo' : undefined}>{c.valor}</b>
                          </div>
                        )
                      })}
                    {!esSuelto(docVisor) && (
                      <a className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} style={{ marginTop: 10, width: '100%' }} target="_blank" rel="noopener noreferrer"
                        href={`${api}/api/docs/generar-solicitud/${docVisor.ticket_id}?parte_id=${docVisor.parte_id || ''}&doc_id=${docVisor.id}&formato=docx`}>
                        <Ic n="download" size={13} /> Transcripción (Word)
                      </a>
                    )}
                  </div>
                )}
                {docVisor.doc_tipos_config?.alerta_descripcion && (
                  <div>
                    <h5>Qué revisar</h5>
                    <div className={s.iaBox}>{docVisor.doc_tipos_config.alerta_descripcion}</div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* ── Clasificar ── */}
      {clasificando && (
        <div className={s.modalBack} onClick={() => !guardando && setClasificando(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={s.modalBody}>
              <h3>¿Qué documento es?</h3>
              <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clasificando.doc.nombre_archivo}</p>
              <div className={s.options}>
                {[...slots]
                  .sort((a, b) => Number(!!a.archivo_url) - Number(!!b.archivo_url))
                  .map(d => (
                    <button key={d.id} type="button"
                      className={`${s.option} ${clasificando.destino === d.id ? s.optionOn : ''}`}
                      onClick={() => setClasificando(c => c && { ...c, destino: d.id, ocupado: false })}>
                      <span style={{ minWidth: 0 }}>
                        <b style={{ fontWeight: 600 }}>{d.doc_tipos_config?.nombre}</b>
                        <span style={{ display: 'block', fontSize: '.72rem', color: '#6b6b6b' }}>{grupoParte(d).label}</span>
                      </span>
                      <small>{d.archivo_url ? 'Ya tiene archivo' : 'Vacío'}</small>
                    </button>
                  ))}
              </div>
              {clasificando.ocupado && (
                <p style={{ margin: '12px 0 0', color: '#b42318', fontWeight: 600 }}>
                  Ese documento ya tiene un archivo. Si continúas, se reemplaza.
                </p>
              )}
            </div>
            <div className={s.modalFoot}>
              <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => setClasificando(null)} disabled={guardando}>Cancelar</button>
              <button type="button" className={`${s.btn} ${clasificando.ocupado ? s.btnRed : s.btnDark}`}
                disabled={!clasificando.destino || guardando}
                onClick={() => clasificando.destino && clasificar(clasificando.doc, clasificando.destino, clasificando.ocupado)}>
                {guardando ? <span className={`${s.spin} ${clasificando.ocupado ? '' : s.spinLight}`} /> : null}
                {clasificando.ocupado ? 'Reemplazar' : 'Clasificar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast aviso={aviso} />
    </div>
  )
}