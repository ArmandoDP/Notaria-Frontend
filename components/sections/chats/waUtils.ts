'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'

export const API = process.env.NEXT_PUBLIC_API_URL || ''
export const MEDIA_BUCKET = 'whatsapp-media'

export const ESTATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pendiente: { label: 'Pendiente', color: '#8a6d1a', bg: '#fff4d6', dot: '#F59E0B' },
  atendido:  { label: 'Atendido',  color: '#1b9e52', bg: '#e7fce3', dot: '#21c063' },
  demorado:  { label: 'Demorado',  color: '#ea5545', bg: '#fdeae7', dot: '#ea5545' },
}

// ─── API ────────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  codigo?: string
  constructor(mensaje: string, codigo?: string) {
    super(mensaje)
    this.codigo = codigo
  }
}

async function leerRespuesta(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const det = data?.detail
    if (det && typeof det === 'object') throw new ApiError(det.mensaje || 'Error', det.codigo)
    throw new ApiError(typeof det === 'string' ? det : `Error ${res.status}`)
  }
  return data
}

export async function apiPost(ruta: string, body: any) {
  const res = await fetch(`${API}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return leerRespuesta(res)
}

export async function apiPostForm(ruta: string, form: FormData) {
  const res = await fetch(`${API}${ruta}`, { method: 'POST', body: form })
  return leerRespuesta(res)
}

export async function apiGet(ruta: string) {
  const res = await fetch(`${API}${ruta}`)
  return leerRespuesta(res)
}

// ─── Formato ────────────────────────────────────────────────────────────────
export function iniciales(nombre?: string | null) {
  const palabras = (nombre || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(p => p && !/\d/.test(p))
  if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase()
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  const digitos = (nombre || '').replace(/\D/g, '')
  return digitos ? digitos.slice(-2) : '?'
}

export function horaLista(fecha?: string | null) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ayer'
  if (differenceInCalendarDays(new Date(), d) < 7) return format(d, 'EEEE', { locale: es })
  return format(d, 'dd/MM/yy')
}

export function etiquetaDia(fecha: string) {
  const d = new Date(fecha)
  if (isToday(d)) return 'HOY'
  if (isYesterday(d)) return 'AYER'
  return format(d, "d 'de' MMMM yyyy", { locale: es }).toUpperCase()
}

export function tamanoLegible(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function nombrePlantilla(nombre: string) {
  return nombre.replace(/^notaria3_/, '').replace(/_hx[0-9a-f]+$/i, '').replace(/_/g, ' ')
}

// ─── Ventana de 24 h ────────────────────────────────────────────────────────
export type Ventana = { estado: 'open' | 'closing' | 'closed'; texto: string }

export function calcularVentana(ultimoEntrante: string | null | undefined, ahora = Date.now()): Ventana {
  if (!ultimoEntrante) return { estado: 'closed', texto: 'Ventana cerrada' }
  const restanteMs = new Date(ultimoEntrante).getTime() + 24 * 3600_000 - ahora
  if (restanteMs <= 0) return { estado: 'closed', texto: 'Ventana cerrada' }
  const horas = Math.floor(restanteMs / 3600_000)
  if (horas < 3) {
    const texto = horas >= 1 ? `Quedan ${horas} h` : `Quedan ${Math.max(1, Math.round(restanteMs / 60_000))} min`
    return { estado: 'closing', texto }
  }
  return { estado: 'open', texto: `Ventana abierta · ${horas} h` }
}

// ─── Archivos privados (URL firmada de Supabase Storage) ────────────────────
const cacheUrls = new Map<string, { url: string; vence: number }>()

export function useMediaUrl(ruta?: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!ruta) { setUrl(null); return }
    if (ruta.startsWith('http')) { setUrl(ruta); return }
    const enCache = cacheUrls.get(ruta)
    if (enCache && enCache.vence > Date.now()) { setUrl(enCache.url); return }

    let vivo = true
    createClient().storage.from(MEDIA_BUCKET).createSignedUrl(ruta, 3600).then(({ data }: any) => {
      if (!data?.signedUrl) return
      cacheUrls.set(ruta, { url: data.signedUrl, vence: Date.now() + 50 * 60_000 })
      if (vivo) setUrl(data.signedUrl)
    })
    return () => { vivo = false }
  }, [ruta])

  return url
}