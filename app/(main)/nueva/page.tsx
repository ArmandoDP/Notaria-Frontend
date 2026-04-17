import { createClient } from '@/lib/supabase/server'
import NuevaSolicitudForm from '@/components/tickets/NuevaSolicitudForm'

export default async function NuevaSolicitudPage() {
  const supabase = await createClient()

  const { data: tramites } = await supabase
    .from('tramites_config')
    .select('*, doc_tipos_config(*)')
    .eq('activo', true)
    .order('orden')

  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .eq('activa', true)
    .order('orden')

  return (
    <NuevaSolicitudForm
      tramites={tramites || []}
      areas={areas || []}
    />
  )
}