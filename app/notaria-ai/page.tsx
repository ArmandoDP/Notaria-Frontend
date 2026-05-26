import { Suspense } from 'react'
import NotariaAIPage from '@/components/sections/notaria-ai/NotariaAIPage'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center"
        style={{ background: '#050408' }}>
        <div className="text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Cargando Notaría AI...
        </div>
      </div>
    }>
      <NotariaAIPage />
    </Suspense>
  )
}