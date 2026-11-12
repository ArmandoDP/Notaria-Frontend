'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import t from './ticket.module.css'

// ─── Íconos de línea ─────────────────────────────────────────────────────────
const PATHS: Record<string, string> = {
  back:     'M15 18l-6-6 6-6',
  clock:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  area:     'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  folio:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  check:    'M5 12l5 5L20 7',
  x:        'M18 6L6 18M6 6l12 12',
  alert:    'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  wa:       'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  box:      'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  link:     'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  ai:       'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
  ban:      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
  undo:     'M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 9',
  send:     'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  upload:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  scan:     'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10',
  doc:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  chevron:  'M6 9l6 6 6-6',
}

export function Ic({ n, size = 16, sw = 1.8 }: { n: keyof typeof PATHS | string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[n] || PATHS.doc} />
    </svg>
  )
}

// ─── Modal con entrada y salida animadas ─────────────────────────────────────
export function useModal() {
  const [abierto, setAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abrir = useCallback(() => { if (timer.current) clearTimeout(timer.current); setSaliendo(false); setAbierto(true) }, [])
  const cerrar = useCallback(() => {
    setSaliendo(true)
    timer.current = setTimeout(() => { setAbierto(false); setSaliendo(false) }, 190)
  }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return { abierto, saliendo, abrir, cerrar }
}

export function Modal({ saliendo, onClose, children, ancho = 400 }: {
  saliendo?: boolean
  onClose?: () => void
  children: React.ReactNode
  ancho?: number
}) {
  useEffect(() => {
    if (!onClose) return
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onClose])

  return (
    <div className={`${t.overlay} ${saliendo ? t.overlayOut : ''}`} onClick={onClose}>
      <div className={t.modal} style={{ maxWidth: ancho }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}

// ─── Aviso flotante ──────────────────────────────────────────────────────────
export type Aviso = { texto: string; error?: boolean } | null

export function useAviso() {
  const [aviso, setAviso] = useState<Aviso>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mostrar = useCallback((texto: string, error = false) => {
    if (timer.current) clearTimeout(timer.current)
    setAviso({ texto, error })
    timer.current = setTimeout(() => setAviso(null), error ? 5000 : 3200)
  }, [])
  return { aviso, mostrar }
}

export function Toast({ aviso }: { aviso: Aviso }) {
  if (!aviso) return null
  return (
    <div className={`${t.toast} ${aviso.error ? t.toastError : ''}`} role="status">
      <Ic n={aviso.error ? 'alert' : 'check'} size={15} sw={2.2} />
      {aviso.texto}
    </div>
  )
}

// ─── Iniciales del trámite (igual que en el Kanban) ──────────────────────────
const MENORES = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'a', 'en', 'para', 'por', 'con']
export function inicialesTramite(nombre?: string) {
  const palabras = (nombre || 'Trámite').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/)
    .filter(p => p && !MENORES.includes(p.toLowerCase()))
  return ((palabras[0]?.[0] || 'T') + (palabras[1]?.[0] || '')).toUpperCase()
}

export const CANAL_LABEL: Record<string, string> = {
  front_desk:   'Recepción',
  whatsapp:     'WhatsApp',
  telefono:     'Teléfono',
  mail:         'Correo',
  whatsapp_vip: 'WhatsApp VIP',
}