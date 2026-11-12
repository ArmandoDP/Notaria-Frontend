import Sidebar from '@/components/layout/Sidebar'
import Topbar  from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F2F1EE' }}>
      {/* Riel de navegación a todo lo alto, como WhatsApp Web */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 pt-2" style={{ background: '#F2F1EE' }}>
          {children}
        </main>
      </div>
    </div>
  )
}