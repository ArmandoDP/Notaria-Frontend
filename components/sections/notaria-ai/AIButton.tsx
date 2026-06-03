'use client'

interface Props {
  href?:    string
  onClick?: () => void
  label?:   string
  size?:    'sm' | 'md' | 'lg'
  variant?: 'button' | 'sidebar'
}

export default function AIButton({ href, onClick, label = 'Notaría AI', size = 'md', variant = 'button' }: Props) {
  const Tag     = (href ? 'a' : 'button') as any
  const padding = size === 'sm' ? '7px 12px' : size === 'lg' ? '13px 22px' : '9px 16px'
  const fSize   = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12.5px'

  if (variant === 'sidebar') {
    return (
      <Tag href={href} onClick={onClick}
        className="relative flex items-center gap-2 px-3 py-2 rounded-xl w-full overflow-hidden no-underline cursor-pointer border-none text-left"
        style={{ background: '#F3F0FF', minHeight: '36px' }}>

        {/* Borde arcoíris fluido */}
        <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
          padding: '1.5px',
          background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#6C5CE7,#FF6B6B)',
          backgroundSize: '300% 100%', animation: 'flowBorder 3s linear infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .85,
        }} />

        {/* Auroras */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {[
            { w:80,h:50, t:-10,l:-10, bg:'radial-gradient(circle,rgba(162,155,254,.5),rgba(130,200,255,.3),transparent 70%)', anim:'auroraB1 5s ease-in-out infinite' },
            { w:70,h:50, t:-10,r:-5,  bg:'radial-gradient(circle,rgba(255,150,80,.4),rgba(253,121,168,.3),transparent 70%)', anim:'auroraB2 6s ease-in-out infinite' },
            { w:60,h:40, b:-8,l:'30%',bg:'radial-gradient(circle,rgba(80,220,170,.4),rgba(69,183,209,.3),transparent 70%)', anim:'auroraB3 7s ease-in-out infinite' },
          ].map((b,i) => (
            <div key={i} style={{ position:'absolute', borderRadius:'50%', filter:'blur(12px)', width:b.w, height:b.h, top:b.t, left:b.l, bottom:b.b, right:b.r, background:b.bg, animation:b.anim }} />
          ))}
        </div>

        {/* Estrella */}
        <div className="relative z-10 flex-shrink-0" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#sbF)"/>
            <defs><linearGradient id="sbF" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#A29BFE"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#FD79A8"/></linearGradient></defs>
          </svg>
        </div>

        <span className="relative z-10 font-bold" style={{
          fontSize: fSize,
          background: 'linear-gradient(90deg,#7C5CE7,#A29BFE,#FD79A8,#7C5CE7)',
          backgroundSize: '200% 100%', animation: 'flowBorder 3s linear infinite',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {label}
        </span>

        <style jsx>{`
          @keyframes flowBorder { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes aiStar { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.25)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.25)} }
          @keyframes auroraB1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(8px,-5px) scale(1.1)} 66%{transform:translate(-5px,5px) scale(.95)} }
          @keyframes auroraB2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-8px,4px) scale(1.1)} 70%{transform:translate(5px,-5px) scale(1)} }
          @keyframes auroraB3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(5px,8px) scale(1.15)} }
        `}</style>
      </Tag>
    )
  }

  return (
    <Tag href={href} onClick={onClick}
      className="relative flex items-center justify-center gap-2 rounded-xl w-full overflow-hidden no-underline cursor-pointer border-none font-bold"
      style={{ padding, fontSize: fSize, background: '#F3F0FF', minHeight: '40px' }}>

      {/* Borde arcoíris fluido */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
        padding: '2px',
        background: 'linear-gradient(90deg,#FF6B6B,#FF9A3C,#FFD93D,#6BCB77,#45B7D1,#A29BFE,#FD79A8,#6C5CE7,#FF6B6B)',
        backgroundSize: '300% 100%', animation: 'flowBorder 3s linear infinite',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .9,
      }} />

      {/* Glow interno */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
        padding: '6px',
        background: 'linear-gradient(90deg,rgba(162,155,254,.2),rgba(253,121,168,.15),rgba(80,220,170,.15),rgba(162,155,254,.2))',
        backgroundSize: '300% 100%', animation: 'flowBorder 4s linear infinite reverse',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out' as any, maskComposite: 'exclude' as any, opacity: .6,
      }} />

      {/* Auroras */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        {[
          { w:100,h:60, t:-15,l:-15, bg:'radial-gradient(circle,rgba(162,155,254,.45),rgba(130,200,255,.3),transparent 70%)', anim:'auroraB1 5s ease-in-out infinite' },
          { w:90,h:60,  t:-15,r:-10, bg:'radial-gradient(circle,rgba(255,150,80,.4),rgba(253,121,168,.3),transparent 70%)', anim:'auroraB2 6s ease-in-out infinite' },
          { w:80,h:50,  b:-10,l:'30%',bg:'radial-gradient(circle,rgba(80,220,170,.4),rgba(69,183,209,.3),transparent 70%)', anim:'auroraB3 7s ease-in-out infinite' },
        ].map((b,i) => (
          <div key={i} style={{ position:'absolute', borderRadius:'50%', filter:'blur(16px)', width:b.w, height:b.h, top:b.t, left:b.l, bottom:b.b, right:b.r, background:b.bg, animation:b.anim }} />
        ))}
      </div>

      {/* Estrella */}
      <div className="relative z-10 flex-shrink-0" style={{ animation: 'aiStar 3s ease-in-out infinite' }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M8 0C8 0 8.8 3.5 10.5 5.5C12.2 7 16 8 16 8C16 8 12.2 9 10.5 10.5C8.8 12.5 8 16 8 16C8 16 7.2 12.5 5.5 10.5C3.8 9 0 8 0 8C0 8 3.8 7 5.5 5.5C7.2 3.5 8 0 8 0Z" fill="url(#btnF)"/>
          <defs><linearGradient id="btnF" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stopColor="#A29BFE"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#FD79A8"/></linearGradient></defs>
        </svg>
      </div>

      <span className="relative z-10" style={{
        background: 'linear-gradient(90deg,#7C5CE7,#A29BFE,#FD79A8,#FF9A3C,#7C5CE7)',
        backgroundSize: '200% 100%', animation: 'flowBorder 3s linear infinite',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        {label}
      </span>

      <style jsx>{`
        @keyframes flowBorder { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiStar { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(72deg) scale(1.25)} 50%{transform:rotate(144deg) scale(1)} 75%{transform:rotate(216deg) scale(1.25)} }
        @keyframes auroraB1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(10px,-8px) scale(1.1)} 66%{transform:translate(-6px,6px) scale(.95)} }
        @keyframes auroraB2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10px,6px) scale(1.1)} 70%{transform:translate(6px,-6px) scale(1)} }
        @keyframes auroraB3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(6px,10px) scale(1.15)} }
      `}</style>
    </Tag>
  )
}