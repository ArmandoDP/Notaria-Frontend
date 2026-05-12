'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ALERTA_CONFIG, VIGENCIA_CONFIG } from './DocRow'
import DocRow from './DocRow'

const VIGENCIAS = [
  'Sin vencimiento', 'Vigente', 'Mes en curso',
  'No mayor a 1 mes', 'No mayor a 2 meses', 'No mayor a 3 meses',
  'No mayor a 3 meses si no señala régimen',
  'No mayor a 6 meses', 'No mayor a 30 días',
  'Al corriente', 'Al corriente al mes de firma',
  'Quincena en curso', 'Último recibo pagado',
  'Debidamente autorizados', 'Activo',
]

const COLORES = [
  '#1B5FA5','#1A6B3C','#991B1B','#92400E','#5B21B6',
  '#0F5C5C','#374151','#CC0000','#854F0B','#1B4F72',
  '#7C3AED','#0F5C5C','#117A65','#784212','#1A5276',
]

interface Parte {
  rol:                   string
  descripcion:           string
  es_pm:                 boolean
  es_obligatorio:        boolean
  avatar:                string
  color:                 string
  es_extranjero_posible: boolean
}

interface NuevoDoc {
  nombre:               string
  obligatorio:          boolean
  alerta_ia:            boolean
  descripcion_vigencia: string
  alerta_descripcion:   string
}

interface Props {
  partes:       Parte[]
  docTipos:     any[]
  tramiteId:    string
  colorBase:    string
  isAdmin:      boolean
  onDeleteDoc:  (id: string) => void
  onUpdateDoc:  (id: string, campo: string, valor: any) => void
  onAddDoc:     (nuevoDoc: any) => void
  onSavePartes: (partes: Parte[]) => void
}

export default function TabPartes({
  partes, docTipos, tramiteId, colorBase, isAdmin,
  onDeleteDoc, onUpdateDoc, onAddDoc, onSavePartes
}: Props) {
  const supabase = createClient()

  const [modalParte,    setModalParte]    = useState(false)
  const [editandoParte, setEditandoParte] = useState<number | null>(null)
  const [modalDoc,      setModalDoc]      = useState<string | null>(null) // rol de la parte
  const [nuevaParte,    setNuevaParte]    = useState<Parte>({
    rol: '', descripcion: '', es_pm: false, es_obligatorio: true,
    avatar: '', color: colorBase, es_extranjero_posible: false,
  })
  const [nuevoDoc, setNuevoDoc] = useState<NuevoDoc>({
    nombre: '', obligatorio: true, alerta_ia: false,
    descripcion_vigencia: 'Sin vencimiento', alerta_descripcion: '',
  })

  async function agregarDoc(rol: string) {
    const docsDeEsteRol = docTipos.filter((d: any) => d.para_rol === rol)
    const { data: nuevo } = await supabase.from('doc_tipos_config').insert({
      tramite_id:           tramiteId,
      nombre:               nuevoDoc.nombre || 'Nuevo documento',
      obligatorio:          nuevoDoc.obligatorio,
      para_rol:             rol,
      alerta_ia:            nuevoDoc.alerta_ia,
      alerta_descripcion:   nuevoDoc.alerta_descripcion || null,
      descripcion_vigencia: nuevoDoc.descripcion_vigencia,
      vigencia_dias:        0,
      campos_ocr:           [],
      orden:                (docsDeEsteRol.length || 0) + 1,
    }).select().single()
    if (nuevo) {
      onAddDoc(nuevo)
      setModalDoc(null)
      setNuevoDoc({ nombre: '', obligatorio: true, alerta_ia: false, descripcion_vigencia: 'Sin vencimiento', alerta_descripcion: '' })
    }
  }

  function guardarNuevaParte() {
    if (!nuevaParte.rol.trim()) return
    const avatar = nuevaParte.avatar || nuevaParte.rol.slice(0, 2).toUpperCase()
    onSavePartes([...partes, { ...nuevaParte, avatar }])
    setModalParte(false)
    setNuevaParte({ rol: '', descripcion: '', es_pm: false, es_obligatorio: true, avatar: '', color: colorBase, es_extranjero_posible: false })
  }

  function eliminarParte(i: number) {
    if (!confirm(`¿Eliminar la parte "${partes[i].rol}"?`)) return
    onSavePartes(partes.filter((_, idx) => idx !== i))
  }

  function actualizarParte(i: number, campo: keyof Parte, valor: any) {
    const n = [...partes]
    n[i] = { ...n[i], [campo]: valor }
    onSavePartes(n)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      {isAdmin && (
        <div className="flex justify-between items-center">
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>
            {partes.length} parte{partes.length !== 1 ? 's' : ''} configurada{partes.length !== 1 ? 's' : ''}
          </div>
          <button onClick={() => setModalParte(true)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
            style={{ background: `${colorBase}15`, color: colorBase }}>
            + Agregar parte
          </button>
        </div>
      )}

      {partes.length === 0 && (
        <div className="text-center py-8 text-[13px] bg-white rounded-2xl"
          style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
          Sin partes configuradas
        </div>
      )}

      {partes.map((parte, i) => {
        const color        = parte.color || colorBase
        const avatar       = parte.avatar || parte.rol.slice(0, 2).toUpperCase()
        const docsPartes   = docTipos.filter((d: any) => d.para_rol === parte.rol)
        const obligatorios = docsPartes.filter((d: any) => d.obligatorio).length
        const opcionales   = docsPartes.filter((d: any) => !d.obligatorio).length
        const editando     = editandoParte === i

        return (
          <div key={i} className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Header parte */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ background: `${color}10`, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                  style={{ background: color }}>
                  {avatar}
                </div>
                <div>
                  <div className="text-[14px] font-bold capitalize" style={{ color: '#111' }}>
                    {parte.rol.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px]" style={{ color: '#9C9890' }}>
                    {parte.descripcion}
                    {` · ${parte.es_pm ? 'Persona moral' : 'Persona física'}`}
                    {` · ${parte.es_obligatorio ? 'Obligatoria' : 'Opcional'}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {docsPartes.length > 0 && (
                  <span className="text-[11px]" style={{ color: '#9C9890' }}>
                    {obligatorios} obl. · {opcionales} opc.
                  </span>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditandoParte(editando ? null : i)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                      style={{ background: editando ? `${color}20` : '#F3F4F6', color: editando ? color : '#666' }}>
                      {editando ? 'Cerrar' : 'Editar'}
                    </button>
                    {/* <button onClick={() => { setModalDoc(parte.rol) }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                      style={{ background: `${color}20`, color }}>
                      + Agregar Documento
                    </button> */}
                    <button onClick={() => eliminarParte(i)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                      style={{ background: '#FEE2E2', color: '#991B1B' }}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel edición parte */}
            {editando && isAdmin && (
              <div className="px-5 py-4 flex flex-col gap-3"
                style={{ background: '#FAFAF8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Rol</label>
                    <input defaultValue={parte.rol}
                      onBlur={e => actualizarParte(i, 'rol', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Avatar (2 letras)</label>
                    <input defaultValue={parte.avatar} maxLength={2}
                      onBlur={e => actualizarParte(i, 'avatar', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl text-[13px] font-bold outline-none text-center font-mono"
                      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Descripción</label>
                  <input defaultValue={parte.descripcion}
                    onBlur={e => actualizarParte(i, 'descripcion', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Tipo</label>
                    <select value={parte.es_pm ? 'moral' : 'fisica'}
                      onChange={e => actualizarParte(i, 'es_pm', e.target.value === 'moral')}
                      className="w-full px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
                      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                      <option value="fisica">Persona física</option>
                      <option value="moral">Persona moral</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Obligatoria</label>
                    <select value={parte.es_obligatorio ? 'si' : 'no'}
                      onChange={e => actualizarParte(i, 'es_obligatorio', e.target.value === 'si')}
                      className="w-full px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
                      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Extranjero</label>
                    <select value={parte.es_extranjero_posible ? 'si' : 'no'}
                      onChange={e => actualizarParte(i, 'es_extranjero_posible', e.target.value === 'si')}
                      className="w-full px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
                      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORES.map(c => (
                      <button key={c} type="button" onClick={() => actualizarParte(i, 'color', c)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-none transition-all"
                        style={{
                          background: c,
                          boxShadow:  parte.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                          transform:  parte.color === c ? 'scale(1.2)' : 'scale(1)',
                        }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Aviso extranjero */}
            {parte.es_extranjero_posible && (
              <div className="mx-4 mt-3 p-3 rounded-xl"
                style={{ background: '#FEF3C7', border: '1px solid rgba(240,180,41,0.4)' }}>
                <div className="text-[11px] font-bold mb-1" style={{ color: '#92400E' }}>
                  ⚠ Si la parte es EXTRANJERA — documentos adicionales:
                </div>
                <div className="text-[11.5px]" style={{ color: '#92400E' }}>• Forma migratoria original vigente</div>
                <div className="text-[11.5px]" style={{ color: '#92400E' }}>• Permiso y/o convenio expedido por la SRE con anexos</div>
              </div>
            )}

            {/* Docs */}
            {docsPartes.length > 0 ? (
              <div className="px-2 py-3">
                <div className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: '#9C9890' }}>
                  Documentos personales requeridos
                </div>
                {docsPartes.sort((a: any, b: any) => a.orden - b.orden).map((doc: any) => (
                  <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={onDeleteDoc} onUpdate={onUpdateDoc} />
                ))}
                {isAdmin && (
                  <button
                    onClick={() => setModalDoc(parte.rol)}
                    className="w-full py-2.5 rounded-xl text-[12px] font-semibold cursor-pointer border-2 border-dashed transition-all mx-2 mt-1"
                    style={{
                      borderColor: `${color}40`,
                      color,
                      background:  `${color}05`,
                      width:       'calc(100% - 16px)',
                    }}>
                    + Agregar documento
                  </button>
                )}
              </div>
            ) : (
              <div className="px-5 py-4 text-[12px] text-center" style={{ color: '#CCC' }}>
                Sin documentos — usa "+ Doc" para agregar
              </div>
            )}
          </div>
        )
      })}

      {/* ── MODAL AGREGAR DOCUMENTO ── */}
      {modalDoc && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: '#111' }}>
              Agregar documento
            </h3>
            <p className="text-[12px] mb-5" style={{ color: '#9C9890' }}>
              Para la parte: <strong className="capitalize">{modalDoc.replace(/_/g, ' ')}</strong>
            </p>

            <div className="flex flex-col gap-4">

              {/* Nombre */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Nombre del documento *
                </label>
                <input
                  value={nuevoDoc.nombre}
                  onChange={e => setNuevoDoc(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: INE vigente, Acta de nacimiento..."
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Descripción / qué verifica la IA
                </label>
                <textarea
                  value={nuevoDoc.alerta_descripcion}
                  onChange={e => setNuevoDoc(prev => ({ ...prev, alerta_descripcion: e.target.value }))}
                  placeholder="Ej: IA verifica fecha de vigencia..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                />
              </div>

              {/* Vigencia */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  Vigencia requerida
                </label>
                <div className="flex flex-wrap gap-2">
                  {VIGENCIAS.map(v => (
                    <button key={v} type="button"
                      onClick={() => setNuevoDoc(prev => ({ ...prev, descripcion_vigencia: v }))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border-none transition-all"
                      style={{
                        background: nuevoDoc.descripcion_vigencia === v ? '#111' : '#F3F4F6',
                        color:      nuevoDoc.descripcion_vigencia === v ? '#fff' : '#555',
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Obligatorio */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  ¿Es obligatorio?
                </label>
                <div className="flex gap-2">
                  {[
                    { val: true,  label: 'Obligatorio', bg: '#FEE2E2', color: '#991B1B' },
                    { val: false, label: 'Opcional',     bg: '#EDE9FE', color: '#4C1D95' },
                  ].map(o => (
                    <button key={String(o.val)} type="button"
                      onClick={() => setNuevoDoc(prev => ({ ...prev, obligatorio: o.val }))}
                      className="flex-1 py-2 rounded-xl text-[12px] font-bold cursor-pointer border-none transition-all"
                      style={{
                        background: nuevoDoc.obligatorio === o.val ? o.bg : '#F3F4F6',
                        color:      nuevoDoc.obligatorio === o.val ? o.color : '#9CA3AF',
                      }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de alerta */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  Tipo de verificación
                </label>
                <div className="flex gap-2">
                  {[
                    { val: true,  label: 'IA automática', bg: '#E6F1FB', color: '#185FA5' },
                    { val: false, label: 'Manual',         bg: '#F3F4F6', color: '#6B7280' },
                  ].map(o => (
                    <button key={String(o.val)} type="button"
                      onClick={() => setNuevoDoc(prev => ({ ...prev, alerta_ia: o.val }))}
                      className="flex-1 py-2 rounded-xl text-[12px] font-bold cursor-pointer border-none transition-all"
                      style={{
                        background: nuevoDoc.alerta_ia === o.val ? o.bg : '#F3F4F6',
                        color:      nuevoDoc.alerta_ia === o.val ? o.color : '#9CA3AF',
                      }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button"
                onClick={() => {
                  setModalDoc(null)
                  setNuevoDoc({ nombre: '', obligatorio: true, alerta_ia: false, descripcion_vigencia: 'Sin vencimiento', alerta_descripcion: '' })
                }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F0F0F0', color: '#666' }}>
                Cancelar
              </button>
              <button type="button"
                onClick={() => agregarDoc(modalDoc)}
                disabled={!nuevoDoc.nombre.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{
                  background: nuevoDoc.nombre.trim() ? colorBase : '#F0F0F0',
                  color:      nuevoDoc.nombre.trim() ? '#fff' : '#CCC',
                }}>
                Agregar documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AGREGAR PARTE ── */}
      {modalParte && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-[16px] font-bold mb-4" style={{ color: '#111' }}>
              Agregar parte / compareciente
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Nombre del rol *</label>
                <input value={nuevaParte.rol}
                  onChange={e => setNuevaParte(prev => ({ ...prev, rol: e.target.value }))}
                  placeholder="Ej: comprador, vendedor, socio..."
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Descripción</label>
                <input value={nuevaParte.descripcion}
                  onChange={e => setNuevaParte(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Ej: Persona que adquiere el inmueble"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Tipo</label>
                  <select value={nuevaParte.es_pm ? 'moral' : 'fisica'}
                    onChange={e => setNuevaParte(prev => ({ ...prev, es_pm: e.target.value === 'moral' }))}
                    className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none cursor-pointer"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                    <option value="fisica">Persona física</option>
                    <option value="moral">Persona moral</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Obligatoria</label>
                  <select value={nuevaParte.es_obligatorio ? 'si' : 'no'}
                    onChange={e => setNuevaParte(prev => ({ ...prev, es_obligatorio: e.target.value === 'si' }))}
                    className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none cursor-pointer"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Extranjero posible</label>
                <select value={nuevaParte.es_extranjero_posible ? 'si' : 'no'}
                  onChange={e => setNuevaParte(prev => ({ ...prev, es_extranjero_posible: e.target.value === 'si' }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none cursor-pointer"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(c => (
                    <button key={c} type="button"
                      onClick={() => setNuevaParte(prev => ({ ...prev, color: c }))}
                      className="w-7 h-7 rounded-lg cursor-pointer border-none transition-all"
                      style={{
                        background: c,
                        boxShadow:  nuevaParte.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                        transform:  nuevaParte.color === c ? 'scale(1.2)' : 'scale(1)',
                      }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalParte(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F0F0F0', color: '#666' }}>
                Cancelar
              </button>
              <button type="button" onClick={guardarNuevaParte}
                disabled={!nuevaParte.rol.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{
                  background: nuevaParte.rol.trim() ? colorBase : '#F0F0F0',
                  color:      nuevaParte.rol.trim() ? '#fff' : '#CCC',
                }}>
                Agregar parte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}