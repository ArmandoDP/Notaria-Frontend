'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Paso = 'email' | 'otp'

export default function LoginPage() {
  const [paso,    setPaso]    = useState<Paso>('email')
  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  async function handleEnviarOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    })

    if (error) {
      setError('No se encontró ese correo en el sistema. Contacta a tu administrador.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setPaso('otp')
    setLoading(false)
  }

  async function handleVerificarOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type:  'email',
    })

    if (error) {
      setError('Código incorrecto o expirado. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleReenviar() {
    setLoading(true)
    setError('')
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    setLoading(false)
    setOtp('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0A0A0F' }}>

      {/* Glow fondo */}
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
          <h1 className="text-2xl font-semibold text-white mb-1">
            {paso === 'email' ? 'Bienvenido' : 'Verifica tu correo'}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Notaría Pública No. 3 · Celaya, Gto.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{
            background:    'rgba(255,255,255,0.04)',
            border:        '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>

          {/* Paso 1 — Email */}
          {paso === 'email' && (
            <form onSubmit={handleEnviarOTP} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="tu@notaria3.com"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border:     '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              </div>

              <div className="px-4 py-3 rounded-xl text-[12px] leading-relaxed"
                style={{ background: 'rgba(184,130,10,0.1)', color: 'rgba(240,180,40,0.8)', border: '1px solid rgba(184,130,10,0.2)' }}>
                🔐 Te enviaremos un código de 6 dígitos a tu correo para verificar tu identidad.
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-[13px]"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !email.trim()}
                className="w-full py-3 rounded-xl text-[14px] font-semibold text-black transition-all disabled:opacity-40 cursor-pointer border-none mt-1"
                style={{ background: 'linear-gradient(135deg, #C8920A 0%, #F0B429 100%)' }}>
                {loading ? 'Enviando código...' : 'Enviar código →'}
              </button>
            </form>
          )}

          {/* Paso 2 — OTP */}
          {paso === 'otp' && (
            <form onSubmit={handleVerificarOTP} className="flex flex-col gap-4">

              {/* Info email */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(184,130,10,0.15)' }}>
                  ✉️
                </div>
                <div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Código enviado a</div>
                  <div className="text-[13px] font-medium text-white">{email}</div>
                </div>
                <button type="button" onClick={() => { setPaso('email'); setError(''); setOtp('') }}
                  className="ml-auto text-[11px] cursor-pointer border-none bg-transparent"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Cambiar
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-xl text-[28px] font-black text-white text-center tracking-[12px] outline-none transition-all font-mono"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border:     '1px solid rgba(255,255,255,0.08)',
                  }}
                />
                <div className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Revisa tu bandeja de entrada — válido por 10 minutos
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-[13px]"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-xl text-[14px] font-semibold text-black transition-all disabled:opacity-40 cursor-pointer border-none"
                style={{ background: 'linear-gradient(135deg, #C8920A 0%, #F0B429 100%)' }}>
                {loading ? 'Verificando...' : 'Entrar al sistema →'}
              </button>

              <button type="button" onClick={handleReenviar} disabled={loading}
                className="text-[12px] text-center cursor-pointer border-none bg-transparent transition-all"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                ¿No llegó el código? Reenviar
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  )
}