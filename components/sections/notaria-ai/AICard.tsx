'use client'

interface Props {
  href?: string
}

export default function AICard({ href = '/notaria-ai' }: Props) {
  return (
    <div className="relative px-2.5 pb-3 mt-1">
      <a href={href}
        className="relative flex flex-col items-center gap-2.5 rounded-2xl overflow-hidden no-underline cursor-pointer w-full"
        style={{ padding: '14px 12px', background: '#F3F0FF', textDecoration: 'none' }}>

        {/* Borde arcoíris fluido */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          padding: '2px',
          background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#6C5CE7,#FF6B6B)',
          backgroundSize: '300% 100%', animation: 'flowBorder 3s linear infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .9,
        }} />

        {/* Glow interno */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          padding: '7px',
          background: 'linear-gradient(90deg,rgba(162,155,254,.18),rgba(253,121,168,.15),rgba(80,220,170,.15),rgba(162,155,254,.18))',
          backgroundSize: '300% 100%', animation: 'flowBorder 4s linear infinite reverse',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .55,
        }} />

        {/* Auroras */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {[
            { w:130,h:90, t:-25,l:-20, bg:'radial-gradient(circle,rgba(162,155,254,.55),rgba(130,200,255,.35),transparent 70%)', anim:'aB1 6s ease-in-out infinite' },
            { w:120,h:90, t:-20,r:-15, bg:'radial-gradient(circle,rgba(255,150,80,.45),rgba(253,121,168,.35),transparent 70%)', anim:'aB2 7s ease-in-out infinite' },
            { w:110,h:75, b:-20,l:'15%', bg:'radial-gradient(circle,rgba(80,220,170,.45),rgba(69,183,209,.35),transparent 70%)', anim:'aB3 8s ease-in-out infinite' },
            { w:100,h:80, b:-15,r:'10%', bg:'radial-gradient(circle,rgba(255,210,80,.4),rgba(162,155,254,.35),transparent 70%)', anim:'aB4 5.5s ease-in-out infinite' },
          ].map((b,i) => (
            <div key={i} style={{ position:'absolute', borderRadius:'50%', filter:'blur(28px)', width:b.w, height:b.h, top:b.t, left:b.l, bottom:b.b, right:b.r, background:b.bg, animation:b.anim }} />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-2">
          <div style={{ animation: 'aiStar 3s ease-in-out infinite', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#cStar)"/>
              <defs><linearGradient id="cStar" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#A29BFE"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#FD79A8"/></linearGradient></defs>
            </svg>
          </div>
          <div className="text-[14px] font-black tracking-tight" style={{
            background: 'linear-gradient(90deg,#7C5CE7,#A29BFE,#FD79A8,#FF9A3C,#7C5CE7)',
            backgroundSize: '200% 100%', animation: 'flowBorder 3s linear infinite',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Notaría AI
          </div>
        </div>

        {/* Subtítulo */}
        <div className="relative z-10 text-[10px] text-center"
          style={{ color: 'rgba(80,60,140,.5)', maxWidth: '180px', lineHeight: 1.5 }}>
          Consulta expedientes · Analiza documentos · Responde dudas notariales
        </div>

        {/* Badge */}
        <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(120,80,255,.08)', border: '1px solid rgba(120,80,255,.15)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6C5CE7' }} />
          <span className="text-[9px] font-semibold" style={{ color: 'rgba(80,60,140,.5)' }}>
            Powered by Notaría AI GPT-4o
          </span>
        </div>

        <style jsx>{`
          @keyframes flowBorder { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes aiStar { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.3)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.3)} }
          @keyframes aB1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.7} 33%{transform:translate(15px,-10px) scale(1.15);opacity:1} 66%{transform:translate(-8px,8px) scale(.9);opacity:.8} }
          @keyframes aB2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.6} 40%{transform:translate(-15px,8px) scale(1.1);opacity:.9} 70%{transform:translate(10px,-10px) scale(1.05);opacity:.7} }
          @keyframes aB3 { 0%,100%{transform:translate(0,0) scale(1);opacity:.65} 50%{transform:translate(10px,15px) scale(1.2);opacity:.95} }
          @keyframes aB4 { 0%,100%{transform:translate(0,0) scale(1);opacity:.55} 45%{transform:translate(-10px,-15px) scale(1.1);opacity:.85} }
        `}</style>
      </a>
    </div>
  )
}