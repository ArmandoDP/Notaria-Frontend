// ← partes con docs internos

import DocRow from './DocRow'
import { createClient } from '@/lib/supabase/client'

interface Props {
  partes:      any[]
  docTipos:    any[]
  tramiteId:   string
  colorBase:   string
  isAdmin:     boolean
  onDeleteDoc: (id: string) => void
  onUpdateDoc: (id: string, campo: string, valor: any) => void
  onAddDoc:    (nuevoDoc: any) => void
}

export default function TabPartes({ partes, docTipos, tramiteId, colorBase, isAdmin, onDeleteDoc, onUpdateDoc, onAddDoc }: Props) {
  const supabase = createClient()

  async function agregarDocAParte(rol: string) {
    const docsDeEsteRol = docTipos.filter((d: any) => d.para_rol === rol)
    const { data: nuevo } = await supabase.from('doc_tipos_config').insert({
      tramite_id:          tramiteId,
      nombre:              'Nuevo documento',
      obligatorio:         true,
      para_rol:            rol,
      alerta_ia:           false,
      descripcion_vigencia: 'Sin vencimiento',
      vigencia_dias:       0,
      campos_ocr:          [],
      orden:               (docsDeEsteRol.length || 0) + 1,
    }).select().single()
    if (nuevo) onAddDoc(nuevo)
  }

  if (partes.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] bg-white rounded-2xl"
        style={{ border: '1px solid rgba(0,0,0,0.06)', color: '#CCC' }}>
        Sin partes configuradas
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {partes.map((parte: any, i: number) => {
        const color        = parte.color || colorBase
        const avatar       = parte.avatar || parte.rol.slice(0, 2).toUpperCase()
        const docsPartes   = docTipos.filter((d: any) => d.para_rol === parte.rol)
        const obligatorios = docsPartes.filter((d: any) => d.obligatorio).length
        const opcionales   = docsPartes.filter((d: any) => !d.obligatorio).length

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
                    {parte.es_pm !== undefined && ` · ${parte.es_pm ? 'Persona moral' : 'Persona física'}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {docsPartes.length > 0 && (
                  <span className="text-[11px]" style={{ color: '#9C9890' }}>
                    {obligatorios} obl. · {opcionales} opc.
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => agregarDocAParte(parte.rol)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-all"
                    style={{ background: `${color}20`, color }}>
                    + Agregar Documento
                  </button>
                )}
              </div>
            </div>

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

            {/* Documentos */}
            {docsPartes.length > 0 ? (
              <div className="px-2 py-3">
                <div className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: '#9C9890' }}>
                  Documentos personales requeridos
                </div>
                {docsPartes.sort((a: any, b: any) => a.orden - b.orden).map((doc: any) => (
                  <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={onDeleteDoc} onUpdate={onUpdateDoc} />
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-[12px] text-center" style={{ color: '#CCC' }}>
                Sin documentos — usa + Doc para agregar
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}