import { createClient } from '@/lib/supabase/server'
import ChatsLayout from '@/components/sections/chats/ChatsLayout'

export default async function ChatsPage() {
  const supabase = await createClient()

  // Obtener usuario logueado
  const { data: { user } } = await supabase.auth.getUser()
  
  // Obtener área y rol del usuario
  let areaId: string | null = null
  let esAdmin = false
  
  if (user) {
    const { data: us } = await supabase
      .from('usuarios_sistema')
      .select('area_id, rol')
      .eq('email', user.email || '')
      .single()
    
    if (us) {
      areaId   = us.area_id
      esAdmin  = ['admin', 'notario', 'asistente'].includes(us.rol)
    }
  }

  // Admin y notario ven todas — el resto solo su área
  let query = supabase
    .from('conversaciones_wa')
    .select('*, areas(nombre, color_hex)')
    .eq('activa', true)
    .order('ultimo_mensaje_at', { ascending: false })

  if (!esAdmin && areaId) {
    query = query.eq('area_id', areaId)
  }

  const { data: conversaciones } = await query

  // Areas — solo las que tienen número de WhatsApp
  const { data: areas } = await supabase
    .from('areas')
    .select('id, nombre, color_hex')
    .eq('activa', true)
    .not('numero_twilio', 'is', null)
    .order('nombre')

  return (
    <ChatsLayout
      conversacionesIniciales={conversaciones || []}
      areas={areas || []}
    />
  )
}