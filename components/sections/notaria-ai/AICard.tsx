'use client'

import { useEffect, useRef } from 'react'

interface Props {
  href?: string
}

export default function AICard({ href = '/notaria-ai' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width  = canvas.offsetWidth  || 246
    canvas.height = canvas.offsetHeight || 90

    const pastel = ['#C8B4F8','#B4D8F8','#B4F8E4','#F8F4B4','#F8C8E4','#B4C8F8','#FFD6F0','#fff']
    const particles = Array.from({ length: 30 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.5,
      vy:    (Math.random() - 0.5) * 0.5,
      size:  Math.random() * 2.5 + 0.5,
      color: pastel[Math.floor(Math.random() * pastel.length)],
      phase: Math.random() * Math.PI * 2,
    }))

    let frame: number, t = 0
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.012
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.3 + Math.sin(t + p.phase) * 0.3
        ctx.fill()
        if (p.size > 1.8) {
          ctx.globalAlpha *= 0.5
          ctx.fillRect(p.x - p.size * 2, p.y - 0.5, p.size * 4, 1)
          ctx.fillRect(p.x - 0.5, p.y - p.size * 2, 1, p.size * 4)
        }
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  // Estrellas flotantes
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const positions = [
      { top: '-8px',  left: '8%',  size: 9,  delay: '0s'   },
      { top: '-7px',  left: '40%', size: 6,  delay: '0.8s' },
      { top: '-10px', left: '70%', size: 10, delay: '1.4s' },
      { top: '-6px',  left: '88%', size: 5,  delay: '0.4s' },
      { top: '-9px',  left: '55%', size: 7,  delay: '2s'   },
    ]
    const stars = positions.map(pos => {
      const s = document.createElement('span')
      s.style.cssText = `position:absolute;top:${pos.top};left:${pos.left};width:${pos.size}px;height:${pos.size}px;pointer-events:none;z-index:20;animation:starFloat ${1.8 + Math.random() * 0.8}s ease-in-out ${pos.delay} infinite;`
      s.innerHTML = `<svg width="${pos.size}" height="${pos.size}" viewBox="0 0 16 16" fill="none"><path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#sg${pos.size})"/><defs><linearGradient id="sg${pos.size}" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stop-color="#C8B4F8"/><stop offset="50%" stop-color="#B4F8E4"/><stop offset="100%" stop-color="#F8C8E4"/></linearGradient></defs></svg>`
      wrap.appendChild(s)
      return s
    })
    return () => stars.forEach(s => s.remove())
  }, [])

  const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

  return (
    <div ref={wrapRef} className="relative px-2.5 pb-3 mt-1">
      <a href={href}
        className="relative flex flex-col items-center gap-2.5 rounded-2xl overflow-hidden no-underline cursor-pointer w-full"
        style={{ padding: '12px 10px', background: 'rgba(10,8,20,0.95)', textDecoration: 'none' }}>

        {/* Fondo pastel */}
        <div className="absolute inset-0"
          style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite', opacity: 0.2 }} />

        {/* Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.7 }} />

        {/* Borde pastel */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out', maskComposite: 'exclude', padding: '1.5px',
          }} />

        {/* Brillo top */}
        <div className="relative z-10 flex items-center gap-2">
            <div style={{ animation: 'aiStar 3s ease-in-out infinite', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z"
                    fill="url(#mainStar)"/>
                <defs>
                    <linearGradient id="mainStar" x1="0" y1="0" x2="16" y2="16">
                    <stop offset="0%" stopColor="#C8B4F8"/>
                    <stop offset="50%" stopColor="#B4F8E4"/>
                    <stop offset="100%" stopColor="#F8C8E4"/>
                    </linearGradient>
                </defs>
                </svg>
            </div>
            <div className="text-[14px] font-black tracking-tight"
                style={{
                background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                Notaría AI
            </div>
            </div>

        {/* Subtítulo */}
        <div className="relative z-10 text-[10px] text-center "
          style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '180px' }}>
          Consulta expedientes · Analiza documentos · Responde dudas notariales
        </div>

        {/* Badge */}
        <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B4F8E4', boxShadow: '0 0 6px #B4F8E4' }} />
          <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Powered by Notaria AI GPT-4o
          </span>
        </div>
      </a>

      <style jsx>{`
        @keyframes aiPastel {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes aiStar {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(72deg) scale(1.3); }
          50%  { transform: rotate(144deg) scale(1); }
          75%  { transform: rotate(216deg) scale(1.3); }
        }
        @keyframes starFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50%       { transform: translateY(-6px) scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}