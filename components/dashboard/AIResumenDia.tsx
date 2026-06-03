'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  kpis: any
}

export default function AIResumenDia({ kpis }: Props) {
  const [resumen,  setResumen]  = useState('')
  const [cargando, setCargando] = useState(false)

  async function generarResumen() {
    setCargando(true)
    setResumen('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: `Genera un resumen ejecutivo del día para el notario basado en estos datos:
- Tickets nuevos hoy: ${kpis.ticketsHoy}
- En estado nuevo (sin asignar): ${kpis.ticketsNuevos}
- Asignados en proceso: ${kpis.ticketsAsignados}
- En folio DBA: ${kpis.ticketsFolioDBA}
- En escritura DBA: ${kpis.ticketsEscritura}
- Con SLA en riesgo (vencen en 3 días): ${kpis.ticketsUrgentes}
Sé breve, directo y profesional. Máximo 4 puntos concretos. Incluye recomendaciones de acción para hoy. Usa negritas para los puntos clave.`,
          historial: [],
        }),
      })
      const data = await res.json()
      setResumen(data.respuesta)
    } catch {
      setResumen('Error al generar el resumen. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      position: 'relative',
      borderRadius: '20px',
      overflow: 'hidden',
      background: '#F3F0FF',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 2px 24px rgba(120,80,255,0.1)',
    }}>

      {/* Borde fluido arcoíris */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '20px',
        padding: '2.5px', pointerEvents: 'none', zIndex: 3,
        background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#FDCB6E,#6C5CE7,#00B894,#FF6B6B)',
        backgroundSize: '300% 100%',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out' as any,
        maskComposite: 'exclude' as any,
        animation: 'flowBorder 3s linear infinite',
        opacity: 0.95,
      }} />

      {/* Glow interno suave */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '20px',
        padding: '7px', pointerEvents: 'none', zIndex: 3,
        background: 'linear-gradient(90deg,rgba(255,107,107,.18),rgba(162,155,254,.22),rgba(0,184,148,.18),rgba(253,121,168,.18),rgba(255,217,61,.13),rgba(255,107,107,.18))',
        backgroundSize: '300% 100%',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out' as any,
        maskComposite: 'exclude' as any,
        animation: 'flowBorder 4s linear infinite reverse',
        opacity: 0.55,
      }} />

      {/* Auroras blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '20px', zIndex: 1 }}>
        {[
          { w:200,h:130, t:-40,l:-30, bg:'radial-gradient(circle,rgba(162,155,254,.6),rgba(130,200,255,.4),transparent 70%)', anim:'auroraB1 6s ease-in-out infinite' },
          { w:180,h:140, t:-30,r:-20, bg:'radial-gradient(circle,rgba(255,150,80,.5),rgba(253,121,168,.4),transparent 70%)', anim:'auroraB2 7s ease-in-out infinite' },
          { w:160,h:110, b:-30,l:'10%', bg:'radial-gradient(circle,rgba(80,220,170,.5),rgba(69,183,209,.4),transparent 70%)', anim:'auroraB3 8s ease-in-out infinite' },
          { w:150,h:120, b:-20,r:'10%', bg:'radial-gradient(circle,rgba(255,210,80,.45),rgba(162,155,254,.4),transparent 70%)', anim:'auroraB4 5.5s ease-in-out infinite' },
          { w:120,h:90, t:'35%',l:'35%', bg:'radial-gradient(circle,rgba(253,121,168,.3),rgba(180,255,200,.3),transparent 70%)', anim:'auroraB1 9s ease-in-out infinite reverse' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', filter: 'blur(32px)',
            width: b.w, height: b.h,
            top: b.t, left: b.l, bottom: b.b, right: b.r,
            background: b.bg,
            animation: b.anim,
          }} />
        ))}
      </div>

      {/* Olas de agua al revelar respuesta */}
      {resumen && !cargando && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, overflow: 'hidden', borderRadius: '20px' }}>
          {[
            { bg:'linear-gradient(to top,rgba(162,155,254,.65),rgba(69,183,209,.45),rgba(0,184,148,.35),transparent)', anim:'waveUp 1.6s cubic-bezier(.25,.46,.45,.94) forwards' },
            { bg:'linear-gradient(to top,rgba(253,121,168,.55),rgba(255,217,61,.35),rgba(162,155,254,.25),transparent)', anim:'waveUp2 1.9s cubic-bezier(.25,.46,.45,.94) .15s forwards' },
            { bg:'linear-gradient(to top,rgba(80,220,170,.45),rgba(255,150,80,.35),rgba(69,183,209,.25),transparent)', anim:'waveUp3 2.2s cubic-bezier(.25,.46,.45,.94) .1s forwards' },
          ].map((w, i) => (
            <div key={i} style={{
              position: 'absolute', left: '-10%', right: '-10%', bottom: '-20px',
              height: '120%', borderRadius: '45% 45% 0 0', filter: 'blur(5px)',
              background: w.bg, animation: w.anim,
            }} />
          ))}
        </div>
      )}

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 5 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(120,80,255,.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(120,80,255,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg,#C8B4F8,#B4D8F8,#B4F8E4,#F8F4B4,#F8C8E4,#C8B4F8)',
                backgroundSize: '300% 300%', animation: 'flowBorder 4s linear infinite', opacity: .3,
              }} />
              <div style={{ position: 'relative', zIndex: 1, animation: 'aiStar 3s ease-in-out infinite' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#sg)"/>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="16" y2="16">
                    <stop offset="0%" stopColor="#A29BFE"/>
                    <stop offset="50%" stopColor="#6C5CE7"/>
                    <stop offset="100%" stopColor="#FD79A8"/>
                  </linearGradient></defs>
                </svg>
              </div>
            </div>
            <div style={{ marginLeft: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Notaría AI</div>
              <div style={{ fontSize: 10, color: 'rgba(80,60,140,.45)' }}>Resumen inteligente del día</div>
            </div>
          </div>

          <button onClick={generarResumen} disabled={cargando} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: cargando ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 700, color: '#fff', opacity: cargando ? .5 : 1,
            background: 'linear-gradient(135deg,#7C5CE7,#A29BFE,#FD79A8,#7C5CE7)',
            backgroundSize: '200% 200%', animation: 'flowBorder 3s linear infinite',
          }}>
            {cargando ? '✨ Analizando...' : resumen ? '✨ Analizar de nuevo' : '✨ Analizar día'}
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '16px 20px', minHeight: 80 }}>
          {!resumen && !cargando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(80,60,140,.4)' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: .35 }}>
                <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="#7C5CE7"/>
              </svg>
              Presiona "Analizar día" para obtener un resumen ejecutivo con recomendaciones
            </div>
          )}

          {cargando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[['#A29BFE',0],['#6BCB77',.2],['#FD79A8',.4]].map(([c,d],i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, animation: `bounce 1.2s ${d}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(80,60,140,.6)' }}>Procesando datos del día...</span>
            </div>
          )}

          {resumen && !cargando && (
            <div style={{
              background: 'rgba(255,255,255,.75)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid rgba(120,80,255,.15)', backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(120,80,255,.1)',
              animation: 'rippleIn .9s cubic-bezier(.34,1.2,.64,1) forwards',
            }}>
              <ReactMarkdown
                components={{
                  p:      ({children}) => <p style={{ fontSize: 12, lineHeight: 1.75, color: '#2D1B69', marginBottom: 8 }}>{children}</p>,
                  strong: ({children}) => <strong style={{ color: '#6C5CE7', fontWeight: 700 }}>{children}</strong>,
                  ul:     ({children}) => <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>{children}</ul>,
                  li:     ({children}) => (
                    <li style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.75, color: '#2D1B69', marginBottom: 8, animation: 'fadeSlide .6s ease forwards', opacity: 0 }}>
                      <span style={{ flexShrink: 0, marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: '#A29BFE', display: 'inline-block' }} />
                      <span>{children}</span>
                    </li>
                  ),
                }}>
                {resumen}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes flowBorder {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes aiStar {
          0%,100% { transform: rotate(0deg) scale(1); }
          25%     { transform: rotate(72deg) scale(1.3); }
          50%     { transform: rotate(144deg) scale(1); }
          75%     { transform: rotate(216deg) scale(1.3); }
        }
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-6px); }
        }
        @keyframes auroraB1 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .7; }
          33%     { transform: translate(30px,-20px) scale(1.2); opacity: 1; }
          66%     { transform: translate(-15px,15px) scale(.9); opacity: .8; }
        }
        @keyframes auroraB2 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .6; }
          40%     { transform: translate(-30px,12px) scale(1.15); opacity: .9; }
          70%     { transform: translate(20px,-18px) scale(1.05); opacity: .7; }
        }
        @keyframes auroraB3 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .65; }
          50%     { transform: translate(15px,25px) scale(1.25); opacity: .95; }
        }
        @keyframes auroraB4 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .55; }
          45%     { transform: translate(-20px,-25px) scale(1.1); opacity: .85; }
        }
        @keyframes waveUp {
          0%   { transform: translateY(105%) scaleX(1.15); opacity: 0; }
          20%  { opacity: .75; }
          75%  { transform: translateY(5%) scaleX(1.02); opacity: .6; }
          100% { transform: translateY(-115%) scaleX(.95); opacity: 0; }
        }
        @keyframes waveUp2 {
          0%   { transform: translateY(115%) scaleX(1.1); opacity: 0; }
          25%  { opacity: .6; }
          78%  { transform: translateY(8%) scaleX(1); opacity: .4; }
          100% { transform: translateY(-110%) scaleX(.9); opacity: 0; }
        }
        @keyframes waveUp3 {
          0%   { transform: translateY(125%) scaleX(1.2); opacity: 0; }
          30%  { opacity: .5; }
          80%  { transform: translateY(0%) scaleX(.98); opacity: .35; }
          100% { transform: translateY(-105%) scaleX(.88); opacity: 0; }
        }
        @keyframes rippleIn {
          0%   { opacity: 0; transform: scale(.9) translateY(8px); }
          60%  { transform: scale(1.01) translateY(-1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}