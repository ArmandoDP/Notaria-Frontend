import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/kanban/KanbanBoard'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, tramites_config(nombre, color_hex), areas(nombre, color_hex), partes(*)')
    .order('created_at', { ascending: false })

  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .order('orden')

  const { data: tramites } = await supabase
    .from('tramites_config')
    .select('id, nombre, color_hex')
    .eq('activo', true)

  return (
    <KanbanBoard
      ticketsIniciales={tickets || []}
      areas={areas || []}
      tramites={tramites || []}
    />
  )
}