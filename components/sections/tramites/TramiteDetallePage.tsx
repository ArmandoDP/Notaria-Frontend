// ← contenedor principal (solo layout + tabs)

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TramiteHeader    from './TramiteHeader'
import TabPreguntas     from './TabPreguntas'
import TabPartes        from './TabPartes'
import TabOperacion     from './TabOperacion'
import TabSLA           from './TabSLA'
import TabRiesgos       from './TabRiesgos'
import TabConfiguracion from './TabConfiguracion'

const TABS = [
  { id: 'preguntas',  label: 'Preguntas clave'     },
  { id: 'partes',     label: 'Partes y documentos' },
  { id: 'operacion',  label: 'Docs de operación'   },
  { id: 'sla',        label: 'SLA por etapa'        },
  { id: 'riesgos',    label: 'Riesgos y alertas'   },
  { id: 'config',     label: 'Configuración'        },
]

export default function TramiteDetallePage({ tramite, areas }: { tramite: any, areas: any[] }) {
  const [tab,   setTab]   = useState('preguntas')
  const [saved, setSaved] = useState(false)
  const [data,  setData]  = useState(tramite)
  const supabase = createClient()
  const isAdmin  = true

  async function guardar(campo: string, valor: any) {
    if (!isAdmin) return
    await supabase.from('tramites_config').update({ [campo]: valor }).eq('id', data.id)
    setData((prev: any) => ({ ...prev, [campo]: valor }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function agregarDocumento() {
    const { data: nuevo } = await supabase.from('doc_tipos_config').insert({
      tramite_id:  data.id,
      nombre:      'Nuevo documento',
      obligatorio: true,
      alerta_ia:   false,
      campos_ocr:  [],
      orden:       (data.doc_tipos_config?.length || 0) + 1,
    }).select().single()
    if (nuevo) setData((prev: any) => ({
      ...prev,
      doc_tipos_config: [...(prev.doc_tipos_config || []), nuevo]
    }))
  }

  async function eliminarDocumento(docId: string) {
  // Verificar si tiene documentos en tickets activos
  const { data: docsEnTickets } = await supabase
    .from('documentos')
    .select('id')
    .eq('doc_tipo_id', docId)
    .limit(1)

  if (docsEnTickets && docsEnTickets.length > 0) {
    // Tiene tickets — marcar como inactivo en vez de eliminar
    await supabase.from('doc_tipos_config')
      .update({ activo: false })
      .eq('id', docId)
  } else {
    // Sin tickets — eliminar directo
    await supabase.from('doc_tipos_config')
      .delete()
      .eq('id', docId)
  }

  setData((prev: any) => ({
    ...prev,
    doc_tipos_config: prev.doc_tipos_config.filter((d: any) => d.id !== docId)
  }))
}

  async function actualizarDocumento(docId: string, campo: string, valor: any) {
    await supabase.from('doc_tipos_config').update({ [campo]: valor }).eq('id', docId)
    setData((prev: any) => ({
      ...prev,
      doc_tipos_config: prev.doc_tipos_config.map((d: any) =>
        d.id === docId ? { ...d, [campo]: valor } : d
      )
    }))
  }

  const docTipos: any[] = (data.doc_tipos_config || []).filter((d: any) => d.activo !== false)
  const docsOperacion: any[] = docTipos.filter((d: any) =>
    !d.para_rol || d.para_rol === 'inmueble' || d.para_rol === 'operacion'
  )

  return (
    <div className="max-w-4xl mx-auto">

      <TramiteHeader
        data={data}
        isAdmin={isAdmin}
        saved={saved}
        onSave={guardar}
      />

      {/* Tabs */}
      <div className="flex mb-4 bg-white rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-[11.5px] font-medium transition-all cursor-pointer border-none"
            style={{
              background:   tab === t.id ? data.color_hex : 'transparent',
              color:        tab === t.id ? '#fff' : '#666',
              borderBottom: `2px solid ${tab === t.id ? data.color_hex : 'transparent'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      {tab === 'preguntas' && (
        <TabPreguntas
          preguntas={data.preguntas_clave || []}
          color={data.color_hex}
          isAdmin={isAdmin}
          onSave={v => guardar('preguntas_clave', v)}
        />
      )}

      {tab === 'partes' && (
        <TabPartes
          key={data.doc_tipos_config?.length}  // ← esto fuerza re-render cuando cambia la cantidad
          partes={data.requiere_partes || []}
          docTipos={docTipos}
          tramiteId={data.id}
          colorBase={data.color_hex}
          isAdmin={isAdmin}
          onDeleteDoc={eliminarDocumento}
          onUpdateDoc={actualizarDocumento}
          onAddDoc={doc => setData((prev: any) => ({
            ...prev,
            doc_tipos_config: [...(prev.doc_tipos_config || []), doc]
          }))}
        />
      )}

      {tab === 'operacion' && (
        <TabOperacion
          docs={docsOperacion}
          color={data.color_hex}
          isAdmin={isAdmin}
          onAdd={agregarDocumento}
          onDelete={eliminarDocumento}
          onUpdate={actualizarDocumento}
        />
      )}

      {tab === 'sla' && (
        <TabSLA
          etapas={data.sla_etapas || []}
          color={data.color_hex}
          isAdmin={isAdmin}
          onSave={v => guardar('sla_etapas', v)}
        />
      )}

      {tab === 'riesgos' && (
        <TabRiesgos riesgos={data.riesgos || []} />
      )}

      {tab === 'config' && (
        <TabConfiguracion
          data={data}
          areas={areas}
          isAdmin={isAdmin}
          onSave={guardar}
        />
      )}
    </div>
  )
}