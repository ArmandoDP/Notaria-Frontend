import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TicketCaratula from '@/components/tickets/TicketCaratula'

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: conversacion } = await supabase
  .from('conversaciones_wa')
  .select('id')
  .eq('ticket_id', params.id)
  .single()

  const [{ data: ticket }, { data: tramites }, { data: areas }] = await Promise.all([
    supabase.from('tickets').select(`
      *,
      tramites_config (*),
      areas (*),
      partes (*),
      documentos (*, doc_tipos_config(*)),
      ticket_eventos (*, usuarios_sistema(nombre, avatar_letras, avatar_color, email, areas(nombre))),
      ticket_preguntas (*)
    `).eq('id', params.id).single(),
    supabase.from('tramites_config').select('id, nombre, color_hex').eq('activo', true).order('orden'),
    supabase.from('areas').select('id, nombre, color_hex').eq('activa', true).order('orden'),
  ])

  if (!ticket) notFound()

  return <TicketCaratula ticket={ticket} tramites={tramites || []} areas={areas || []} conversacionId={conversacion?.id || null} />
}