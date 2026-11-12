'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import s from './wa.module.css'
import ListaConversaciones from './ListaConversaciones'
import VistaChat from './VistaChat'
import { apiPost, calcularVentana, ApiError } from './waUtils'

interface Props {
  conversacionesIniciales: any[]
  areas: any[]
}

type Filtro = 'todas' | 'no_leidas' | 'por_vencer' | 'pendiente' | 'demorado' | 'atendido'

const ordenar = (lista: any[]) =>
  [...lista].sort((a, b) => new Date(b.ultimo_mensaje_at).getTime() - new Date(a.ultimo_mensaje_at).getTime())

export default function ChatsLayout({ conversacionesIniciales, areas }: Props) {
  const searchParams = useSearchParams()
  const convParam = searchParams.get('conv')
  const supabase = useMemo(() => createClient(), [])

  const [conversaciones, setConversaciones] = useState<any[]>(conversacionesIniciales)
  const [convSeleccionada, setConvSeleccionada] = useState<any | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [filtroArea, setFiltroArea] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState<'chats' | 'directorio'>('chats')
  const [esAdmin, setEsAdmin] = useState(false)
  const [usuarioAreaId, setUsuarioAreaId] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)

  const [modalNueva, setModalNueva] = useState(false)
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const [errorNueva, setErrorNueva] = useState<string | null>(null)

  // Refs para usar el estado más reciente dentro del canal de tiempo real
  const seleccionRef = useRef<any | null>(null)
  const permisosRef = useRef({ esAdmin: false, areaId: null as string | null })
  useEffect(() => { seleccionRef.current = convSeleccionada }, [convSeleccionada])
  useEffect(() => { permisosRef.current = { esAdmin, areaId: usuarioAreaId } }, [esAdmin, usuarioAreaId])

  // Abrir conversación desde ?conv=
  useEffect(() => {
    if (!convParam) return
    const conv = conversacionesIniciales.find(c => c.id === convParam)
    if (conv) setConvSeleccionada(conv)
  }, [convParam, conversacionesIniciales])

  // Rol y área del usuario
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return
      const { data } = await supabase
        .from('usuarios_sistema')
        .select('area_id, rol')
        .eq('email', user.email || '')
        .single()
      if (data) {
        setUsuarioAreaId(data.area_id)
        setEsAdmin(['admin', 'notario', 'asistente'].includes(data.rol))
      }
    })
  }, [])

  // Tiempo real de la lista
  useEffect(() => {
    const channel = supabase
      .channel('chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones_wa' }, async (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('conversaciones_wa')
            .select('*, areas(nombre, color_hex)')
            .eq('id', (payload.new as any).id)
            .single()
          const { esAdmin: admin, areaId } = permisosRef.current
          if (data && (admin || data.area_id === areaId)) {
            setConversaciones(prev => (prev.some(c => c.id === data.id) ? prev : ordenar([data, ...prev])))
          }
        }
        if (payload.eventType === 'UPDATE') {
          const nuevo = payload.new as any
          setConversaciones(prev => ordenar(prev.map(c => (c.id === nuevo.id ? { ...c, ...nuevo } : c))))
          if (seleccionRef.current?.id === nuevo.id) {
            setConvSeleccionada((prev: any) => ({ ...prev, ...nuevo }))
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function cambiarEstatus(convId: string, estatus: string) {
    await supabase.from('conversaciones_wa').update({ estatus }).eq('id', convId)
    setConversaciones(prev => prev.map(c => (c.id === convId ? { ...c, estatus } : c)))
    if (convSeleccionada?.id === convId) setConvSeleccionada((prev: any) => ({ ...prev, estatus }))
  }

  function seleccionar(conv: any) {
    setConvSeleccionada(conv)
    if (conv.no_leidos > 0) {
      setConversaciones(prev => prev.map(c => (c.id === conv.id ? { ...c, no_leidos: 0 } : c)))
    }
  }

  // ─── Nueva conversación ───
  const digitosNuevo = nuevoTelefono.replace(/\D/g, '').slice(-10)
  const convExistente = digitosNuevo.length === 10
    ? conversaciones.find(c => (c.telefono || '').replace(/\D/g, '').endsWith(digitosNuevo))
    : null

  async function iniciarConversacion() {
    if (digitosNuevo.length !== 10 || iniciando) return
    setIniciando(true); setErrorNueva(null)
    try {
      const conv = await apiPost('/api/meta/nueva-conversacion', {
        telefono: nuevoTelefono,
        nombre: nuevoNombre.trim() || null,
        area_id: usuarioAreaId,
      })
      setConversaciones(prev => ordenar([conv, ...prev.filter(c => c.id !== conv.id)]))
      setConvSeleccionada(conv)
      cerrarModal()
    } catch (e) {
      setErrorNueva(e instanceof ApiError ? e.message : 'No se pudo iniciar la conversación')
    } finally {
      setIniciando(false)
    }
  }

  function cerrarModal() {
    setModalNueva(false); setNuevoTelefono(''); setNuevoNombre(''); setErrorNueva(null)
  }

  // ─── Filtros ───
  const ahora = Date.now()
  const convFiltradas = conversaciones.filter(c => {
    if (filtroArea !== 'todas' && c.area_id !== filtroArea) return false
    const est = c.estatus || 'pendiente'
    if (filtro === 'no_leidas' && !(c.no_leidos > 0)) return false
    if (filtro === 'por_vencer' && calcularVentana(c.ultimo_entrante_at, ahora).estado !== 'closing') return false
    if (['pendiente', 'demorado', 'atendido'].includes(filtro) && est !== filtro) return false
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      if (![c.nombre, c.telefono, c.ultimo_mensaje].some(v => (v || '').toLowerCase().includes(q))) return false
    }
    return true
  })

  const noLeidas = conversaciones.filter(c => c.no_leidos > 0).length
  const porVencer = conversaciones.filter(c => calcularVentana(c.ultimo_entrante_at, ahora).estado === 'closing').length
  const conteo = (clave: string) => conversaciones.filter(c => (c.estatus || 'pendiente') === clave).length

  const FILTROS: { id: Filtro; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'no_leidas', label: `No leídas${noLeidas ? ` ${noLeidas}` : ''}` },
    { id: 'por_vencer', label: `Por vencer${porVencer ? ` ${porVencer}` : ''}` },
    { id: 'demorado', label: `Demoradas${conteo('demorado') ? ` ${conteo('demorado')}` : ''}` },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'atendido', label: 'Atendidas' },
  ]

  const areasConNumero = areas.filter((a: any) => a.numero_twilio)

  return (
    <div className={s.app}>
      {/* ── Lista ── */}
      <aside className={s.side}>
        <div className={s.sideHead}>
          <h1>{vista === 'chats' ? 'Mensajes' : 'Directorio'}</h1>
          <div className={s.acts}>
            <button
              className={`${s.roundBtn} ${vista === 'directorio' ? s.roundBtnOn : ''}`}
              onClick={() => setVista(vista === 'chats' ? 'directorio' : 'chats')}
              title="Directorio de números de la notaría"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M8 7h8M8 11h6" /></svg>
            </button>
            <button className={s.roundBtn} onClick={() => setModalNueva(true)} title="Nueva conversación">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z" /><path d="M12 8v7M8.5 11.5h7" /></svg>
            </button>
          </div>
        </div>

        {vista === 'chats' ? (
          <>
            <div className={s.searchRow}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zM6.5 11a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" /></svg>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar conversación o número" />
            </div>
            <div className={s.filters}>
              {FILTROS.map(f => (
                <button key={f.id} className={filtro === f.id ? s.on : ''} onClick={() => setFiltro(f.id)}>{f.label}</button>
              ))}
            </div>
            <div className={s.listTools}>
              <span className={s.count}>
                {convFiltradas.length} conversaci{convFiltradas.length !== 1 ? 'ones' : 'ón'}
              </span>
              {esAdmin && (
                <select
                  className={s.selectPill}
                  value={filtroArea}
                  onChange={e => setFiltroArea(e.target.value)}
                  aria-label="Filtrar por área"
                >
                  <option value="todas">Todas las áreas</option>
                  {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              )}
            </div>
            <div className={s.chatlist}>
              <ListaConversaciones
                conversaciones={convFiltradas}
                seleccionada={convSeleccionada?.id}
                onSelect={seleccionar}
                onCambiarEstatus={cambiarEstatus}
              />
            </div>
          </>
        ) : (
          <div className={s.chatlist}>
            <div className={s.dirNote}>Números de WhatsApp de cada área de la notaría. Copia el número para compartirlo con un cliente.</div>
            {areasConNumero.map((a: any) => (
              <div key={a.id} className={s.contact}>
                <div className={s.avatar} style={{ background: a.color_hex, width: 42, height: 42, fontSize: '0.85rem' }}>
                  {a.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className={s.cMain}>
                  <b>{a.nombre}</b>
                  <span>{a.numero_twilio}</span>
                </div>
                <button
                  className={`${s.copyBtn} ${copiado === a.id ? s.ok : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(a.numero_twilio)
                    setCopiado(a.id)
                    setTimeout(() => setCopiado(null), 1500)
                  }}
                >
                  {copiado === a.id ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Conversación ── */}
      <section className={s.main}>
        {convSeleccionada ? (
          <VistaChat
            key={convSeleccionada.id}
            conversacion={convSeleccionada}
            onCambiarEstatus={estatus => cambiarEstatus(convSeleccionada.id, estatus)}
          />
        ) : (
          <div className={s.empty}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z" /></svg>
            <b>Selecciona una conversación</b>
            <span>Los mensajes de WhatsApp aparecen aquí en tiempo real.</span>
          </div>
        )}
      </section>

      {/* ── Modal nueva conversación ── */}
      {modalNueva && (
        <div className={s.overlay} onClick={cerrarModal}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <div>
                <b>Nueva conversación</b>
                <span>Se enviará la plantilla de apertura de tu área</span>
              </div>
              <button className={s.roundBtn} onClick={cerrarModal} aria-label="Cerrar">✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.field}>
                <label htmlFor="nuevo-tel">Número de WhatsApp</label>
                <input
                  id="nuevo-tel"
                  value={nuevoTelefono}
                  onChange={e => setNuevoTelefono(e.target.value)}
                  placeholder="4611234567"
                  inputMode="tel"
                  autoFocus
                />
              </div>

              {convExistente && (
                <div className={s.aviso}>
                  Este número ya tiene una conversación con {convExistente.nombre || convExistente.telefono}
                  {convExistente.areas ? ` en ${convExistente.areas.nombre}` : ''}.
                  <div>
                    <button
                      className={s.btnGhost}
                      onClick={() => { setConvSeleccionada(convExistente); cerrarModal() }}
                    >
                      Abrir conversación
                    </button>
                  </div>
                </div>
              )}

              <div className={s.field}>
                <label htmlFor="nuevo-nombre">Nombre del cliente (opcional)</label>
                <input
                  id="nuevo-nombre"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Juan García"
                  onKeyDown={e => e.key === 'Enter' && iniciarConversacion()}
                />
              </div>

              {errorNueva && <div className={s.errorBar} style={{ margin: 0 }}>{errorNueva}</div>}
            </div>
            <div className={s.modalFoot}>
              <button className={s.btnGhost} onClick={cerrarModal}>Cancelar</button>
              <button className={s.btnGreen} disabled={digitosNuevo.length !== 10 || iniciando} onClick={iniciarConversacion}>
                {iniciando ? 'Enviando…' : 'Iniciar conversación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}