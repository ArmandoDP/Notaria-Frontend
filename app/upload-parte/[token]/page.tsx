import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import UploadParte from '@/components/upload/UploadParte'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UploadPartePage({ params }: { params: { token: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // Buscar la parte por token — trae todos los campos
  const { data: parte } = await supabase
    .from('partes')
    .select('*')  // ← trae todos los campos
    .eq('upload_token', params.token)
    .eq('upload_token_activo', true)
    .single()

  if (!parte) notFound()

  // Buscar el ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      id, numero,
      tramites_config (nombre, color_hex, requiere_partes),
      partes (id, rol, nombre_completo, upload_token)
    `)
    .eq('id', parte.ticket_id)
    .single()

  if (!ticket) notFound()

  // Buscar solo los docs de esta parte
  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, estado, doc_tipo_id, parte_id, archivo_url, datos_ocr, doc_tipos_config(nombre, obligatorio, para_rol, descripcion_vigencia, alerta_descripcion)')
    .eq('ticket_id', parte.ticket_id)

  // También docs de operación sin parte asignada
  const { data: docsOperacion } = await supabase
    .from('documentos')
    .select('id, estado, doc_tipo_id, archivo_url, datos_ocr, doc_tipos_config(nombre, obligatorio, para_rol, descripcion_vigencia, alerta_descripcion)')
    .eq('ticket_id', parte.ticket_id)
    .is('parte_id', null)

  return (
    <UploadParte
        parte={parte}
        ticket={ticket}
        documentos={(documentos || []).filter((d: any) =>
        d.doc_tipos_config?.para_rol === parte.rol
        )}
        token={params.token}
    />
  )
}