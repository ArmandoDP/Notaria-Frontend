'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Paso = 'email' | 'otp'

const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif'
const TINTA = '#111111'
const GRIS = '#6b6b6b'
const LINEA = '#e2e2df'
const ROJO = '#b42318'
const ESPERA_REENVIO = 60

export default function LoginPage() {
  const [paso,     setPaso]     = useState<Paso>('email')
  const [email,    setEmail]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [error,    setError]    = useState('')
  const [aviso,    setAviso]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [espera,   setEspera]   = useState(0)
  const [enfocado, setEnfocado] = useState(false)

  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const otpRef   = useRef<HTMLInputElement>(null)

  // Cuenta regresiva para reenviar
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  async function handleEnviarOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError('')
    setAviso('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    if (error) {
      setError('No encontramos ese correo en el sistema. Contacta a tu administrador.')
      return
    }
    setOtp('')
    setPaso('otp')
    setEspera(ESPERA_REENVIO)
    setTimeout(() => otpRef.current?.focus(), 50)
  }

  async function verificar(codigo: string) {
    if (codigo.length < 6 || loading) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codigo,
      type:  'email',
    })

    if (error) {
      setError('El código es incorrecto o ya expiró. Intenta de nuevo.')
      setOtp('')
      setLoading(false)
      setTimeout(() => otpRef.current?.focus(), 50)
      return
    }
    router.push('/')
    router.refresh()
  }

  function handleVerificarOTP(e: React.FormEvent) {
    e.preventDefault()
    verificar(otp)
  }

  function alEscribirCodigo(valor: string) {
    const limpio = valor.replace(/\D/g, '').slice(0, 6)
    setOtp(limpio)
    if (error) setError('')
    if (limpio.length === 6) verificar(limpio)
  }

  async function handleReenviar() {
    if (espera > 0 || loading) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } })
    setLoading(false)
    setOtp('')
    if (error) {
      setError('No se pudo reenviar el código. Espera un momento e intenta otra vez.')
      return
    }
    setAviso('Te enviamos un código nuevo.')
    setEspera(ESPERA_REENVIO)
    otpRef.current?.focus()
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#fff', color: TINTA }}>
      <style>{`
        @keyframes lgRise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes lgCaret { 50% { opacity: 0 } }
        @keyframes lgSpin { to { transform: rotate(360deg) } }
        .lg-anim { animation: lgRise .45s cubic-bezier(.2,.8,.2,1) both }
        .lg-input:focus { border-color: ${TINTA} !important; box-shadow: 0 0 0 3px rgba(17,17,17,.08) }
        .lg-btn:hover:not(:disabled) { background: #2b2b2b !important }
        .lg-link:hover:not(:disabled) { color: ${TINTA} !important }
        @media (prefers-reduced-motion: reduce) { .lg-anim, .lg-caret { animation: none !important } }
      `}</style>

      {/* ── Panel institucional ── */}
      <aside className="relative flex-shrink-0 lg:w-[44%] xl:w-[42%] flex flex-col justify-between px-8 py-8 lg:px-14 lg:py-12 overflow-hidden"
        style={{ background: TINTA, color: '#fff' }}>
        {/* Marco fino tipo documento */}
        <div className="hidden lg:block absolute pointer-events-none" style={{ inset: 24, border: '1px solid rgba(255,255,255,0.08)' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center"
            style={{ background: '#fff', color: TINTA, borderRadius: 8, fontFamily: SERIF, fontSize: 18, fontWeight: 600 }}>
            N3
          </div>
          <div className="lg:hidden">
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600 }}>Notaría Pública No. 3</div>
            <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Celaya, Guanajuato</div>
          </div>
        </div>

        <div className="relative hidden lg:block lg-anim">
          <div className="text-[11px] font-semibold uppercase mb-5" style={{ letterSpacing: 3, color: 'rgba(255,255,255,0.45)' }}>
            Plataforma interna
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 46, lineHeight: 1.08, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>
            Notaría Pública<br />No. 3
          </h2>
          <div className="my-7" style={{ width: 56, height: 1, background: 'rgba(255,255,255,0.35)' }} />
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Celaya, Guanajuato. Gestión de trámites, expedientes y atención a clientes en un solo lugar.
          </p>
        </div>

        <div className="relative hidden lg:flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Acceso restringido al personal autorizado
        </div>
      </aside>

      {/* ── Formulario ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16">
        <div key={paso} className="w-full max-w-[380px] lg-anim">

          {paso === 'email' && (
            <form onSubmit={handleEnviarOTP} noValidate>
              <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Iniciar sesión</h1>
              <p className="text-[14px] mt-2 mb-8" style={{ color: GRIS }}>
                Escribe tu correo institucional y te enviaremos un código de acceso.
              </p>

              <label htmlFor="correo" className="block text-[12px] font-semibold mb-2" style={{ color: '#3a3a3a' }}>
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                required
                autoFocus
                autoComplete="email"
                placeholder="nombre@notaria3.com"
                className="lg-input w-full px-4 py-3 text-[15px] outline-none transition-all"
                style={{ border: `1px solid ${error ? ROJO : LINEA}`, borderRadius: 8, background: '#fff', color: TINTA }}
                aria-invalid={!!error}
                aria-describedby={error ? 'error-login' : undefined}
              />

              {error && (
                <p id="error-login" role="alert" className="flex items-start gap-2 text-[13px] mt-3" style={{ color: ROJO }}>
                  <svg className="mt-0.5 flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading || !email.trim()}
                className="lg-btn w-full mt-6 py-3 text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer border-none"
                style={{ background: TINTA, borderRadius: 8 }}>
                {loading ? <><Spinner /> Enviando código…</> : 'Enviar código'}
              </button>

              <div className="flex items-start gap-3 mt-8 pt-6 text-[12.5px] leading-relaxed" style={{ borderTop: `1px solid ${LINEA}`, color: GRIS }}>
                <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                Recibirás un código de 6 dígitos en tu correo. No necesitas contraseña.
              </div>
            </form>
          )}

          {paso === 'otp' && (
            <form onSubmit={handleVerificarOTP} noValidate>
              <button type="button"
                onClick={() => { setPaso('email'); setError(''); setAviso(''); setOtp('') }}
                className="lg-link flex items-center gap-1.5 text-[13px] font-medium mb-8 cursor-pointer border-none bg-transparent p-0 transition-colors"
                style={{ color: GRIS }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                Cambiar correo
              </button>

              <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Revisa tu correo</h1>
              <p className="text-[14px] mt-2 mb-8" style={{ color: GRIS }}>
                Enviamos un código de 6 dígitos a <b style={{ color: TINTA, fontWeight: 600 }}>{email}</b>. Es válido por 10 minutos.
              </p>

              <label htmlFor="codigo" className="block text-[12px] font-semibold mb-2" style={{ color: '#3a3a3a' }}>
                Código de verificación
              </label>

              {/* 6 casillas visuales sobre un solo campo real (permite pegar y autocompletar) */}
              <div className="relative" onClick={() => otpRef.current?.focus()}>
                <input
                  ref={otpRef}
                  id="codigo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={e => alEscribirCodigo(e.target.value)}
                  onFocus={() => setEnfocado(true)}
                  onBlur={() => setEnfocado(false)}
                  maxLength={6}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'error-codigo' : undefined}
                />
                <div className="grid grid-cols-6 gap-2" aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const digito = otp[i] || ''
                    const actual = enfocado && !loading && i === Math.min(otp.length, 5)
                    return (
                      <div key={i}
                        className="h-[58px] flex items-center justify-center transition-all"
                        style={{
                          borderRadius: 8,
                          fontFamily: SERIF,
                          fontSize: 26,
                          fontWeight: 600,
                          color: TINTA,
                          background: digito ? '#fafaf9' : '#fff',
                          border: `1px solid ${error ? ROJO : actual ? TINTA : digito ? '#c9c9c5' : LINEA}`,
                          boxShadow: actual ? '0 0 0 3px rgba(17,17,17,.08)' : 'none',
                        }}>
                        {digito || (actual && <span className="lg-caret" style={{ width: 1.5, height: 26, background: TINTA, animation: 'lgCaret 1s step-end infinite' }} />)}
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <p id="error-codigo" role="alert" className="flex items-start gap-2 text-[13px] mt-3" style={{ color: ROJO }}>
                  <svg className="mt-0.5 flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                  {error}
                </p>
              )}
              {aviso && !error && (
                <p role="status" className="text-[13px] mt-3" style={{ color: GRIS }}>{aviso}</p>
              )}

              <button type="submit" disabled={loading || otp.length < 6}
                className="lg-btn w-full mt-6 py-3 text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer border-none"
                style={{ background: TINTA, borderRadius: 8 }}>
                {loading ? <><Spinner /> Verificando…</> : 'Entrar al sistema'}
              </button>

              <div className="text-center mt-5 text-[13px]" style={{ color: GRIS }}>
                ¿No te llegó?{' '}
                <button type="button" onClick={handleReenviar} disabled={loading || espera > 0}
                  className="lg-link font-semibold underline underline-offset-2 cursor-pointer border-none bg-transparent p-0 transition-colors disabled:no-underline disabled:cursor-default"
                  style={{ color: espera > 0 ? '#a3a3a3' : TINTA }}>
                  {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}

          <p className="lg:hidden text-center text-[11.5px] mt-10" style={{ color: '#a3a3a3' }}>
            Acceso restringido al personal autorizado
          </p>
        </div>
      </main>
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full"
      style={{ border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'lgSpin .7s linear infinite' }} />
  )
}