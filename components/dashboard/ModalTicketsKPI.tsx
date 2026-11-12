'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import d from './dashboard.module.css'
import { ACTIVOS, Ic, estadoLabel } from './dashUtil'

export type FiltroKPI =
  | { tipo: 'periodo' }
  | { tipo: 'estado'; estado: string }
  | { tipo: 'riesgo' }

interface Props {
  titulo:       string
  descripcion?: string
  filtro:       FiltroKPI
  desde:        string | null
  onClose:      () => void
}

const LIMITE = 100

export default function ModalTicketsKPI({ titulo, descripcion, filtro, desde, onClose }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [tickets, setTickets] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [saliendo, setSaliendo] = useState(false)

  function cerrar() {
    setSaliendo(true)
    setTimeout(onClose, 190)
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  useEffect(() => {
    let vivo = true
    async function cargar() {
      let q = supabase
        .from('tickets')
        .select('id, numero, estado, created_at, sla_vence_at, tramites_config(nombre), areas(nombre), partes(nombre_completo)', { count: 'exact' })

      if (filtro.tipo === 'riesgo') {
        q = q.in('estado', ACTIVOS)
          .lte('sla_vence_at', new Date(Date.now() + 3 * 86400000).toISOString())
          .order('sla_vence_at', { ascending: true })
      } else {
        if (desde) q = q.gte('created_at', desde)
        if (filtro.tipo === 'estado') q = q.eq('estado', filtro.estado)
        q = q.order('created_at', { ascending: false })
      }

      const { data, count } = await q.limit(LIMITE)
      if (!vivo) return
      setTickets(data || [])
      setTotal(count || 0)
      setCargando(false)
    }
    cargar()
    return () => { vivo = false }
  }, [])

  return (
    <div className={`${d.overlay} ${saliendo ? d.overlayOut : ''}`} onClick={cerrar}>
      <div className={d.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={d.modalHead}>
          <div>
            <h3>{titulo}</h3>
            <p>{descripcion}{!cargando && ` · ${total.toLocaleString('es-MX')} expediente${total !== 1 ? 's' : ''}`}</p>
          </div>
          <button type="button" className={d.close} onClick={cerrar} aria-label="Cerrar"><Ic n="x" size={14} /></button>
        </div>

        <div className={d.modalList}>
          {cargando ? (
            <div className={d.cardEmpty}><div className={d.spin} /></div>
          ) : tickets.length === 0 ? (
            <div className={d.cardEmpty}>No hay expedientes con este criterio.</div>
          ) : (
            <div className={d.rows}>
              {tickets.map((t, i) => {
                const cliente = t.partes?.find((p: any) => p.nombre_completo)?.nombre_completo || 'Sin cliente'
                const vence = t.sla_vence_at ? new Date(t.sla_vence_at) : null
                const vencido = !!vence && isPast(vence) && ACTIVOS.includes(t.estado)
                return (
                  <a key={t.id} href={`/tickets/${t.id}`} className={d.row} style={{ animationDelay: `${Math.min(i, 14) * 0.03}s` }}>
                    <span className={`${d.rowMark} ${vencido ? d.rowMarkRed : t.estado === 'nuevo' ? d.rowMarkDark : ''}`} />
                    <div className={d.rowMain}>
                      <b><small>{t.numero}</small>{t.tramites_config?.nombre}</b>
                      <span>{cliente} · {t.areas?.nombre || 'Sin área'}</span>
                    </div>
                    <div className={d.rowSide}>
                      <span className={`${d.chip} ${vencido ? d.chipRed : t.estado === 'nuevo' ? d.chipDark : ''}`}>
                        {vencido ? 'Vencido' : estadoLabel(t.estado)}
                      </span>
                      <span style={{ display: 'block', marginTop: 3 }}>
                        {filtro.tipo === 'riesgo' && vence
                          ? `Vence ${format(vence, "d 'de' MMM", { locale: es })}`
                          : format(new Date(t.created_at), "d 'de' MMM", { locale: es })}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {!cargando && total > tickets.length && (
          <div className={d.modalFoot}>
            <span>Mostrando {tickets.length} de {total.toLocaleString('es-MX')}</span>
            <a href="/">Ver en el tablero de solicitudes</a>
          </div>
        )}
      </div>
    </div>
  )
}