import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TicketCaratula from '@/components/tickets/TicketCaratula'

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      tramites_config(*),
      areas(*),
      partes(*),
      documentos(*, doc_tipos_config(*)),
      ticket_eventos(*)
    `)
    .eq('id', params.id)
    .single()

  if (!ticket) notFound()

  return <TicketCaratula ticket={ticket} />
}