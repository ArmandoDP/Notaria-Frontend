import Sidebar from '@/components/layout/Sidebar'
import Topbar  from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col h-screen" style={{ background: '#F2F1EE' }}>
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pt-2" style={{ background: '#F2F1EE' }}>
          {children}
        </main>
      </div>
    </div>
  )
}