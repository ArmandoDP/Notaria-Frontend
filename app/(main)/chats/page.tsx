import { createClient } from '@/lib/supabase/server'
import ChatsLayout from '@/components/sections/chats/ChatsLayout'

export default async function ChatsPage() {
  const supabase = await createClient()

  const { data: conversaciones } = await supabase
    .from('conversaciones_wa')
    .select('*, areas(nombre, color_hex)')
    .eq('activa', true)
    .order('ultimo_mensaje_at', { ascending: false })

  const { data: areas } = await supabase
    .from('areas')
    .select('id, nombre, color_hex')
    .eq('activa', true)
    .order('orden')

  return (
    <ChatsLayout
      conversacionesIniciales={conversaciones || []}
      areas={areas || []}
    />
  )
}