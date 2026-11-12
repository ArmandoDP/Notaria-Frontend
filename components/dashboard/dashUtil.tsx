'use client'

import { useEffect, useRef, useState } from 'react'
import { startOfDay, subDays, subMonths } from 'date-fns'

export type PeriodoId = 'hoy' | '7d' | '30d' | '3m' | '6m' | 'todo'

export const PERIODOS: { id: PeriodoId; label: string; texto: string }[] = [
  { id: 'hoy',  label: 'Hoy',     texto: 'hoy' },
  { id: '7d',   label: '7 días',  texto: 'los últimos 7 días' },
  { id: '30d',  label: '30 días', texto: 'los últimos 30 días' },
  { id: '3m',   label: '3 meses', texto: 'los últimos 3 meses' },
  { id: '6m',   label: '6 meses', texto: 'los últimos 6 meses' },
  { id: 'todo', label: 'Todo',    texto: 'todo el historial' },
]

/** Desde cuándo cuenta el periodo y cuál es el periodo anterior equivalente (para comparar). */
export function rangoPeriodo(id: PeriodoId, ahora = new Date()) {
  const hoy = startOfDay(ahora)
  let desde: Date | null
  switch (id) {
    case 'hoy':  desde = hoy; break
    case '7d':   desde = subDays(hoy, 6); break
    case '30d':  desde = subDays(hoy, 29); break
    case '3m':   desde = subMonths(hoy, 3); break
    case '6m':   desde = subMonths(hoy, 6); break
    default:     desde = null
  }
  const anteriorDesde = desde ? new Date(desde.getTime() - (ahora.getTime() - desde.getTime())) : null
  return { desde, anteriorDesde, hasta: ahora }
}

export const ESTADOS: { id: string; label: string; color: string }[] = [
  { id: 'nuevo',         label: 'Nuevo',         color: '#111111' },
  { id: 'asignado',      label: 'Asignado',      color: '#3a3a3a' },
  { id: 'folio_dba',     label: 'Folio DBA',     color: '#6b6b6b' },
  { id: 'escritura_dba', label: 'Escritura DBA', color: '#9a9a96' },
  { id: 'completado',    label: 'Completado',    color: '#c9c9c5' },
  { id: 'cancelado',     label: 'Cancelado',     color: '#e3e3df' },
]
export const ACTIVOS = ['nuevo', 'asignado', 'folio_dba', 'escritura_dba']
export const estadoLabel = (id: string) => ESTADOS.find(e => e.id === id)?.label || id

/** Número que sube animado y siempre termina en el valor real. */
export function useContador(valor: number, duracion = 750) {
  const [mostrado, setMostrado] = useState(valor)
  const anterior = useRef(0)
  useEffect(() => {
    const de = anterior.current
    anterior.current = valor
    const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducir || document.hidden || de === valor) { setMostrado(valor); return }
    const inicio = performance.now()
    let raf = 0
    const paso = () => {
      const p = Math.min(1, Math.max(0, (performance.now() - inicio) / duracion))
      setMostrado(Math.round(de + (valor - de) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    const seguro = setTimeout(() => setMostrado(valor), duracion + 150)
    return () => { cancelAnimationFrame(raf); clearTimeout(seguro); setMostrado(valor) }
  }, [valor, duracion])
  return mostrado
}

/** Trae todas las filas de una consulta en páginas (Supabase regresa máximo 1,000 por consulta). */
export async function traerTodo<T = any>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: any }>) {
  const PAGINA = 1000
  let filas: T[] = []
  for (let i = 0; i < 100000; i += PAGINA) {
    const { data, error } = await consulta(i, i + PAGINA - 1)
    if (error) throw error
    filas = filas.concat(data || [])
    if (!data || data.length < PAGINA) break
  }
  return filas
}

const PATHS: Record<string, string> = {
  inbox:   'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  arrow:   'M5 12h14M13 6l6 6-6 6',
  x:       'M18 6L6 18M6 6l12 12',
  check:   'M5 12l5 5L20 7',
  doc:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  alert:   'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  ai:      'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
  up:      'M7 17L17 7M9 7h8v8',
  down:    'M7 7l10 10M17 9v8H9',
}
export function Ic({ n, size = 16, sw = 1.8 }: { n: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[n] || PATHS.doc} />
    </svg>
  )
}