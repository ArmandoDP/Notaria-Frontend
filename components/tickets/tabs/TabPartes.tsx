'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  partes:  any[]
  tramite: any
  ticketId: string
}

const ROL_LABELS: Record<string, string> = {
  comprador:        'Comprador',
  vendedor:         'Vendedor',
  poderdante:       'Poderdante',
  apoderado:        'Apoderado',
  deudor:           'Deudor',
  socio:            'Socio',
  testador:         'Testador',
  solicitante:      'Solicitante',
  representante:    'Representante',
  donante:          'Donante',
  donatario:        'Donatario',
  herederos:        'Herederos',
  liquidador:       'Liquidador',
  comparecientes:   'Compareciente',
}




export default function TabPartes({ partes, tramite, ticketId }: Props) {
  const supabase = createClient()
  const color    = tramite?.color_hex || '#666'

  const [parteEditando, setParteEditando] = useState<any | null>(null)
  const [form,          setForm]          = useState<any>({})
  const [guardando,     setGuardando]     = useState(false)
  const [partesState, setPartesState] = useState(partes)
  
  useEffect(() => {
    const channel = supabase
      .channel(`partes-${ticketId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'partes',
        filter: `ticket_id=eq.${ticketId}`,
      }, payload => {
        setPartesState(prev => prev.map(p =>
          p.id === payload.new.id ? { ...p, ...payload.new } : p
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticketId])

  useEffect(() => {
    // Polling cada 10 segundos para refrescar partes
    const intervalo = setInterval(async () => {
      const { data } = await supabase
        .from('partes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('orden')
      if (data) setPartesState(data)
    }, 10000)

    return () => clearInterval(intervalo)
  }, [ticketId])

  function abrirModal(parte: any) {
    setParteEditando(parte)
    setForm({
      nombre_completo: parte.nombre_completo || '',
      curp:            parte.curp            || '',
      rfc:             parte.rfc             || '',
      telefono:        parte.telefono        || '',
      email:           parte.email           || '',
      es_extranjero:   parte.es_extranjero   || false,
      pasaporte:       parte.pasaporte       || '',
      residencia:      parte.residencia      || '',
    })
  }

  async function guardar() {
    if (!parteEditando) return
    setGuardando(true)
    await supabase.from('partes').update(form).eq('id', parteEditando.id)
    setPartesState(prev => prev.map(p => p.id === parteEditando.id ? { ...p, ...form } : p))
    setGuardando(false)
    setParteEditando(null)
  }

  const CAMPOS = [
    { field: 'nombre_completo', label: 'Nombre completo',     placeholder: 'Nombre y apellidos', col: 2 },
    { field: 'curp',            label: 'CURP',                placeholder: 'XXXX000000XXXXXX00' },
    { field: 'rfc',             label: 'RFC',                 placeholder: 'XXXX000000XXX' },
    { field: 'telefono',        label: 'Teléfono',            placeholder: '+52 477 000 0000' },
    { field: 'email',           label: 'Correo electrónico',  placeholder: 'correo@ejemplo.com' },
  ]

  return (
    <>
      <div className="flex flex-col gap-3">
        {partesState.map((parte: any, i: number) => {
          const tienedatos = parte.nombre_completo || parte.telefono || parte.curp
          return (
            <div key={parte.id} className="p-4 rounded-2xl bg-white"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: color }}>
                    {i + 1}
                  </div>
                  <span className="text-[13px] font-bold capitalize" style={{ color: '#111' }}>
                    {ROL_LABELS[parte.rol] || parte.rol.replace(/_/g, ' ')}
                  </span>
                  {!tienedatos && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#FEF3C7', color: '#92400E' }}>
                      Sin datos
                    </span>
                  )}
                </div>
                <button onClick={() => abrirModal(parte)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer border-none transition-all"
                  style={{ background: `${color}15`, color }}>
                  ✎ Editar
                </button>
              </div>

              {tienedatos ? (
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  {parte.nombre_completo && (
                    <div className="col-span-2">
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9C9890' }}>Nombre</div>
                      <div className="font-medium" style={{ color: '#111' }}>{parte.nombre_completo}</div>
                    </div>
                  )}
                  {parte.curp && (
                    <div>
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9C9890' }}>CURP</div>
                      <div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.curp}</div>
                    </div>
                  )}
                  {parte.rfc && (
                    <div>
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9C9890' }}>RFC</div>
                      <div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.rfc}</div>
                    </div>
                  )}
                  {parte.telefono && (
                    <div>
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9C9890' }}>Teléfono</div>
                      <div style={{ color: '#111' }}>{parte.telefono}</div>
                    </div>
                  )}
                  {parte.email && (
                    <div>
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9C9890' }}>Correo</div>
                      <div style={{ color: '#111' }}>{parte.email}</div>
                    </div>
                  )}
                  {parte.es_extranjero && (
                    <div className="col-span-2 mt-1 px-3 py-2 rounded-xl"
                      style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                      <div className="text-[11px] font-semibold mb-1" style={{ color }}>🌍 Extranjero</div>
                      <div className="grid grid-cols-2 gap-2">
                        {parte.pasaporte && (
                          <div>
                            <div className="text-[10px]" style={{ color: '#9C9890' }}>Pasaporte</div>
                            <div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.pasaporte}</div>
                          </div>
                        )}
                        {parte.residencia && (
                          <div>
                            <div className="text-[10px]" style={{ color: '#9C9890' }}>Residencia/FM</div>
                            <div className="font-mono text-[11px]" style={{ color: '#111' }}>{parte.residencia}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[12px] py-2" style={{ color: '#9C9890' }}>
                  Sin datos registrados — el cliente puede completarlos desde su link de carga
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal editar parte */}
      {parteEditando && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setParteEditando(null)}>

          <div className="rounded-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-black"
                  style={{ background: color }}>
                  {ROL_LABELS[parteEditando.rol]?.slice(0, 2) || parteEditando.rol.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[14px] font-bold" style={{ color: '#111' }}>
                    {ROL_LABELS[parteEditando.rol] || parteEditando.rol.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px]" style={{ color: '#9C9890' }}>Editar datos de la parte</div>
                </div>
              </div>
              <button onClick={() => setParteEditando(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none text-[12px]"
                style={{ background: '#F3F4F6', color: '#666' }}>
                ✕
              </button>
            </div>

            {/* Formulario */}
            <div className="px-6 py-4 flex flex-col gap-3">

              {CAMPOS.map(campo => (
                <div key={campo.field} className={campo.col === 2 ? 'col-span-2' : ''}>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>
                    {campo.label}
                  </label>
                  <input
                    type="text"
                    value={form[campo.field] || ''}
                    onChange={e => setForm((prev: any) => ({ ...prev, [campo.field]: e.target.value }))}
                    placeholder={campo.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  />
                </div>
              ))}

              {/* Checkbox extranjero */}
              <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                <div
                  onClick={() => setForm((prev: any) => ({ ...prev, es_extranjero: !prev.es_extranjero }))}
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
                  style={{
                    background: form.es_extranjero ? color : '#F3F4F6',
                    border:     form.es_extranjero ? `2px solid ${color}` : '2px solid #D1D5DB',
                  }}>
                  {form.es_extranjero && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-[12.5px] font-medium" style={{ color: '#555' }}>Es extranjero</span>
              </label>

              {form.es_extranjero && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Pasaporte</label>
                    <input type="text" value={form.pasaporte || ''}
                      onChange={e => setForm((prev: any) => ({ ...prev, pasaporte: e.target.value }))}
                      placeholder="AB123456"
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                      style={{ background: '#F7F7F5', border: `1px solid ${color}40`, color: '#111' }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Residencia / FM</label>
                    <input type="text" value={form.residencia || ''}
                      onChange={e => setForm((prev: any) => ({ ...prev, residencia: e.target.value }))}
                      placeholder="Número migratorio"
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                      style={{ background: '#F7F7F5', border: `1px solid ${color}40`, color: '#111' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setParteEditando(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F3F4F6', color: '#444' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: guardando ? '#F3F4F6' : color, color: guardando ? '#9CA3AF' : '#fff', boxShadow: guardando ? 'none' : `0 4px 12px ${color}40` }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}