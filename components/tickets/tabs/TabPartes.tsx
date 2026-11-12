'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import s from './tabs.module.css'
import { Ic, Modal, useModal, Toast, useAviso } from '../ticketUi'
import { rolLabel, iniciales } from './tabsUtil'

interface Props {
  partes:   any[]
  tramite:  any
  ticketId: string
}

const CAMPOS = [
  { field: 'nombre_completo', label: 'Nombre completo', placeholder: 'Nombre y apellidos', full: true },
  { field: 'curp',            label: 'CURP',            placeholder: '18 caracteres', upper: true },
  { field: 'rfc',             label: 'RFC',             placeholder: '12 o 13 caracteres', upper: true },
  { field: 'telefono',        label: 'Teléfono',        placeholder: '461 123 4567' },
  { field: 'email',           label: 'Correo',          placeholder: 'correo@ejemplo.com' },
]

export default function TabPartes({ partes, ticketId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const { aviso, mostrar } = useAviso()
  const modal = useModal()

  const [lista, setLista] = useState<any[]>(partes)
  const [editando, setEditando] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`partes-${ticketId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partes', filter: `ticket_id=eq.${ticketId}` },
        (payload: any) => setLista(prev => prev.map(p => (p.id === payload.new.id ? { ...p, ...payload.new } : p))))
      .subscribe()
    // Respaldo: refresca cada 10 s por si el cliente llenó datos desde su link
    const intervalo = setInterval(async () => {
      const { data } = await supabase.from('partes').select('*').eq('ticket_id', ticketId).order('orden')
      if (data) setLista(data)
    }, 10000)
    return () => { supabase.removeChannel(channel); clearInterval(intervalo) }
  }, [ticketId])

  function abrir(parte: any) {
    setEditando(parte)
    setForm({
      nombre_completo: parte.nombre_completo || '',
      curp:            parte.curp || '',
      rfc:             parte.rfc || '',
      telefono:        parte.telefono || '',
      email:           parte.email || '',
      es_extranjero:   !!parte.es_extranjero,
      pasaporte:       parte.pasaporte || '',
      residencia:      parte.residencia || '',
    })
    modal.abrir()
  }

  async function guardar() {
    if (!editando) return
    setGuardando(true)
    const { error } = await supabase.from('partes').update(form).eq('id', editando.id)
    setGuardando(false)
    if (error) { mostrar(`No se pudo guardar: ${error.message}`, true); return }
    setLista(prev => prev.map(p => (p.id === editando.id ? { ...p, ...form } : p)))
    modal.cerrar()
    mostrar('Datos guardados')
  }

  if (lista.length === 0) {
    return (
      <div className={s.wrap}>
        <div className={s.empty}><b>Sin partes</b><span>Este expediente no tiene partes registradas.</span></div>
      </div>
    )
  }

  return (
    <div className={s.wrap}>
      <div className={s.parties}>
        {lista.map((parte, i) => {
          const conDatos = parte.nombre_completo || parte.telefono || parte.curp
          return (
            <div key={parte.id} className={s.party} style={{ animationDelay: `${i * 50}ms` }}>
              <div className={s.partyHead}>
                <span className={`${s.avatar} ${conDatos ? '' : s.avatarMuted}`}>
                  {parte.nombre_completo ? iniciales(parte.nombre_completo) : rolLabel(parte.rol).slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <b>{parte.nombre_completo || 'Sin nombre'}</b>
                  <small>{rolLabel(parte.rol)}</small>
                </div>
                <button type="button" className={`${s.btn} ${s.btnLine} ${s.btnSm}`} onClick={() => abrir(parte)}>Editar</button>
              </div>

              {conDatos ? (
                <div className={s.facts}>
                  {parte.curp && <div className={s.fact}><small>CURP</small><span className={s.mono}>{parte.curp}</span></div>}
                  {parte.rfc && <div className={s.fact}><small>RFC</small><span className={s.mono}>{parte.rfc}</span></div>}
                  {parte.telefono && <div className={s.fact}><small>Teléfono</small><span>{parte.telefono}</span></div>}
                  {parte.email && <div className={s.fact}><small>Correo</small><span>{parte.email}</span></div>}
                  {parte.es_extranjero && (
                    <div className={s.foreign}>
                      <div className={s.facts}>
                        <div className={`${s.fact} ${s.factFull}`}><small>Extranjero</small></div>
                        {parte.pasaporte && <div className={s.fact}><small>Pasaporte</small><span className={s.mono}>{parte.pasaporte}</span></div>}
                        {parte.residencia && <div className={s.fact}><small>Documento migratorio</small><span className={s.mono}>{parte.residencia}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '.8rem', color: '#6b6b6b' }}>
                  Sin datos. El cliente puede llenarlos desde su link de carga.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal.abierto && editando && (
        <Modal saliendo={modal.saliendo} onClose={guardando ? undefined : modal.cerrar} ancho={480}>
          <div className={s.modalBody}>
            <h3>{rolLabel(editando.rol)}</h3>
            <p>Datos de la parte, tal como aparecen en sus documentos oficiales.</p>
            <div className={s.formGrid}>
              {CAMPOS.map(c => (
                <div key={c.field} className={c.full ? s.formFull : ''}>
                  <label className={s.label} htmlFor={`pt-${c.field}`}>{c.label}</label>
                  <input
                    id={`pt-${c.field}`}
                    className={`${s.input} ${c.upper ? `${s.upper} ${s.mono}` : ''}`}
                    value={form[c.field] || ''}
                    placeholder={c.placeholder}
                    onChange={e => setForm((f: any) => ({ ...f, [c.field]: c.upper ? e.target.value.toUpperCase() : e.target.value }))}
                  />
                </div>
              ))}
              <div className={s.formFull}>
                <button type="button" className={s.switchRow} role="switch" aria-checked={!!form.es_extranjero}
                  onClick={() => setForm((f: any) => ({ ...f, es_extranjero: !f.es_extranjero }))}>
                  <span className={`${s.switch} ${form.es_extranjero ? s.switchOn : ''}`} />
                  Es extranjero
                </button>
              </div>
              {form.es_extranjero && (
                <>
                  <div>
                    <label className={s.label} htmlFor="pt-pasaporte">Pasaporte</label>
                    <input id="pt-pasaporte" className={`${s.input} ${s.upper} ${s.mono}`} value={form.pasaporte} placeholder="AB123456"
                      onChange={e => setForm((f: any) => ({ ...f, pasaporte: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className={s.label} htmlFor="pt-residencia">Documento migratorio</label>
                    <input id="pt-residencia" className={s.input} value={form.residencia} placeholder="Residencia, FM2 o FM3"
                      onChange={e => setForm((f: any) => ({ ...f, residencia: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={s.modalFoot}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={modal.cerrar} disabled={guardando}>Cancelar</button>
            <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={guardar} disabled={guardando}>
              {guardando ? <span className={`${s.spin} ${s.spinLight}`} /> : <Ic n="check" size={14} sw={2.4} />}
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
      <Toast aviso={aviso} />
    </div>
  )
}