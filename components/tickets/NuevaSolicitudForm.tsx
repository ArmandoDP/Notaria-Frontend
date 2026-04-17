'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CANALES = [
  { id: 'front_desk',   label: 'Front Desk',       icon: '🏢' },
  { id: 'whatsapp',     label: 'WhatsApp',          icon: '💬' },
  { id: 'telefono',     label: 'Teléfono',          icon: '📞' },
  { id: 'mail',         label: 'Correo',            icon: '✉️'  },
  { id: 'whatsapp_vip', label: 'WhatsApp VIP',      icon: '⭐' },
]

interface Parte {
  rol:             string
  nombre_completo: string
  curp:            string
  rfc:             string
  telefono:        string
  email:           string
  es_persona_moral: boolean
  datos_adicionales: Record<string, string>
}

export default function NuevaSolicitudForm({ tramites, areas }: { tramites: any[], areas: any[] }) {
  const router   = useRouter()
  const supabase = createClient()

  const [canal,      setCanal]      = useState('front_desk')
  const [tramiteId,  setTramiteId]  = useState('')
  const [areaId,     setAreaId]     = useState('')
  const [partes,     setPartes]     = useState<Parte[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const tramiteSeleccionado = tramites.find(t => t.id === tramiteId)

  function onTramiteChange(id: string) {
    setTramiteId(id)
    const t = tramites.find(t => t.id === id)
    if (!t) { setPartes([]); setAreaId(''); return }

    // Pre-seleccionar área default
    setAreaId(t.area_id_default || '')

    // Inicializar partes según configuración del trámite
    const partesConfig: any[] = t.requiere_partes || []
    const nuevasPartes = partesConfig
      .filter((p: any) => p.rol !== 'empresa' && p.rol !== 'inmueble')
      .map((p: any) => ({
        rol:              p.rol,
        nombre_completo:  '',
        curp:             '',
        rfc:              '',
        telefono:         '',
        email:            '',
        es_persona_moral: p.es_pm || false,
        datos_adicionales: {},
      }))
    setPartes(nuevasPartes)
  }

  function updateParte(index: number, field: keyof Parte, value: any) {
    setPartes(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function agregarParte() {
    const partesConfig: any[] = tramiteSeleccionado?.requiere_partes || []
    const rolRepetible = partesConfig.find((p: any) => p.rol === 'socio')
    if (!rolRepetible) return
    setPartes(prev => [...prev, {
      rol: rolRepetible.rol, nombre_completo: '', curp: '', rfc: '',
      telefono: '', email: '', es_persona_moral: false, datos_adicionales: {},
    }])
  }

  function quitarParte(index: number) {
    setPartes(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tramiteId || !areaId) { setError('Selecciona un trámite y área'); return }
    setLoading(true)
    setError('')

    try {
      // Calcular SLA
      const tramite  = tramites.find(t => t.id === tramiteId)
      const slaDias  = tramite?.sla_dias_total || 5
      const slaVence = new Date()
      slaVence.setDate(slaVence.getDate() + slaDias)

      // Generar número de ticket
      const numero = `N3-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      // Insertar ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          numero,
          tramite_id:   tramiteId,
          estado:       'nuevo',
          canal,
          area_id:      areaId,
          sla_vence_at: slaVence.toISOString(),
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      // Insertar partes
      for (let i = 0; i < partes.length; i++) {
        const p = partes[i]
        if (!p.nombre_completo && !p.telefono) continue
        await supabase.from('partes').insert({
          ticket_id:        ticket.id,
          rol:              p.rol,
          nombre_completo:  p.nombre_completo || null,
          curp:             p.curp || null,
          rfc:              p.rfc || null,
          telefono:         p.telefono || null,
          email:            p.email || null,
          es_persona_moral: p.es_persona_moral,
          datos_adicionales: p.datos_adicionales,
          orden:            i,
        })
      }

      // Insertar checklist de documentos
      const docTipos = tramite?.doc_tipos_config || []
      for (const doc of docTipos) {
        await supabase.from('documentos').insert({
          ticket_id:   ticket.id,
          doc_tipo_id: doc.id,
          estado:      'pendiente',
        })
      }

      // Registrar evento
      await supabase.from('ticket_eventos').insert({
        ticket_id:   ticket.id,
        tipo:        'estado_cambio',
        descripcion: `Ticket creado — canal: ${canal}`,
      })

      router.push(`/tickets/${ticket.id}`)

    } catch (err: any) {
      setError(err.message || 'Error al crear el ticket')
      setLoading(false)
    }
  }

  const rolLabels: Record<string, string> = {
    comprador:   'Comprador',
    vendedor:    'Vendedor',
    poderdante:  'Poderdante',
    apoderado:   'Apoderado',
    deudor:      'Deudor',
    socio:       'Socio',
    testador:    'Testador',
    solicitante: 'Solicitante',
    representante: 'Representante',
  }

  const tieneSocios = tramiteSeleccionado?.requiere_partes?.some((p: any) => p.rol === 'socio')

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#111' }}>
          Nueva solicitud
        </h1>
        <p className="text-[13px] mt-1" style={{ color: '#9C9890' }}>
          Completa los datos para crear el ticket
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Canal */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: '#9C9890' }}>
            Canal de entrada
          </div>
          <div className="flex gap-2 flex-wrap">
            {CANALES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCanal(c.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer border-none"
                style={{
                  background: canal === c.id ? '#111' : 'rgba(0,0,0,0.04)',
                  color:      canal === c.id ? '#fff' : '#666',
                  boxShadow:  canal === c.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trámite y área */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: '#9C9890' }}>
            Tipo de trámite
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Trámite</label>
              <select
                value={tramiteId}
                onChange={e => onTramiteChange(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
                style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
              >
                <option value="">Seleccionar trámite...</option>
                {tramites.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>Área responsable</label>
              <select
                value={areaId}
                onChange={e => setAreaId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
                style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
              >
                <option value="">Seleccionar área...</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info del trámite */}
          {tramiteSeleccionado && (
            <div className="mt-3 px-4 py-3 rounded-xl text-[12px]"
              style={{ background: `${tramiteSeleccionado.color_hex}0F`, border: `1px solid ${tramiteSeleccionado.color_hex}22`, color: '#555' }}>
              <span className="font-semibold" style={{ color: tramiteSeleccionado.color_hex }}>
                SLA: {tramiteSeleccionado.sla_dias_total} días hábiles
              </span>
              {' · '}{tramiteSeleccionado.descripcion}
            </div>
          )}
        </div>

        {/* Partes */}
        {partes.length > 0 && (
          <div className="flex flex-col gap-3">
            {partes.map((parte, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 relative"
                style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: tramiteSeleccionado?.color_hex || '#666' }}>
                      {idx + 1}
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: '#111' }}>
                      {rolLabels[parte.rol] || parte.rol}
                    </span>
                  </div>
                  {parte.rol === 'socio' && partes.filter(p => p.rol === 'socio').length > 1 && (
                    <button type="button" onClick={() => quitarParte(idx)}
                      className="text-[11px] cursor-pointer border-none bg-transparent"
                      style={{ color: '#E24B4A' }}>
                      Quitar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: 'nombre_completo', label: 'Nombre completo', placeholder: 'Nombre y apellidos', col: 2 },
                    { field: 'curp',            label: 'CURP',            placeholder: 'XXXX000000XXXXXX00' },
                    { field: 'rfc',             label: 'RFC',             placeholder: 'XXXX000000XXX' },
                    { field: 'telefono',        label: 'Teléfono',        placeholder: '+52 477 000 0000' },
                    { field: 'email',           label: 'Correo',          placeholder: 'correo@ejemplo.com' },
                  ].map(f => (
                    <div key={f.field} className={f.col === 2 ? 'col-span-2' : ''}>
                      <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: '#666' }}>
                        {f.label}
                      </label>
                      <input
                        type="text"
                        value={(parte as any)[f.field]}
                        onChange={e => updateParte(idx, f.field as keyof Parte, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                        style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Botón agregar socio */}
            {tieneSocios && (
              <button
                type="button"
                onClick={agregarParte}
                className="w-full py-3 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer border-none"
                style={{ background: 'rgba(0,0,0,0.04)', color: '#666', border: '1px dashed rgba(0,0,0,0.15)' }}
              >
                + Agregar socio
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(226,75,74,0.08)', color: '#A32D2D', border: '1px solid rgba(226,75,74,0.2)' }}>
            {error}
          </div>
        )}

        {/* Submit */}
        {tramiteId && (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all cursor-pointer border-none"
            style={{
              background: loading ? '#666' : '#111',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {loading ? 'Creando ticket...' : 'Crear ticket →'}
          </button>
        )}
      </form>
    </div>
  )
}