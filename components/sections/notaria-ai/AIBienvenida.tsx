'use client'

import { useEffect, useRef } from 'react'

const SUGERENCIAS = [
  '¿Qué documentos necesita una compraventa con INFONAVIT?',
  '¿Cuál es el proceso para cancelar una hipoteca?',
  '¿Qué es un poder notarial amplio y para qué sirve?',
  '¿Cuánto tarda un testamento en la notaría?',
  '¿Qué documentos necesita una persona moral para una escritura?',
  '¿Qué es el régimen de separación de bienes?',
]

const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

interface Props {
  onSugerencia:  (texto: string) => void
  nombreUsuario?: string
  input:          string
  cargando:       boolean
  onChange:       (val: string) => void
  onEnviar:       () => void
}

export default function AIBienvenida({ onSugerencia, nombreUsuario, input, cargando, onChange, onEnviar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width  = 160
    canvas.height = 160

    const pastel = ['#C8B4F8','#B4D8F8','#B4F8E4','#F8C8E4','#F8F4B4']
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * 160, y: Math.random() * 160,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 0.5,
      color: pastel[Math.floor(Math.random() * pastel.length)],
      phase: Math.random() * Math.PI * 2,
    }))

    let frame: number, t = 0
    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, 160, 160)
      t += 0.01
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = 160; if (p.x > 160) p.x = 0
        if (p.y < 0) p.y = 160; if (p.y > 160) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.25 + Math.sin(t + p.phase) * 0.25
        ctx.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const pos = [
      { top: '-14px', left: '10%',  size: 12, delay: '0s'   },
      { top: '-10px', left: '40%',  size: 8,  delay: '0.8s' },
      { top: '-16px', left: '70%',  size: 14, delay: '1.5s' },
      { top: '-8px',  left: '88%',  size: 6,  delay: '0.4s' },
      { top: '-12px', left: '55%',  size: 10, delay: '2.1s' },
    ]
    const stars = pos.map(p => {
      const s = document.createElement('span')
      s.style.cssText = `position:absolute;top:${p.top};left:${p.left};width:${p.size}px;height:${p.size}px;pointer-events:none;z-index:20;animation:starFloat ${2 + Math.random()}s ease-in-out ${p.delay} infinite;`
      s.innerHTML = `<svg width="${p.size}" height="${p.size}" viewBox="0 0 16 16" fill="none"><path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#bs${p.size})"/><defs><linearGradient id="bs${p.size}" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stop-color="#C8B4F8"/><stop offset="50%" stop-color="#B4F8E4"/><stop offset="100%" stop-color="#F8C8E4"/></linearGradient></defs></svg>`
      wrap.appendChild(s)
      return s
    })
    return () => stars.forEach(s => s.remove())
  }, [])

  const hora   = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = nombreUsuario?.split(' ')[0] || ''

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnviar() }
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden"
      style={{ background: '#F3F0FF' }}>

      {/* Aurora de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', bottom: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '90%', height: '70%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(180,140,255,0.45) 0%, rgba(140,200,255,0.3) 25%, rgba(140,255,220,0.2) 50%, transparent 75%)',
          animation: 'auroraMove 8s ease-in-out infinite',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', left: '25%',
          width: '60%', height: '50%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(255,160,210,0.35) 0%, rgba(255,240,150,0.2) 45%, transparent 70%)',
          animation: 'auroraMove2 11s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', right: '15%',
          width: '45%', height: '45%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(140,200,255,0.3) 0%, transparent 65%)',
          animation: 'auroraMove3 13s ease-in-out infinite',
          filter: 'blur(55px)',
        }} />
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-3xl px-8">

        {/* Ícono + saludo */}
        <div ref={wrapRef} className="relative flex flex-col items-center gap-4">
          <div className="relative w-[90px] h-[90px] rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ background: '#0A0814' }}>
            <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite', opacity: 0.2 }} />
            <div className="absolute inset-0 rounded-3xl" style={{
              background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out', maskComposite: 'exclude', padding: '2px',
            }} />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.8 }} />
            <div className="relative z-10" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
              <svg width="38" height="38" viewBox="0 0 16 16" fill="none">
                <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#bigStar)"/>
                <defs>
                  <linearGradient id="bigStar" x1="0" y1="0" x2="16" y2="16">
                    <stop offset="0%" stopColor="#C8B4F8"/>
                    <stop offset="50%" stopColor="#B4F8E4"/>
                    <stop offset="100%" stopColor="#F8C8E4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[32px] font-black tracking-tight mb-1"
              style={{
                background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
              {saludo}{nombre ? `, ${nombre}` : ''}
            </div>
            <div className="text-[15px]" style={{ color: '#666' }}>
              ¿En qué puedo ayudarte hoy?
            </div>
          </div>
        </div>

        {/* Sugerencias */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          {SUGERENCIAS.map((s, i) => (
            <button key={i} onClick={() => onSugerencia(s)}
              className="text-left px-4 py-3 rounded-2xl text-[12.5px] cursor-pointer border-none transition-all hover:-translate-y-0.5 relative overflow-hidden"
              style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" style={{
                background: G, backgroundSize: '300% 300%', animation: 'aiPastel 3s ease infinite',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'destination-out', maskComposite: 'exclude', padding: '1px',
              }} />
              <span className="relative z-10" style={{ color: '#555' }}>{s}</span>
            </button>
          ))}
        </div>

        {/* Input centrado en bienvenida */}
        <div className="w-full relative">
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out', maskComposite: 'exclude',
            padding: '1.5px', opacity: 0.35,
          }} />
          <div className="flex items-end gap-3 px-4 py-3 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <textarea
              value={input}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta aquí..."
              rows={1}
              className="flex-1 text-[14px] outline-none resize-none bg-transparent"
              style={{ color: '#1A1A2E', maxHeight: '120px', caretColor: '#C8B4F8' }}
            />
            <button onClick={onEnviar} disabled={!input.trim() || cargando}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border-none flex-shrink-0 overflow-hidden relative transition-all"
              style={{ background: '#0A0814', opacity: input.trim() && !cargando ? 1 : 0.3 }}>
              {input.trim() && !cargando && (
                <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 3s ease infinite', opacity: 0.7 }} />
              )}
              <span className="relative z-10 text-[15px] text-white">➤</span>
            </button>
          </div>
        </div>

        <div className="text-[11.5px]" style={{ color: 'rgba(0,0,0,0.6)' }}>
          Powered by Notaria AI GPT-4o · Solo uso interno · Notaría Pública No. 3
        </div>
      </div>

      <style jsx>{`
        @keyframes aiPastel { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiStar { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.3)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.3)} }
        @keyframes starFloat { 0%,100%{transform:translateY(0) scale(1);opacity:0.4} 50%{transform:translateY(-8px) scale(1.3);opacity:1} }
        @keyframes auroraMove { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:1} 50%{transform:translateX(-47%) scaleX(1.08);opacity:0.7} }
        @keyframes auroraMove2 { 0%,100%{transform:translateX(0) scaleX(1);opacity:0.8} 50%{transform:translateX(8%) scaleX(0.92);opacity:1} }
        @keyframes auroraMove3 { 0%,100%{transform:scaleX(1);opacity:0.7} 50%{transform:scaleX(1.12);opacity:1} }
      `}</style>
    </div>
  )
}