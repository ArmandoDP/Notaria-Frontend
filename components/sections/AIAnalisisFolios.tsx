'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  query:      string
  tipo:       string
  resultados: any[]
  buscado?:   boolean  // ← nuevo prop opcional
}

export default function AIAnalisisFolios({ query, tipo, resultados }: Props) {
  const [resumen,  setResumen]  = useState('')
  const [cargando, setCargando] = useState(false)

  async function generarAnalisis() {
    setCargando(true)
    setResumen('')
    try {
      const resumenData = resultados.map(r => ({
        numero:    r.numero,
        tramite:   r.tramites_config?.nombre || 'Sin trámite',
        estado:    r.estado,
        area:      r.areas?.nombre || 'Sin área',
        clientes:  r.partes?.filter((p: any) => p.nombre_completo).map((p: any) => `${p.nombre_completo} (${p.rol})`).join(', ') || 'Sin partes',
        folio_dba: r.folio_dba || 'Sin folio DBA',
        folio_esc: r.folio_escritura || 'Sin folio escritura',
        fecha:     format(new Date(r.created_at), "d 'de' MMMM yyyy", { locale: es }),
      }))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/analizar-folios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          tipo,
          resultados: resumenData,
        }),
      })
      const data = await res.json()
      setResumen(data.resumen || 'No se pudo generar el análisis.')
    } catch {
      setResumen('Error al generar el análisis. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      position: 'relative', borderRadius: 20, overflow: 'hidden',
      background: '#F3F0FF', fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 2px 24px rgba(120,80,255,0.1)',
    }}>

      {/* Borde fluido arcoíris */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        padding: '2.5px', pointerEvents: 'none', zIndex: 3,
        background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#FDCB6E,#6C5CE7,#00B894,#FF6B6B)',
        backgroundSize: '300% 100%',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out' as any,
        maskComposite: 'exclude' as any,
        animation: 'flowBorderF 3s linear infinite', opacity: 0.95,
      }} />

      {/* Glow interno */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        padding: 7, pointerEvents: 'none', zIndex: 3,
        background: 'linear-gradient(90deg,rgba(255,107,107,.18),rgba(162,155,254,.22),rgba(0,184,148,.18),rgba(253,121,168,.18),rgba(255,217,61,.13),rgba(255,107,107,.18))',
        backgroundSize: '300% 100%',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out' as any,
        maskComposite: 'exclude' as any,
        animation: 'flowBorderF 4s linear infinite reverse', opacity: 0.55,
      }} />

      {/* Auroras */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 20, zIndex: 1 }}>
        {[
          { w:200,h:130,t:-40,l:-30,  bg:'radial-gradient(circle,rgba(162,155,254,.6),rgba(130,200,255,.4),transparent 70%)',  anim:'auroraF1b 6s ease-in-out infinite'         },
          { w:180,h:140,t:-30,r:-20,  bg:'radial-gradient(circle,rgba(255,150,80,.5),rgba(253,121,168,.4),transparent 70%)',  anim:'auroraF2b 7s ease-in-out infinite'         },
          { w:160,h:110,b:-30,l:'10%',bg:'radial-gradient(circle,rgba(80,220,170,.5),rgba(69,183,209,.4),transparent 70%)',   anim:'auroraF3b 8s ease-in-out infinite'         },
          { w:150,h:120,b:-20,r:'10%',bg:'radial-gradient(circle,rgba(255,210,80,.45),rgba(162,155,254,.4),transparent 70%)',anim:'auroraF4b 5.5s ease-in-out infinite'       },
          { w:120,h:90, t:'35%',l:'35%',bg:'radial-gradient(circle,rgba(253,121,168,.3),rgba(180,255,200,.3),transparent 70%)',anim:'auroraF1b 9s ease-in-out infinite reverse'},
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', filter: 'blur(32px)',
            width: b.w, height: b.h, top: (b as any).t, left: (b as any).l,
            bottom: (b as any).b, right: (b as any).r,
            background: b.bg, animation: b.anim,
          }} />
        ))}
      </div>

      {/* Olas de agua al revelar */}
      {!resumen && !cargando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(80,60,140,.4)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: .35 }}>
            <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="#7C5CE7"/>
            </svg>
            {resultados.length > 0
            ? 'Presiona "Analizar expedientes" para obtener un análisis profesional'
            : 'Realiza una búsqueda y presiona "Analizar expedientes" para obtener un análisis con IA'
            }
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
                backgroundSize: '300% 300%', animation: 'flowBorderF 4s linear infinite', opacity: .3,
              }} />
              <div style={{ position: 'relative', zIndex: 1, animation: 'aiStarF2 3s ease-in-out infinite' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#sgF2)"/>
                  <defs><linearGradient id="sgF2" x1="0" y1="0" x2="16" y2="16">
                    <stop offset="0%" stopColor="#A29BFE"/>
                    <stop offset="50%" stopColor="#6C5CE7"/>
                    <stop offset="100%" stopColor="#FD79A8"/>
                  </linearGradient></defs>
                </svg>
              </div>
            </div>
            <div style={{ marginLeft: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Notaría AI</div>
              <div style={{ fontSize: 10, color: 'rgba(80,60,140,.45)' }}>
                {resultados.length} expediente{resultados.length !== 1 ? 's' : ''} · Búsqueda: "{query}"
              </div>
            </div>
          </div>

          <button onClick={generarAnalisis} disabled={cargando || resultados.length === 0} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none',
            fontSize: 12, fontWeight: 700, color: '#fff', opacity: cargando || resultados.length === 0 ? .4 : 1,
            cursor: cargando || resultados.length === 0 ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg,#7C5CE7,#A29BFE,#FD79A8,#7C5CE7)',
            backgroundSize: '200% 200%', animation: 'flowBorderF 3s linear infinite',
          }}>
            {cargando ? '✨ Analizando...' : resumen ? '✨ Analizar de nuevo' : '✨ Analizar expedientes'}
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '16px 20px', minHeight: 80 }}>
          {!resumen && !cargando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(80,60,140,.4)' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: .35 }}>
                <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="#7C5CE7"/>
              </svg>
              Presiona "Analizar expedientes" para obtener un análisis profesional con recomendaciones
            </div>
          )}

          {cargando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[['#A29BFE',0],['#6BCB77',.2],['#FD79A8',.4]].map(([c,d],i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: c as string,
                    animation: `bounceF2 1.2s ${d}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(80,60,140,.6)' }}>Analizando expedientes con IA...</span>
            </div>
          )}

          {resumen && !cargando && (
            <div style={{
              background: 'rgba(255,255,255,.75)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid rgba(120,80,255,.15)', backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(120,80,255,.1)',
              animation: 'rippleInF 0.9s cubic-bezier(.34,1.2,.64,1) forwards',
            }}>
              <ReactMarkdown components={{
                p:      ({children}) => <p style={{ fontSize: 12, lineHeight: 1.75, color: '#2D1B69', marginBottom: 8 }}>{children}</p>,
                strong: ({children}) => <strong style={{ color: '#6C5CE7', fontWeight: 700 }}>{children}</strong>,
                ul:     ({children}) => <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>{children}</ul>,
                li:     ({children}) => (
                  <li style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.75, color: '#2D1B69', marginBottom: 8, animation: 'fadeSlideF .6s ease forwards', opacity: 0 }}>
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

      <style>{`
        @keyframes flowBorderF  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiStarF2     { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.3)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.3)} }
        @keyframes bounceF2     { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes auroraF1b    { 0%,100%{transform:translate(0,0) scale(1);opacity:.7} 33%{transform:translate(30px,-20px) scale(1.2);opacity:1} 66%{transform:translate(-15px,15px) scale(.9);opacity:.8} }
        @keyframes auroraF2b    { 0%,100%{transform:translate(0,0) scale(1);opacity:.6} 40%{transform:translate(-30px,12px) scale(1.15);opacity:.9} 70%{transform:translate(20px,-18px) scale(1.05);opacity:.7} }
        @keyframes auroraF3b    { 0%,100%{transform:translate(0,0) scale(1);opacity:.65} 50%{transform:translate(15px,25px) scale(1.25);opacity:.95} }
        @keyframes auroraF4b    { 0%,100%{transform:translate(0,0) scale(1);opacity:.55} 45%{transform:translate(-20px,-25px) scale(1.1);opacity:.85} }
        @keyframes waveUpF1     { 0%{transform:translateY(105%) scaleX(1.15);opacity:0} 20%{opacity:.75} 75%{transform:translateY(5%) scaleX(1.02);opacity:.6} 100%{transform:translateY(-115%) scaleX(.95);opacity:0} }
        @keyframes waveUpF2     { 0%{transform:translateY(115%) scaleX(1.1);opacity:0} 25%{opacity:.6} 78%{transform:translateY(8%) scaleX(1);opacity:.4} 100%{transform:translateY(-110%) scaleX(.9);opacity:0} }
        @keyframes waveUpF3     { 0%{transform:translateY(125%) scaleX(1.2);opacity:0} 30%{opacity:.5} 80%{transform:translateY(0%) scaleX(.98);opacity:.35} 100%{transform:translateY(-105%) scaleX(.88);opacity:0} }
        @keyframes rippleInF    { 0%{opacity:0;transform:scale(.9) translateY(8px)} 60%{transform:scale(1.01) translateY(-1px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeSlideF   { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}