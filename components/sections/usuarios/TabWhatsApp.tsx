'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  areas:    any[]
  onUpdate: (areas: any[]) => void
}

export default function TabWhatsApp({ areas, onUpdate }: Props) {
  const supabase  = createClient()
  const [editando, setEditando] = useState<string | null>(null)
  const [valores,  setValores]  = useState<Record<string, { numero: string, friendly: string }>>({})

  function iniciarEdicion(area: any) {
    setEditando(area.id)
    setValores(prev => ({
      ...prev,
      [area.id]: {
        numero:   area.numero_twilio || '',
        friendly: area.friendly_name || `Notaría 3 · ${area.nombre}`,
      }
    }))
  }

  async function guardar(areaId: string) {
    const vals = valores[areaId]
    if (!vals) return

    await supabase.from('areas').update({
      numero_twilio: vals.numero,
      friendly_name: vals.friendly,
    }).eq('id', areaId)

    onUpdate(areas.map(a =>
      a.id === areaId
        ? { ...a, numero_twilio: vals.numero, friendly_name: vals.friendly }
        : a
    ))
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Info box */}
      <div className="px-4 py-3 rounded-2xl text-[12px] leading-relaxed"
        style={{ background: '#E6F1FB', border: '1px solid rgba(27,95,165,0.2)', color: '#0C447C' }}>
        <strong>Cómo funciona:</strong> Cada área tiene un número de WhatsApp en Twilio. El backend identifica el área por el campo <code className="font-mono text-[11px] px-1 rounded" style={{ background: '#D4E8F8' }}>To</code> del payload. Actualiza los números reales cuando los compres en Twilio.
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: '#0C0C10' }}>
              {['#', 'Área', 'Número Twilio', 'Friendly name', 'Estado', 'Acción'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((area, i) => {
              const edit = editando === area.id
              const vals = valores[area.id]

              return (
                <tr key={area.id} className="hover:bg-gray-50 transition-all border-b last:border-b-0"
                  style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                  <td className="px-4 py-3 text-[12px] font-bold" style={{ color: area.color_hex }}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: area.color_hex }} />
                      <span className="text-[13px] font-medium" style={{ color: '#111' }}>{area.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {edit ? (
                      <input value={vals?.numero || ''}
                        onChange={e => setValores(p => ({ ...p, [area.id]: { ...p[area.id], numero: e.target.value } }))}
                        className="px-2 py-1 rounded-lg text-[12px] font-mono outline-none"
                        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#1B5FA5', width: '160px' }}
                        placeholder="+52 461 100 0000" />
                    ) : (
                      <span className="text-[12px] font-mono" style={{ color: area.numero_twilio ? '#1B5FA5' : '#CCC' }}>
                        {area.numero_twilio || 'Sin número'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {edit ? (
                      <input value={vals?.friendly || ''}
                        onChange={e => setValores(p => ({ ...p, [area.id]: { ...p[area.id], friendly: e.target.value } }))}
                        className="px-2 py-1 rounded-lg text-[12px] outline-none"
                        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111', width: '180px' }} />
                    ) : (
                      <span className="text-[12px]" style={{ color: area.friendly_name ? '#333' : '#CCC' }}>
                        {area.friendly_name || `Notaría 3 · ${area.nombre}`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 inline-flex"
                      style={{
                        background: area.numero_twilio ? '#D1FAE5' : '#FEF3C7',
                        color:      area.numero_twilio ? '#065F46'  : '#92400E',
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: area.numero_twilio ? '#065F46' : '#92400E' }} />
                      {area.numero_twilio ? 'Configurado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {edit ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => guardar(area.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border-none"
                          style={{ background: '#111', color: '#fff' }}>
                          Guardar
                        </button>
                        <button onClick={() => setEditando(null)}
                          className="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border-none"
                          style={{ background: '#F3F4F6', color: '#666' }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => iniciarEdicion(area)}
                        className="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border-none"
                        style={{ background: '#F3F4F6', color: '#666' }}>
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Reglas */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'Regla: 1 número = 1 área = 1 equipo', text: 'Cada número pertenece a un área. Los usuarios de ese equipo comparten el número y ven las mismas conversaciones.' },
          { title: 'Regla: número = identificador del ticket', text: 'Cuando un cliente escribe, el backend busca un ticket activo con ese número. Si existe, el mensaje se vincula.' },
          { title: 'Excepción: notario y admin ven todo', text: 'El notario y admin pueden ver conversaciones de todas las áreas en modo lectura.', blue: true },
          { title: 'Excepción: recepción ve todas', text: 'Recepción puede ver el estado de todas las conversaciones. No puede responder por otros números.', blue: true },
        ].map((r, i) => (
          <div key={i} className="p-3 rounded-xl"
            style={{ background: r.blue ? '#E6F1FB' : '#F7F7F5', border: `1px solid ${r.blue ? 'rgba(27,95,165,0.15)' : 'rgba(0,0,0,0.04)'}` }}>
            <div className="text-[11.5px] font-bold mb-1" style={{ color: r.blue ? '#0C447C' : '#111' }}>{r.title}</div>
            <div className="text-[11px] leading-relaxed" style={{ color: '#666' }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}