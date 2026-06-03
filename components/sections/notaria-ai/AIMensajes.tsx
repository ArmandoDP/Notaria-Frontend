'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

interface Mensaje {
  role:    'user' | 'assistant'
  content: string
  acciones?: { nombre: string, resultado: string }[]
}

interface Props {
  historial: Mensaje[]
  cargando:  boolean
  pensando?: string
}

const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

export default function AIMensajes({ historial, cargando, pensando }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historial, cargando])

  const ICONOS: Record<string, string> = {
    buscar_tickets:              '🔍',
    ver_ticket:                  '📋',
    asignar_ticket:              '📌',
    enviar_whatsapp_cliente:     '💬',
    enviar_notificacion_interna: '🔔',
    generar_link_carga:          '🔗',
    revisar_expediente:          '✅',
    buscar_cliente:              '👤',
  }
  const LABELS: Record<string, string> = {
    buscar_tickets:              'Buscó tickets',
    ver_ticket:                  'Consultó ticket',
    asignar_ticket:              'Asignó ticket',
    enviar_whatsapp_cliente:     'Envió WhatsApp',
    enviar_notificacion_interna: 'Envió notificación',
    generar_link_carga:          'Generó link de carga',
    revisar_expediente:          'Revisó expediente',
    buscar_cliente:              'Buscó cliente',
  }

  return (
    <div className="flex-1 overflow-y-auto relative" style={{ background: '#F3F0FF' }}>

      {/* Aurora de fondo desde abajo */}
      <div className="fixed bottom-0 pointer-events-none" style={{ left: '290px', right: 0, height: '45%', zIndex: 0 }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '100%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(162,155,254,0.3) 0%, rgba(130,200,255,0.2) 35%, rgba(130,255,220,0.15) 60%, transparent 80%)',
          animation: 'auroraMove 9s ease-in-out infinite',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '20%',
          width: '55%', height: '80%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(253,121,168,0.25) 0%, rgba(255,240,150,0.15) 50%, transparent 75%)',
          animation: 'auroraMove2 12s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Mensajes */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-6 flex flex-col gap-4">
        {historial.map((m, i) => (
          <div key={i} className={`flex items-end gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {/* Avatar IA */}
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative"
                style={{ background: '#0A0814', border: '1px solid rgba(200,180,248,0.2)' }}>
                <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite', opacity: 0.25 }} />
                <div className="relative z-10" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#amStar)"/>
                    <defs><linearGradient id="amStar" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#C8B4F8"/><stop offset="50%" stopColor="#B4F8E4"/><stop offset="100%" stopColor="#F8C8E4"/></linearGradient></defs>
                  </svg>
                </div>
              </div>
            )}

            <div className="max-w-[72%] relative">

              {/* ── BURBUJA ASSISTANT ── */}
              {m.role === 'assistant' ? (
                <div className="relative">

                  {/* Borde arcoíris fluido */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    borderRadius: '4px 18px 18px 18px', padding: '1.5px',
                    background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#6C5CE7,#FF6B6B)',
                    backgroundSize: '300% 100%', animation: 'flowBorder 3s linear infinite',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .85,
                  }} />

                  {/* Glow interno */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    borderRadius: '4px 18px 18px 18px', padding: '6px',
                    background: 'linear-gradient(90deg,rgba(162,155,254,.18),rgba(253,121,168,.14),rgba(80,220,170,.14),rgba(162,155,254,.18))',
                    backgroundSize: '300% 100%', animation: 'flowBorder 4s linear infinite reverse',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .5,
                  }} />

                  {/* Auroras en orillas */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ borderRadius: '4px 18px 18px 18px' }}>
                    {[
                      { w:100,h:60, t:-15,l:-15, bg:'radial-gradient(circle,rgba(162,155,254,.45),rgba(130,200,255,.3),transparent 70%)', anim:'auroraMsg1 6s ease-in-out infinite' },
                      { w:90, h:60, t:-15,r:-10, bg:'radial-gradient(circle,rgba(255,150,80,.4),rgba(253,121,168,.3),transparent 70%)',   anim:'auroraMsg2 7s ease-in-out infinite' },
                      { w:80, h:50, b:-10,l:'30%',bg:'radial-gradient(circle,rgba(80,220,170,.4),rgba(69,183,209,.3),transparent 70%)',   anim:'auroraMsg3 8s ease-in-out infinite' },
                      { w:70, h:50, b:-8, r:'10%',bg:'radial-gradient(circle,rgba(255,210,80,.35),rgba(162,155,254,.3),transparent 70%)', anim:'auroraMsg1 5.5s ease-in-out infinite reverse' },
                    ].map((b, bi) => (
                      <div key={bi} style={{
                        position:'absolute', borderRadius:'50%', filter:'blur(20px)',
                        width:b.w, height:b.h, top:(b as any).t, left:(b as any).l,
                        bottom:(b as any).b, right:(b as any).r,
                        background:b.bg, animation:b.anim,
                      }} />
                    ))}
                  </div>

                  {/* Ola de agua — solo en el último mensaje assistant */}
                  {i === historial.length - 1 && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ borderRadius: '4px 18px 18px 18px' }}>
                      {[
                        { bg:'linear-gradient(to top,rgba(162,155,254,.55),rgba(69,183,209,.4),rgba(0,184,148,.3),transparent)',  anim:'waveUpMsg 1.6s cubic-bezier(.25,.46,.45,.94) forwards' },
                        { bg:'linear-gradient(to top,rgba(253,121,168,.45),rgba(255,217,61,.3),rgba(162,155,254,.2),transparent)', anim:'waveUpMsg2 1.9s cubic-bezier(.25,.46,.45,.94) .15s forwards' },
                        { bg:'linear-gradient(to top,rgba(80,220,170,.35),rgba(255,150,80,.25),rgba(69,183,209,.2),transparent)',  anim:'waveUpMsg3 2.2s cubic-bezier(.25,.46,.45,.94) .1s forwards' },
                      ].map((w, wi) => (
                        <div key={wi} style={{
                          position:'absolute', left:'-10%', right:'-10%', bottom:'-10px',
                          height:'120%', borderRadius:'45% 45% 0 0', filter:'blur(4px)',
                          background:w.bg, animation:w.anim,
                        }} />
                      ))}
                    </div>
                  )}

                  {/* Burbuja */}
                  <div className="px-4 py-3 text-[14px] leading-relaxed"
                    style={{
                      background: '#F3F0FF', color: '#1A1A2E',
                      borderRadius: '4px 18px 18px 18px',
                      boxShadow: '0 2px 12px rgba(120,80,255,0.08)',
                      wordBreak: 'break-word',
                      animation: 'rippleInMsg .9s cubic-bezier(.34,1.2,.64,1) forwards',
                    }}>
                    <ReactMarkdown components={{
                      h1: ({children}) => <div className="text-[16px] font-bold mb-2 mt-1" style={{ color: '#1A1A2E' }}>{children}</div>,
                      h2: ({children}) => <div className="text-[14px] font-bold mb-1.5 mt-2" style={{ color: '#1A1A2E' }}>{children}</div>,
                      h3: ({children}) => <div className="text-[13px] font-semibold mb-1 mt-1.5" style={{ color: '#333' }}>{children}</div>,
                      p:  ({children}) => <p className="mb-2 last:mb-0 leading-relaxed" style={{ color: '#1A1A2E' }}>{children}</p>,
                      ul: ({children}) => <ul className="mb-2 flex flex-col gap-1 pl-1">{children}</ul>,
                      ol: ({children}) => <ol className="mb-2 flex flex-col gap-1 pl-4 list-decimal">{children}</ol>,
                      li: ({children}) => (
                        <li className="flex items-start gap-2 leading-relaxed" style={{ color: '#1A1A2E' }}>
                          <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full" style={{ background: '#A29BFE' }} />
                          <span>{children}</span>
                        </li>
                      ),
                      strong: ({children}) => <strong style={{ color: '#6C5CE7', fontWeight: 700 }}>{children}</strong>,
                      em:     ({children}) => <em style={{ color: '#555', fontStyle: 'italic' }}>{children}</em>,
                      code:   ({children}) => (
                        <code className="px-1.5 py-0.5 rounded-md text-[12px] font-mono"
                          style={{ background: 'rgba(120,80,255,.1)', color: '#7C5CE7' }}>{children}</code>
                      ),
                      pre: ({children}) => (
                        <pre className="p-3 rounded-xl text-[12px] font-mono overflow-x-auto mb-2"
                          style={{ background: 'rgba(120,80,255,.08)', color: '#333', border: '1px solid rgba(120,80,255,.15)' }}>{children}</pre>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="pl-3 py-1 my-1.5 rounded-r-lg"
                          style={{ borderLeft: '3px solid #A29BFE', background: 'rgba(162,155,254,.08)', color: '#555' }}>{children}</blockquote>
                      ),
                      hr: () => <hr className="my-2" style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,.08)' }} />,
                    }}>
                      {m.content}
                    </ReactMarkdown>

                    {/* Badges acciones */}
                    {m.acciones && m.acciones.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-3 pt-3"
                        style={{ borderTop: '1px solid rgba(120,80,255,.1)' }}>
                        {m.acciones.map((a, ai) => (
                          <div key={ai} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-medium"
                            style={{ background: 'rgba(120,80,255,.08)', border: '1px solid rgba(120,80,255,.15)', color: '#7C5CE7' }}>
                            <span>{ICONOS[a.nombre] || '⚡'}</span>
                            <span>{LABELS[a.nombre] || a.nombre}</span>
                            <span className="ml-auto opacity-60">ejecutado</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              ) : (
                /* ── BURBUJA USER ── */
                <div className="px-4 py-3 text-[14px] leading-relaxed"
                  style={{
                    background: '#3D1F8F', color: '#fff',
                    borderRadius: '18px 4px 18px 18px',
                    boxShadow: '0 2px 16px rgba(120,80,255,.4)',
                    border: '1px solid rgba(160,120,255,.4)',
                    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                  }}>
                  {m.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {cargando && (
          <div className="flex items-end gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative"
              style={{ background: '#0A0814', border: '1px solid rgba(200,180,248,.2)' }}>
              <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite', opacity: .25 }} />
              <div className="relative z-10" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#amStar2)"/>
                  <defs><linearGradient id="amStar2" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#C8B4F8"/><stop offset="50%" stopColor="#B4F8E4"/><stop offset="100%" stopColor="#F8C8E4"/></linearGradient></defs>
                </svg>
              </div>
            </div>

            {/* Burbuja typing con borde fluido */}
            <div className="relative px-4 py-3" style={{ background: '#F3F0FF', borderRadius: '4px 18px 18px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                borderRadius: '4px 18px 18px 18px', padding: '1.5px',
                background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#6C5CE7,#FF6B6B)',
                backgroundSize: '300% 100%', animation: 'flowBorder 3s linear infinite',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .7,
              }} />
              {pensando ? (
                <div className="relative z-10 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(pi => (
                      <div key={pi} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: pi===0?'#A29BFE':pi===1?'#6BCB77':'#FD79A8', animation:`bounce 1.2s ease-in-out ${pi*.2}s infinite` }} />
                    ))}
                  </div>
                  <span className="text-[12px]" style={{ color: '#6C5CE7' }}>{pensando}</span>
                </div>
              ) : (
                <div className="relative z-10 flex gap-1.5 items-center h-5">
                  {[0,1,2].map(pi => (
                    <div key={pi} className="w-2 h-2 rounded-full"
                      style={{ background: pi===0?'#A29BFE':pi===1?'#6BCB77':'#FD79A8', animation:`bounce 1.2s ease-in-out ${pi*.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style jsx>{`
        @keyframes aiPastel   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiStar     { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.25)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.25)} }
        @keyframes bounce     { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes auroraMove { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:1} 50%{transform:translateX(-47%) scaleX(1.08);opacity:0.6} }
        @keyframes auroraMove2{ 0%,100%{transform:translateX(0);opacity:0.7} 50%{transform:translateX(8%);opacity:1} }
        @keyframes flowBorder { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes auroraMsg1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.7} 33%{transform:translate(12px,-8px) scale(1.15);opacity:1} 66%{transform:translate(-6px,6px) scale(.9);opacity:.8} }
        @keyframes auroraMsg2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.6} 40%{transform:translate(-12px,6px) scale(1.1);opacity:.9} 70%{transform:translate(8px,-8px) scale(1.05);opacity:.7} }
        @keyframes auroraMsg3 { 0%,100%{transform:translate(0,0) scale(1);opacity:.65} 50%{transform:translate(6px,12px) scale(1.2);opacity:.95} }
        @keyframes waveUpMsg  { 0%{transform:translateY(105%) scaleX(1.1);opacity:0} 20%{opacity:.65} 75%{transform:translateY(5%) scaleX(1.02);opacity:.5} 100%{transform:translateY(-115%) scaleX(.95);opacity:0} }
        @keyframes waveUpMsg2 { 0%{transform:translateY(115%) scaleX(1.08);opacity:0} 25%{opacity:.5} 78%{transform:translateY(8%) scaleX(1);opacity:.35} 100%{transform:translateY(-110%) scaleX(.9);opacity:0} }
        @keyframes waveUpMsg3 { 0%{transform:translateY(120%) scaleX(1.15);opacity:0} 30%{opacity:.4} 80%{transform:translateY(0%) scaleX(.98);opacity:.25} 100%{transform:translateY(-105%) scaleX(.88);opacity:0} }
        @keyframes rippleInMsg{ 0%{opacity:0;transform:scale(.9) translateY(6px)} 60%{transform:scale(1.01) translateY(-1px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  )
}