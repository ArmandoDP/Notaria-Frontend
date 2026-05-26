'use client'

import { useEffect, useRef } from 'react'

interface Mensaje {
  role:    'user' | 'assistant'
  content: string
}

interface Props {
  historial: Mensaje[]
  cargando:  boolean
}

const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

export default function AIMensajes({ historial, cargando }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historial, cargando])

  return (
    <div className="flex-1 overflow-y-auto relative" style={{ background: '#F3F0FF' }}>

      {/* Aurora muy tenue desde abajo */}
      <div className="fixed bottom-0 pointer-events-none" style={{ left: '290px', right: 0, height: '45%', zIndex: 0 }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '100%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(180,140,255,0.45) 0%, rgba(140,200,255,0.3) 35%, rgba(140,255,220,0.2) 60%, transparent 80%)',
          animation: 'auroraMove 9s ease-in-out infinite',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '20%',
          width: '55%', height: '80%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(255,160,210,0.35) 0%, rgba(255,240,150,0.2) 50%, transparent 75%)',
          animation: 'auroraMove2 12s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Mensajes */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-6 flex flex-col gap-4">
        {historial.map((m, i) => (
          <div key={i} className={`flex items-end gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative"
                style={{ background: '#0A0814', border: '1px solid rgba(200,180,248,0.2)', flexShrink: 0 }}>
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
              {/* Borde pastel sutil en mensajes IA */}
              {m.role === 'assistant' && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'destination-out', maskComposite: 'exclude',
                  padding: '1px', opacity: 0.4, borderRadius: '4px 18px 18px 18px',
                }} />
              )}
              <div className="px-4 py-3 text-[14px] leading-relaxed"
                style={{
                    background:   m.role === 'user' ? '#3D1F8F' : '#fff',
                    color:        m.role === 'user' ? '#fff' : '#1A1A2E',
                    borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    boxShadow:    m.role === 'user'
                        ? '0 2px 16px rgba(120,80,255,0.4)'
                        : '0 2px 8px rgba(0,0,0,0.08)',
                    border: m.role === 'user' ? '1px solid rgba(160,120,255,0.4)' : '1px solid rgba(180,140,255,0.15)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {/* Typing */}
        {cargando && (
          <div className="flex items-end gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative"
              style={{ background: '#0A0814', border: '1px solid rgba(200,180,248,0.2)' }}>
              <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 4s ease infinite', opacity: 0.25 }} />
              <div className="relative z-10" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#amStar2)"/>
                  <defs><linearGradient id="amStar2" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#C8B4F8"/><stop offset="50%" stopColor="#B4F8E4"/><stop offset="100%" stopColor="#F8C8E4"/></linearGradient></defs>
                </svg>
              </div>
            </div>
            <div className="px-4 py-3 relative" style={{ background: '#fff', borderRadius: '4px 18px 18px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'destination-out', maskComposite: 'exclude',
                padding: '1px', opacity: 0.4, borderRadius: '4px 18px 18px 18px',
              }} />
              <div className="flex gap-1.5 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: i===0?'#C8B4F8':i===1?'#B4F8E4':'#F8C8E4', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style jsx>{`
        @keyframes aiPastel { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiStar { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.25)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.25)} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes auroraMove { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:1} 50%{transform:translateX(-47%) scaleX(1.08);opacity:0.6} }
        @keyframes auroraMove2 { 0%,100%{transform:translateX(0);opacity:0.7} 50%{transform:translateX(8%);opacity:1} }
      `}</style>
    </div>
  )
}