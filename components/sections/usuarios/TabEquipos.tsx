'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ROL_CONFIG: Record<string, { label: string, bg: string, color: string }> = {
  admin:            { label: 'admin',      bg: '#FEE2E2', color: '#991B1B' },
  notario:          { label: 'notario',    bg: '#FDF6E3', color: '#92400E' },
  recepcion:        { label: 'recepción',  bg: '#EAF2FB', color: '#0C447C' },
  area_lead:        { label: 'area_lead',  bg: '#EAF2FB', color: '#1B5FA5' },
  agente:           { label: 'agente',     bg: '#F1EFE8', color: '#555550' },
  notario_auxiliar: { label: 'not. aux.',  bg: '#FAE0E0', color: '#D85A30' },
}

const ROLES = ['admin', 'notario', 'recepcion', 'area_lead', 'agente', 'notario_auxiliar']
const COLORES = ['#1B5FA5','#1A6B3C','#991B1B','#92400E','#5B21B6','#0F5C5C','#374151','#CC0000','#854F0B','#D85A30']

interface Props {
  areas:    any[]
  usuarios: any[]
  onUpdate: (usuarios: any[]) => void
}

export default function TabEquipos({ areas, usuarios, onUpdate }: Props) {
  const supabase = createClient()

  const [modalUsuario,  setModalUsuario]  = useState(false)
  const [modalArea,     setModalArea]     = useState(false)
  const [editandoU,     setEditandoU]     = useState<any | null>(null)
  const [editandoArea,  setEditandoArea]  = useState<any | null>(null)
  const [expandido,     setExpandido]     = useState<string | null>(null)

  const [formU, setFormU] = useState({
    nombre: '', email: '', password: '', rol: 'agente',
    area_id: '', avatar_letras: '', avatar_color: '#1B5FA5', can_read_all: false,
  })

  const [formA, setFormA] = useState({
    descripcion_equipo:   '',
    notas_acceso:         '',
    bancos_asignados:     '',
    tramites_principales: '',
    numero_twilio:        '',
  })

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function abrirNuevoUsuario(areaId?: string) {
    setEditandoU(null)
    setFormU({ nombre: '', email: '', password: '', rol: 'agente', area_id: areaId || '', avatar_letras: '', avatar_color: '#1B5FA5', can_read_all: false })
    setError('')
    setModalUsuario(true)
  }

  function abrirEditarUsuario(u: any) {
    setEditandoU(u)
    setFormU({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, area_id: u.area_id || '', avatar_letras: u.avatar_letras || '', avatar_color: u.avatar_color || '#1B5FA5', can_read_all: u.can_read_all || false })
    setError('')
    setModalUsuario(true)
  }

  function abrirEditarArea(area: any) {
    setEditandoArea(area)
    setFormA({
      descripcion_equipo:   area.descripcion_equipo || '',
      notas_acceso:         area.notas_acceso || '',
      bancos_asignados:     (area.bancos_asignados || []).join(', '),
      tramites_principales: (area.tramites_principales || []).join(', '),
      numero_twilio:        area.numero_twilio || '',
    })
    setModalArea(true)
  }

  async function guardarUsuario() {
    if (!formU.nombre.trim() || !formU.email.trim()) { setError('Nombre y correo son obligatorios'); return }
    if (!editandoU && !formU.password.trim()) { setError('La contraseña es obligatoria'); return }
    setSaving(true); setError('')

    try {
      if (editandoU) {
        await supabase.from('usuarios_sistema').update({
          nombre: formU.nombre, rol: formU.rol,
          area_id: formU.area_id || null,
          avatar_letras: formU.avatar_letras || formU.nombre.slice(0, 2).toUpperCase(),
          avatar_color: formU.avatar_color, can_read_all: formU.can_read_all,
        }).eq('id', editandoU.id)
        onUpdate(usuarios.map(u => u.id === editandoU.id ? { ...u, ...formU, avatar_letras: formU.avatar_letras || formU.nombre.slice(0, 2).toUpperCase() } : u))
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/crear`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formU, avatar_letras: formU.avatar_letras || formU.nombre.slice(0, 2).toUpperCase() }),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Error') }
        const nuevo = await res.json()
        onUpdate([...usuarios, nuevo])
      }
      setModalUsuario(false)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function guardarArea() {
    if (!editandoArea) return
    setSaving(true)

    const bancos = formA.bancos_asignados ? formA.bancos_asignados.split(',').map(s => s.trim()).filter(Boolean) : []
    const tramites = formA.tramites_principales ? formA.tramites_principales.split(',').map(s => s.trim()).filter(Boolean) : []

    await supabase.from('areas').update({
      descripcion_equipo:   formA.descripcion_equipo || null,
      notas_acceso:         formA.notas_acceso || null,
      bancos_asignados:     bancos.length > 0 ? bancos : null,
      tramites_principales: tramites.length > 0 ? tramites : null,
      numero_twilio:        formA.numero_twilio || null,
    }).eq('id', editandoArea.id)

    setSaving(false)
    setModalArea(false)
    // Recargar la página para ver los cambios del área
    window.location.reload()
  }

  async function eliminarUsuario(u: any) {
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/${u.auth_user_id}`, { method: 'DELETE' })
    if (res.ok) onUpdate(usuarios.filter(x => x.id !== u.id))
  }

  return (
    <div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
        {areas.map(area => {
          const usuariosArea = usuarios.filter(u => u.area_id === area.id)
          const abierto      = expandido === area.id
          const permisos: any[] = area.permisos_especiales || []

          return (
            <div key={area.id} className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

              {/* Header área */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: `${area.color_hex}08` }}>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: area.color_hex }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate" style={{ color: '#111' }}>{area.nombre}</div>
                    {area.numero_twilio && (
                      <div className="text-[10px] font-mono flex items-center gap-1" style={{ color: '#9C9890' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        {area.numero_twilio}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => abrirEditarArea(area)}
                    className="px-2 py-1 rounded-lg text-[10px] cursor-pointer border-none"
                    style={{ background: '#F3F4F6', color: '#666' }}>
                    ✎ Editar
                  </button>
                  <button onClick={() => abrirNuevoUsuario(area.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none"
                    style={{ background: `${area.color_hex}15`, color: area.color_hex }}>
                    + Usuario
                  </button>
                </div>
              </div>

              {/* Descripción del equipo */}
              {area.descripcion_equipo && (
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[11.5px] leading-relaxed" style={{ color: '#666' }}>
                    {area.descripcion_equipo}
                  </p>
                </div>
              )}

              {/* Usuarios */}
              {usuariosArea.length === 0 ? (
                <div className="px-4 py-3 text-[12px] text-center" style={{ color: '#CCC' }}>
                  Sin usuarios asignados
                </div>
              ) : (
                usuariosArea.map(u => {
                  const rol = ROL_CONFIG[u.rol] || ROL_CONFIG.agente
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-gray-50 border-b"
                      style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: u.avatar_color || area.color_hex }}>
                        {u.avatar_letras || u.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium truncate" style={{ color: '#111' }}>{u.nombre}</div>
                        <div className="text-[10px] font-mono truncate" style={{ color: '#9C9890' }}>{u.email}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: rol.bg, color: rol.color }}>
                        {rol.label}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => abrirEditarUsuario(u)}
                          className="px-2 py-1 rounded-lg text-[10px] cursor-pointer border-none"
                          style={{ background: '#F3F4F6', color: '#666' }}>
                          Editar
                        </button>
                        <button onClick={() => eliminarUsuario(u)}
                          className="px-2 py-1 rounded-lg text-[10px] cursor-pointer border-none"
                          style={{ background: '#FEE2E2', color: '#991B1B' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Toggle detalles */}
              <button
                onClick={() => setExpandido(abierto ? null : area.id)}
                className="w-full flex items-center justify-between px-4 py-2 cursor-pointer border-none text-left transition-all"
                style={{ background: abierto ? `${area.color_hex}05` : 'transparent', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-[11px] font-semibold" style={{ color: area.color_hex }}>
                  {abierto ? 'Ocultar detalles' : 'Ver detalles del equipo'}
                </span>
                <span className="text-[11px] transition-transform duration-200"
                  style={{ color: '#9C9890', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
                  ▾
                </span>
              </button>

              {/* Detalles expandibles */}
              {abierto && (
                <div className="px-4 pb-4 flex flex-col gap-3"
                  style={{ borderTop: '1px solid rgba(0,0,0,0.04)', background: `${area.color_hex}04` }}>

                  {/* Permisos especiales */}
                  {permisos.length > 0 && (
                    <div className="pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
                        Permisos del equipo
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {permisos.map((p: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-[12px] flex-shrink-0">{p.tiene ? '✅' : '❌'}</span>
                            <span className="text-[11px]"
                              style={{ color: p.tiene ? '#333' : '#CCC', textDecoration: p.tiene ? 'none' : 'line-through' }}>
                              {p.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bancos asignados */}
                  {area.bancos_asignados?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
                        Bancos asignados
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {area.bancos_asignados.map((b: string) => (
                          <span key={b} className="px-2 py-0.5 rounded-lg text-[11px] font-medium"
                            style={{ background: `${area.color_hex}15`, color: area.color_hex }}>
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trámites principales */}
                  {area.tramites_principales?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9C9890' }}>
                        Trámites principales
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {area.tramites_principales.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 rounded-lg text-[11px] font-medium"
                            style={{ background: `${area.color_hex}15`, color: area.color_hex }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas de acceso */}
                  {area.notas_acceso && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#9C9890' }}>
                        Notas de acceso
                      </div>
                      <p className="text-[11.5px] leading-relaxed" style={{ color: '#666' }}>
                        {area.notas_acceso}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Botón agregar sin área */}
      <button onClick={() => abrirNuevoUsuario()}
        className="w-full py-3 rounded-2xl text-[13px] font-semibold cursor-pointer border-2 border-dashed transition-all mt-4"
        style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#666', background: 'transparent' }}>
        + Agregar usuario sin área asignada
      </button>

      {/* ── MODAL USUARIO ── */}
      {modalUsuario && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-[16px] font-bold mb-4" style={{ color: '#111' }}>
              {editandoU ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>
            <div className="flex flex-col gap-3">

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Nombre *</label>
                <input value={formU.nombre} onChange={e => setFormU(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  placeholder="Ej: Anaí Hernández" />
              </div>

              {!editandoU && (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Correo *</label>
                    <input value={formU.email} type="email" onChange={e => setFormU(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                      style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                      placeholder="anai@notaria3.com" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Contraseña *</label>
                    <input value={formU.password} type="password" onChange={e => setFormU(p => ({ ...p, password: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                      style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                      placeholder="Mínimo 8 caracteres" />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#9C9890' }}>Rol</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => {
                    const cfg = ROL_CONFIG[r]
                    return (
                      <button key={r} type="button" onClick={() => setFormU(p => ({ ...p, rol: r }))}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border-none transition-all"
                        style={{ background: formU.rol === r ? cfg.bg : '#F3F4F6', color: formU.rol === r ? cfg.color : '#9CA3AF' }}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Área</label>
                <select value={formU.area_id} onChange={e => setFormU(p => ({ ...p, area_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}>
                  <option value="">Sin área</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Iniciales</label>
                  <input value={formU.avatar_letras} maxLength={2}
                    onChange={e => setFormU(p => ({ ...p, avatar_letras: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] font-bold text-center font-mono outline-none"
                    style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                    placeholder="AN" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Preview</label>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: formU.avatar_color }}>
                    {formU.avatar_letras || formU.nombre.slice(0, 2).toUpperCase() || 'US'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(c => (
                    <button key={c} type="button" onClick={() => setFormU(p => ({ ...p, avatar_color: c }))}
                      className="w-7 h-7 rounded-full cursor-pointer border-none transition-all"
                      style={{ background: c, boxShadow: formU.avatar_color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none', transform: formU.avatar_color === c ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F7F5' }}>
                <button type="button" onClick={() => setFormU(p => ({ ...p, can_read_all: !p.can_read_all }))}
                  className="w-10 h-5 rounded-full transition-all relative cursor-pointer border-none flex-shrink-0"
                  style={{ background: formU.can_read_all ? '#1B5FA5' : '#E5E7EB' }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ left: formU.can_read_all ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: '#111' }}>Puede ver todos los tickets</div>
                  <div className="text-[10.5px]" style={{ color: '#9C9890' }}>Acceso de lectura a todas las áreas</div>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 rounded-xl text-[12px]" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                  {error}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalUsuario(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F0F0F0', color: '#666' }}>
                Cancelar
              </button>
              <button type="button" onClick={guardarUsuario} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: saving ? '#666' : '#111', color: '#fff' }}>
                {saving ? 'Guardando...' : editandoU ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ÁREA ── */}
      {modalArea && editandoArea && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: editandoArea.color_hex }} />
              <h3 className="text-[16px] font-bold" style={{ color: '#111' }}>
                Editar área — {editandoArea.nombre}
              </h3>
            </div>
            <div className="flex flex-col gap-3">

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Número WhatsApp Twilio
                </label>
                <input value={formA.numero_twilio}
                  onChange={e => setFormA(p => ({ ...p, numero_twilio: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] font-mono outline-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  placeholder="+52 461 100 0000" />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Descripción del equipo
                </label>
                <textarea value={formA.descripcion_equipo}
                  onChange={e => setFormA(p => ({ ...p, descripcion_equipo: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  placeholder="Describe el equipo y su función..." />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Bancos asignados
                  <span className="ml-1 font-normal normal-case" style={{ color: '#CCC' }}>(separados por coma)</span>
                </label>
                <textarea value={formA.bancos_asignados}
                  onChange={e => setFormA(p => ({ ...p, bancos_asignados: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  placeholder="BBVA, Santander, BanBajío..." />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Trámites principales
                  <span className="ml-1 font-normal normal-case" style={{ color: '#CCC' }}>(separados por coma)</span>
                </label>
                <textarea value={formA.tramites_principales}
                  onChange={e => setFormA(p => ({ ...p, tramites_principales: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  placeholder="Fraccionamientos, RPC, Permisos..." />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#9C9890' }}>
                  Notas de acceso
                </label>
                <textarea value={formA.notas_acceso}
                  onChange={e => setFormA(p => ({ ...p, notas_acceso: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111' }}
                  placeholder="Notas sobre accesos especiales..." />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalArea(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none"
                style={{ background: '#F0F0F0', color: '#666' }}>
                Cancelar
              </button>
              <button type="button" onClick={guardarArea} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border-none"
                style={{ background: saving ? '#666' : editandoArea.color_hex, color: '#fff' }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}