'use client'

import { useState, useRef, } from 'react'

interface Props {
  input:       string
  cargando:    boolean
  onChange:    (val: string) => void
  onEnviar:    (imagenes?: {data: string, mime_type: string}[]) => void
  hayMensajes: boolean
}

const G = 'linear-gradient(135deg, #C8B4F8, #B4D8F8, #B4F8E4, #F8F4B4, #F8C8E4, #C8B4F8)'

export default function AIInput({ input, cargando, onChange, onEnviar, hayMensajes }: Props) {
  const [focused,   setFocused]   = useState(false)
  const [imagenes,  setImagenes]  = useState<{data: string, mime_type: string, preview: string}[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
  }

  function handleEnviar() {
    if (!input.trim() && imagenes.length === 0) return
    onEnviar(imagenes.length > 0 ? imagenes.map(i => ({ data: i.data, mime_type: i.mime_type })) : undefined)
    setImagenes([])
  }

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const nuevas = await Promise.all(files.map(async file => {
      return new Promise<{data: string, mime_type: string, preview: string}>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          const preview = reader.result as string
          resolve({ data: base64, mime_type: file.type, preview })
        }
        reader.readAsDataURL(file)
      })
    }))
    setImagenes(prev => [...prev, ...nuevas].slice(0, 4))
    if (fileRef.current) fileRef.current.value = ''
  }

  const puedeEnviar = (input.trim() || imagenes.length > 0) && !cargando
  

    const [dragging, setDragging] = useState(false)

    function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f =>
        f.type.startsWith('image/') || f.type === 'application/pdf'
    )
    if (files.length === 0) return
    Promise.all(files.map(file =>
        new Promise<{data: string, mime_type: string, preview: string}>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve({
            data:      (reader.result as string).split(',')[1],
            mime_type: file.type,
            preview:   reader.result as string,
        })
        reader.readAsDataURL(file)
        })
    )).then(nuevas => setImagenes(prev => [...prev, ...nuevas].slice(0, 4)))
    }

  return (
    <div className="flex-shrink-0 px-6 py-4 relative"
        style={{ background: '#F3F0FF', borderTop: '1px solid rgba(160,120,255,0.15)' }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
        onDrop={handleDrop}>

        {/* Overlay drag sobre el input */}
        {dragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl mx-6 my-2"
            style={{
                background: 'rgba(120,80,255,0.08)',
                border: '2px dashed rgba(160,120,255,0.5)',
                animation: 'dragPulse 1s ease-in-out infinite',
            }}>
            <div className="flex items-center gap-2">
                <span style={{ fontSize: '20px', animation: 'dragBounce 0.6s ease-in-out infinite alternate' }}>📎</span>
                <span className="text-[13px] font-semibold" style={{ color: '#7B5FD0' }}>
                Suelta aquí — múltiples archivos permitidos
                </span>
            </div>
            </div>
        )}
        
      {/* Preview imágenes */}
      {imagenes.length > 0 && (
        <div className="flex gap-2 mb-3 max-w-3xl mx-auto">
          {imagenes.map((img, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(160,120,255,0.3)' }}>
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setImagenes(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer border-none text-[9px] font-bold"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-3xl mx-auto">
        {/* Borde pastel animado */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          background: G, backgroundSize: '300% 300%', animation: 'aiPastel 5s ease infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out', maskComposite: 'exclude',
          padding: '1.5px', opacity: focused ? 0.9 : 0.5, transition: 'opacity 0.3s',
        }} />

        <div className="flex items-end gap-2 px-4 py-3 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Botón adjuntar */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none flex-shrink-0 transition-all mb-0.5"
            style={{ background: 'rgba(160,120,255,0.1)', color: '#7B5FD0' }}
            title="Adjuntar imagen o PDF">
            📎
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleArchivo} />

          <textarea
            value={input}
            onChange={e => {
                onChange(e.target.value)
                // Auto resize
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Pregunta sobre trámites, expedientes, documentos..."
            rows={1}
            className="flex-1 text-[14px] outline-none resize-none bg-transparent"
            style={{
                color:      '#1A1A2E',
                minHeight:  '24px',
                maxHeight:  '200px',
                height:     'auto',
                caretColor: '#C8B4F8',
                overflowY:  'auto',
            }}
          />

          <button onClick={handleEnviar} disabled={!puedeEnviar}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border-none flex-shrink-0 overflow-hidden relative transition-all mb-0.5"
            style={{ background: puedeEnviar ? '#0A0814' : '#F3F4F6', opacity: puedeEnviar ? 1 : 0.4 }}>
            {puedeEnviar && (
              <div className="absolute inset-0" style={{ background: G, backgroundSize: '300% 300%', animation: 'aiPastel 3s ease infinite', opacity: 0.6 }} />
            )}
            <span className="relative z-10 text-[15px]"
              style={{ color: puedeEnviar ? '#fff' : '#9CA3AF' }}>➤</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes aiPastel { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiPastel { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes dragPulse {
            0%, 100% { background: rgba(120,80,255,0.06); }
            50%       { background: rgba(120,80,255,0.12); }
        }
        @keyframes dragBounce {
            0%   { transform: translateY(0) scale(1); }
            100% { transform: translateY(-4px) scale(1.1); }
        }
      `}</style>
    </div>
  )
}