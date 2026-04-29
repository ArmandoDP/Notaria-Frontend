// ← docs de operación/inmueble

import DocRow from './DocRow'

interface Props {
  docs:    any[]
  color:   string
  isAdmin: boolean
  onAdd:   () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, campo: string, valor: any) => void
}

export default function TabOperacion({ docs, color, isAdmin, onAdd, onDelete, onUpdate }: Props) {
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
            Documentos del inmueble, contrato o acto jurídico — no son personales de ninguna parte
          </div>
        </div>
        {isAdmin && (
          <button onClick={onAdd}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer border-none"
            style={{ background: `${color}15`, color }}>
            + Agregar
          </button>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-8 text-[13px]" style={{ color: '#CCC' }}>
          Sin documentos de operación configurados para este trámite
        </div>
      ) : (
        docs.sort((a: any, b: any) => a.orden - b.orden).map((doc: any) => (
          <DocRow
            key={doc.id}
            doc={doc}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))
      )}
    </div>
  )
}