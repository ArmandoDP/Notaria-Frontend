'use client'

import { useState } from 'react'

interface Props {
  input:       string
  cargando:    boolean
  onChange:    (val: string) => void
  onEnviar:    () => void
  hayMensajes: boolean
}

const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

export default function AIInput({ input, cargando, onChange, onEnviar, hayMensajes }: Props) {
  const [focused, setFocused] = useState(false)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnviar() }
  }

  return (
    <div className="flex-shrink-0 px-6 py-4"
      style={{ background: '#F3F0FF', borderTop: '1px solid rgba(160,120,255,0.15)' }}>

      <div className="relative max-w-3xl mx-auto">
        {/* Borde pastel animado */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          background: G, backgroundSize: '300% 300%',
          animation: 'aiPastel 5s ease infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out', maskComposite: 'exclude',
          padding: '1.5px', opacity: focused ? 0.9 : 0.5,
          transition: 'opacity 0.3s',
        }} />

        <div className="flex items-end gap-3 px-4 py-3 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <textarea
            value={input}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Pregunta sobre trámites, expedientes, documentos..."
            rows={1}
            className="flex-1 text-[14px] outline-none resize-none bg-transparent"
            style={{ color: '#1A1A2E', maxHeight: '140px', caretColor: '#C8B4F8' }}
          />
          <button onClick={onEnviar} disabled={!input.trim() || cargando}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border-none flex-shrink-0 overflow-hidden relative transition-all"
            style={{ background: input.trim() && !cargando ? '#0A0814' : '#F3F4F6', opacity: input.trim() && !cargando ? 1 : 0.4 }}>
            {input.trim() && !cargando && (
              <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 3s ease infinite', opacity: 0.6 }} />
            )}
            <span className="relative z-10 text-[15px]"
              style={{ color: input.trim() && !cargando ? '#fff' : '#9CA3AF' }}>➤</span>
          </button>
              </div>
          </div>
          <div className="text-[12px] py-3 text-center" style={{ color: 'rgba(0,0,0,0.6)' }}>
          Powered by Notaria AI GPT-4o · Solo uso interno · Notaría Pública No. 3
            </div>
      
      

      <style jsx>{`
        @keyframes aiPastel { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>
    </div>
  )
}