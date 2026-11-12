'use client'

import { useState } from 'react'
import t from './ticket.module.css'
import { Ic } from './ticketUi'

interface Props {
  documentos:      any[]
  ticket:          any
  apiUrl:          string
  conversacionId?: string | null
  onAviso?:        (texto: string, error?: boolean) => void
}

export default function TicketAlertas({ documentos, ticket, apiUrl, conversacionId, onAviso }: Props) {
  const [enviando, setEnviando] = useState<string | null>(null)
  const [enviados, setEnviados] = useState<string[]>([])

  const conAlerta = documentos.filter((d: any) =>
    d.datos_ocr?.estado_ia === 'rechazado' || d.datos_ocr?.estado_ia === 'revisar'
  )
  if (conAlerta.length === 0) return null

  const avisar = (texto: string, error = false) => (onAviso ? onAviso(texto, error) : alert(texto))

  async function notificar(doc: any, nombre: string, mensajeIA: string) {
    const telefono = ticket.partes?.[0]?.telefono
    const msg = `Hola, te escribimos de Notaría Pública No. 3. Tu documento *${nombre}* requiere atención: ${mensajeIA}. Por favor sube uno nuevo desde tu link de carga.`
    setEnviando(doc.id)
    try {
      // Por la API de Meta si hay conversación; si no, por el endpoint anterior
      const res = conversacionId
        ? await fetch(`${apiUrl}/api/meta/enviar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversacion_id: conversacionId, mensaje: msg }),
          })
        : await fetch(`${apiUrl}/api/twilio/enviar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono, mensaje: msg, conversacion_id: null }),
          })
      if (res.status === 409) {
        avisar('Pasaron más de 24 h desde el último mensaje del cliente. Usa "Enviar recordatorio".', true)
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        avisar(typeof err.detail === 'object' ? err.detail.mensaje : err.detail || 'No se pudo enviar el mensaje', true)
        return
      }
      setEnviados(prev => [...prev, doc.id])
      avisar('Mensaje enviado al cliente por WhatsApp')
    } catch {
      avisar('No hay conexión con el servidor', true)
    } finally {
      setEnviando(null)
    }
  }

  return (
    <section className={`${t.card} ${t.alerts}`}>
      <div className={t.alertsHead}>
        <Ic n="alert" size={18} />
        <div>
          <b>{conAlerta.length} documento{conAlerta.length !== 1 ? 's requieren' : ' requiere'} atención</b>
          <span>Revisión automática con inteligencia artificial</span>
        </div>
      </div>

      {conAlerta.map((doc: any, i: number) => {
        const estadoIA  = doc.datos_ocr?.estado_ia
        const mensajeIA = doc.datos_ocr?.mensaje_ia
        const nombre    = doc.doc_tipos_config?.nombre || 'Documento'
        const rechazado = estadoIA === 'rechazado'
        const enviado   = enviados.includes(doc.id)
        return (
          <div key={doc.id} className={t.alert} style={{ animationDelay: `${0.08 * i}s` }}>
            <span className={`${t.alertIc} ${rechazado ? '' : t.alertIcWarn}`}><Ic n={rechazado ? 'x' : 'alert'} size={14} sw={2.4} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4>{nombre} · <span style={{ fontWeight: 600, color: rechazado ? '#b42318' : '#3a3a3a' }}>{rechazado ? 'Rechazado' : 'Revisar'}</span></h4>
              {mensajeIA && <p>{mensajeIA}</p>}
              {doc.datos_ocr?.validaciones?.length > 0 && (
                <div className={t.checks}>
                  {doc.datos_ocr.validaciones.map((v: any, j: number) => (
                    <span key={j} className={`${t.check} ${v.valido === false ? t.checkBad : ''}`}>
                      {v.valido === true ? '✓ ' : v.valido === false ? '✕ ' : ''}{v.campo}: {v.mensaje}
                    </span>
                  ))}
                </div>
              )}
              {ticket.partes?.[0]?.telefono && (
                <button
                  type="button"
                  className={`${t.chipBtn} ${enviado ? t.chipOk : ''}`}
                  style={{ marginTop: 10 }}
                  disabled={enviando === doc.id}
                  onClick={() => notificar(doc, nombre, mensajeIA)}
                >
                  {enviando === doc.id ? <span className={t.spin} /> : <Ic n={enviado ? 'check' : 'wa'} size={13} />}
                  {enviado ? 'Cliente notificado' : 'Notificar al cliente por WhatsApp'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}