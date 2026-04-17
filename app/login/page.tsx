'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Correo o contraseña incorrectos'); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0A0A0F' }}>

      {/* Glow de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #C8920A 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C8920A 0%, #F0B429 100%)' }}>
            <span className="text-xl font-black text-black">N3</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Bienvenido</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Notaría Pública No. 3 · Celaya, Gto.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@notaria3.com"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder:text-white/20 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder:text-white/20 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-[13px]"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[14px] font-semibold text-black transition-all disabled:opacity-40 cursor-pointer border-none mt-1"
              style={{ background: loading ? '#92400E' : 'linear-gradient(135deg, #C8920A 0%, #F0B429 100%)' }}
            >
              {loading ? 'Entrando...' : 'Entrar al sistema'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  )
}