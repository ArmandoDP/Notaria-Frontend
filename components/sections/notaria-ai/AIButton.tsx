'use client'

import { useEffect, useRef } from 'react'

interface Props {
  href?:    string
  onClick?: () => void
  label?:   string
  size?:    'sm' | 'md' | 'lg'
  variant?: 'button' | 'sidebar'
}

export default function AIButton({
  href,
  onClick,
  label   = 'Notaría AI',
  size    = 'md',
  variant = 'button',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  // Partículas internas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width  = canvas.offsetWidth  || 200
    canvas.height = canvas.offsetHeight || 40

    const pastel = ['#C8B4F8', '#B4E4F8', '#B4F8D8', '#F8E4B4', '#F8B4D4', '#B4C8F8', '#F8F4B4', '#FFD6F0']
    const particles = Array.from({ length: 20 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    (Math.random() - 0.5) * 0.4,
      size:  Math.random() * 2 + 0.5,
      color: pastel[Math.floor(Math.random() * pastel.length)],
      phase: Math.random() * Math.PI * 2,
    }))

    let frame: number
    let t = 0
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
        ctx.globalAlpha = 0.35 + Math.sin(t + p.phase) * 0.35
        ctx.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  // Estrellas flotantes FUERA del botón
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const stars: HTMLSpanElement[] = []
    const positions = [
      { top: '-8px',  left: '10%',  size: 8,  delay: '0s'    },
      { top: '-6px',  left: '75%',  size: 6,  delay: '0.6s'  },
      { top: '-10px', left: '45%',  size: 10, delay: '1.2s'  },
      { top: '-5px',  left: '90%',  size: 5,  delay: '0.3s'  },
      { top: '-9px',  left: '25%',  size: 7,  delay: '1.8s'  },
    ]

    positions.forEach(pos => {
      const star = document.createElement('span')
      star.style.cssText = `
        position: absolute;
        top: ${pos.top};
        left: ${pos.left};
        width: ${pos.size}px;
        height: ${pos.size}px;
        pointer-events: none;
        z-index: 20;
        animation: starFloat ${2 + Math.random()}s ease-in-out ${pos.delay} infinite;
      `
      star.innerHTML = `<svg width="${pos.size}" height="${pos.size}" viewBox="0 0 16 16" fill="none">
        <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="white" opacity="0.9"/>
      </svg>`
      wrap.appendChild(star)
      stars.push(star)
    })

    return () => stars.forEach(s => s.remove())
  }, [])

  // Gradiente pastel suave tipo Apple Intelligence
  const PASTEL_GRADIENT = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

  const Tag     = (href ? 'a' : 'button') as any
  const padding = size === 'sm' ? '7px 12px' : size === 'lg' ? '13px 22px' : '9px 16px'
  const fSize   = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12.5px'

  if (variant === 'sidebar') {
    return (
      <div ref={wrapRef} className="relative" style={{ marginBottom: '2px' }}>
        <Tag href={href} onClick={onClick}
          className="relative flex items-center gap-2 px-3 py-2 rounded-xl w-full overflow-hidden no-underline cursor-pointer border-none text-left"
          style={{ background: 'rgba(255,255,255,0.06)', minHeight: '36px' }}>

          {/* Fondo pastel animado */}
          <div className="absolute inset-0"
            style={{
              background: PASTEL_GRADIENT,
              backgroundSize: '300% 300%',
              animation: 'aiPastel 5s ease infinite',
              opacity: 0.18,
            }} />

          {/* Borde pastel */}
          <div className="absolute inset-0 rounded-xl"
            style={{
              background: PASTEL_GRADIENT,
              backgroundSize: '300% 300%',
              animation: 'aiPastel 5s ease infinite',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out',
              maskComposite: 'exclude',
              padding: '1px',
              opacity: 0.6,
            }} />

          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }} />

          {/* Estrella */}
          <div className="relative z-10 flex-shrink-0" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z"
                fill="url(#pastelFill)"/>
              <defs>
                <linearGradient id="pastelFill" x1="0" y1="0" x2="16" y2="16">
                  <stop offset="0%" stopColor="#C8B4F8"/>
                  <stop offset="50%" stopColor="#B4F8E4"/>
                  <stop offset="100%" stopColor="#F8C8E4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <span className="relative z-10 text-[12.5px] font-bold"
            style={{
              background: PASTEL_GRADIENT,
              backgroundSize: '300% 300%',
              animation: 'aiPastel 5s ease infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            {label}
          </span>
        </Tag>

        <style jsx>{`
          @keyframes aiPastel {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes aiStar {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25%  { transform: rotate(72deg) scale(1.25); }
            50%  { transform: rotate(144deg) scale(1); }
            75%  { transform: rotate(216deg) scale(1.25); }
          }
          @keyframes starFloat {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
            50%       { transform: translateY(-5px) scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <Tag href={href} onClick={onClick}
        className="relative flex items-center justify-center gap-2 rounded-xl w-full overflow-hidden no-underline cursor-pointer border-none font-bold"
        style={{ padding, fontSize: fSize, background: 'rgba(15,10,25,0.9)', minHeight: '40px' }}>

        {/* Fondo pastel */}
        <div className="absolute inset-0"
          style={{
            background: PASTEL_GRADIENT,
            backgroundSize: '300% 300%',
            animation: 'aiPastel 4s ease infinite',
            opacity: 0.25,
          }} />

        {/* Canvas partículas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }} />

        {/* Borde pastel */}
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: PASTEL_GRADIENT,
            backgroundSize: '300% 300%',
            animation: 'aiPastel 4s ease infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
            padding: '1.5px',
          }} />

        {/* Brillo suave */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,180,248,0.15) 0%, transparent 60%)' }} />

        {/* Estrella con gradiente pastel */}
        <div className="relative z-10 flex-shrink-0" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z"
              fill="url(#pastelStar)"/>
            <defs>
              <linearGradient id="pastelStar" x1="0" y1="0" x2="16" y2="16">
                <stop offset="0%" stopColor="#C8B4F8"/>
                <stop offset="50%" stopColor="#B4F8E4"/>
                <stop offset="100%" stopColor="#F8C8E4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Texto con gradiente */}
        <span className="relative z-10"
          style={{
            background: PASTEL_GRADIENT,
            backgroundSize: '300% 300%',
            animation: 'aiPastel 4s ease infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          {label}
        </span>

        <style jsx>{`
          @keyframes aiPastel {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes aiStar {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25%  { transform: rotate(72deg) scale(1.25); }
            50%  { transform: rotate(144deg) scale(1); }
            75%  { transform: rotate(216deg) scale(1.25); }
          }
          @keyframes starFloat {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.5; }
            50%       { transform: translateY(-6px) scale(1.3); opacity: 1; }
          }
        `}</style>
      </Tag>
    </div>
  )
}