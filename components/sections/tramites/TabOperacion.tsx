'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

interface NuevoDoc {
  nombre:               string
  obligatorio:          boolean
  alerta_ia:            boolean
  descripcion_vigencia: string
  alerta_descripcion:   string
  para_rol:             string
}

interface Props {
  docs:     any[]
  partes:   any[]   // partes del trámite para el selector
  color:    string
  isAdmin:  boolean
  tramiteId: string
  onAdd:    (doc: any) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, campo: string, valor: any) => void
}

export default function TabOperacion({ docs, partes, color, isAdmin, tramiteId, onAdd, onDelete, onUpdate }: Props) {
  const supabase = createClient()
  const [modal,    setModal]    = useState(false)
  const [nuevoDoc, setNuevoDoc] = useState<NuevoDoc>({
    nombre: '', obligatorio: true, alerta_ia: false,
    descripcion_vigencia: 'Sin vencimiento', alerta_descripcion: '', para_rol: '',
  })

  async function agregarDoc() {
    if (!nuevoDoc.nombre.trim()) return
    const { data: nuevo } = await supabase.from('doc_tipos_config').insert({
      tramite_id:           tramiteId,
      nombre:               nuevoDoc.nombre,
      obligatorio:          nuevoDoc.obligatorio,
      para_rol:             'operacion',  // ← siempre 'operacion'
      alerta_ia:            nuevoDoc.alerta_ia,
      alerta_descripcion:   nuevoDoc.alerta_descripcion || null,
      descripcion_vigencia: nuevoDoc.descripcion_vigencia,
      vigencia_dias:        0,
      campos_ocr:           [],
      orden:                (docs.length || 0) + 1,
      // Guardamos la parte vinculada en datos_extra o en el nombre
      parte_vinculada:      nuevoDoc.para_rol || null,
    }).select().single()

    if (nuevo) {
      onAdd(nuevo)
      setModal(false)
      setNuevoDoc({ nombre: '', obligatorio: true, alerta_ia: false, descripcion_vigencia: 'Sin vencimiento', alerta_descripcion: '', para_rol: '' })
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAF8' }}>
        <div>
          <div className="text-[13px] font-bold" style={{ color: '#111' }}>
            Documentos de la operación
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
            Documentos del inmueble, contrato o acto jurídico
          </div>
        </div>
        {/* {isAdmin && (
          <button onClick={() => setModal(true)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
            style={{ background: `${color}15`, color }}>
            + Agregar
          </button>
        )} */}
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-8 text-[13px]" style={{ color: '#CCC' }}>
          Sin documentos de operación configurados
        </div>
      ) : (
        docs.sort((a: any, b: any) => a.orden - b.orden).map((doc: any) => (
          <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={onDelete} onUpdate={onUpdate} />
        ))
      )}
      {isAdmin && (
        <button
          onClick={() => setModal(true)}
          className="w-full py-3 rounded-2xl text-[13px] font-semibold cursor-pointer border-2 border-dashed transition-all m-3"
          style={{
            borderColor: `${color}40`,
            color,
            background:  `${color}05`,
            width:       'calc(100% - 24px)',
          }}>
          + Agregar documento de operación
        </button>
      )}

      {/* Modal agregar documento */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: '#111' }}>
              Agregar documento de operación
            </h3>
            <p className="text-[12px] mb-5" style={{ color: '#9C9890' }}>
              Documento del inmueble, contrato o acto jurídico
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
                  placeholder="Ej: Escritura de propiedad, Avalúo fiscal..."
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
                  placeholder="Ej: IA verifica fecha de vigencia, superficie catastral..."
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

              {/* Parte vinculada */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>
                  Parte vinculada (opcional)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button"
                    onClick={() => setNuevoDoc(prev => ({ ...prev, para_rol: '' }))}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border-none transition-all"
                    style={{
                      background: nuevoDoc.para_rol === '' ? '#111' : '#F3F4F6',
                      color:      nuevoDoc.para_rol === '' ? '#fff' : '#555',
                    }}>
                    Ninguna
                  </button>
                  {partes.map((p: any) => (
                    <button key={p.rol} type="button"
                      onClick={() => setNuevoDoc(prev => ({ ...prev, para_rol: p.rol }))}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border-none transition-all capitalize"
                      style={{
                        background: nuevoDoc.para_rol === p.rol ? (p.color || color) : '#F3F4F6',
                        color:      nuevoDoc.para_rol === p.rol ? '#fff' : '#555',
                      }}>
                      {p.rol.replace(/_/g, ' ')}
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
                  setModal(false)
                  setNuevoDoc({ nombre: '', obligatorio: true, alerta_ia: false, descripcion_vigencia: 'Sin vencimiento', alerta_descripcion: '', para_rol: '' })
                }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F0F0F0', color: '#666' }}>
                Cancelar
              </button>
              <button type="button" onClick={agregarDoc}
                disabled={!nuevoDoc.nombre.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{
                  background: nuevoDoc.nombre.trim() ? color : '#F0F0F0',
                  color:      nuevoDoc.nombre.trim() ? '#fff' : '#CCC',
                }}>
                Agregar documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}