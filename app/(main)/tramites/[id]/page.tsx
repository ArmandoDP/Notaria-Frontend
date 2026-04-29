import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TramiteDetallePage from '@/components/sections/tramites/TramiteDetallePage'

export default async function TramitePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: tramite } = await supabase
    .from('tramites_config')
    .select('*, areas(*), doc_tipos_config(*)')
    .eq('id', params.id)
    .single()

  if (!tramite) notFound()

  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .eq('activa', true)
    .order('orden')

  return <TramiteDetallePage tramite={tramite} areas={areas || []} />
}