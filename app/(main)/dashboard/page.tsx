import { createClient } from '@/lib/supabase/server'
import DashboardPage from '@/components/dashboard/DashboardPage'

export default async function Dashboard() {
  const supabase = await createClient()
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // KPIs
  const [
    { count: ticketsHoy },
    { count: ticketsNuevos },
    { count: ticketsAsignados },
    { count: ticketsFolioDBA },
    { count: ticketsEscritura },
    { count: ticketsUrgentes },
  ] = await Promise.all([
    supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', hoy.toISOString()),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'nuevo'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'asignado'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'folio_dba'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'escritura_dba'),
    supabase.from('tickets').select('*', { count: 'exact', head: true })
      .in('estado', ['nuevo', 'asignado', 'folio_dba'])
      .lte('sla_vence_at', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Tickets por área
  const { data: ticketsPorArea } = await supabase
    .from('tickets')
    .select('areas(nombre), estado')
    .in('estado', ['nuevo', 'asignado', 'folio_dba'])

  // Tickets por trámite
  const { data: ticketsPorTramite } = await supabase
    .from('tickets')
    .select('tramites_config(nombre), estado')
    .in('estado', ['nuevo', 'asignado', 'folio_dba'])

  // Actividad últimos 7 días
  const { data: actividadSemanal } = await supabase
    .from('tickets')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at')

  // Tickets urgentes detalle
  const { data: urgentesDetalle } = await supabase
    .from('tickets')
    .select('id, numero, estado, sla_vence_at, tramites_config(nombre, color_hex), areas(nombre), partes(nombre_completo, rol)')
    .in('estado', ['nuevo', 'asignado', 'folio_dba'])
    .lte('sla_vence_at', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())
    .order('sla_vence_at')
    .limit(10)

  // Últimos docs subidos
  const { data: ultimosDocs } = await supabase
    .from('documentos')
    .select('id, estado, updated_at, doc_tipos_config(nombre), tickets(numero, tramites_config(nombre, color_hex))')
    .neq('estado', 'pendiente')
    .order('updated_at', { ascending: false })
    .limit(8)

  return (
    <DashboardPage
      kpis={{
        ticketsHoy:      ticketsHoy      || 0,
        ticketsNuevos:   ticketsNuevos   || 0,
        ticketsAsignados: ticketsAsignados || 0,
        ticketsFolioDBA: ticketsFolioDBA || 0,
        ticketsEscritura: ticketsEscritura || 0,
        ticketsUrgentes: ticketsUrgentes || 0,
      }}
      ticketsPorArea={ticketsPorArea   || []}
      ticketsPorTramite={ticketsPorTramite || []}
      actividadSemanal={actividadSemanal || []}
      urgentesDetalle={urgentesDetalle  || []}
      ultimosDocs={ultimosDocs          || []}
    />
  )
}