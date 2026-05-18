import { createClient } from '@/lib/supabase/server'
import UsuariosLayout from '@/components/sections/usuarios/UsuariosLayout'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .eq('activa', true)
    .order('orden')

  const { data: usuarios } = await supabase
    .from('usuarios_sistema')
    .select('*, areas(nombre, color_hex)')
    .eq('activo', true)
    .order('created_at')

  return (
    <UsuariosLayout
      areas={areas || []}
      usuarios={usuarios || []}
    />
  )
}