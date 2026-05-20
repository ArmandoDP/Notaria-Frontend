import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import UploadPublico from '@/components/upload/UploadPublico'

export default async function UploadPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      id, numero, upload_token_activo,
      tramites_config (nombre, color_hex, descripcion, requiere_partes),
      partes (nombre_completo, rol, orden),
      documentos (
        id, estado, doc_tipo_id,
        doc_tipos_config (nombre, obligatorio, para_rol, descripcion_vigencia, alerta_descripcion)
      )
    `)
    .eq('upload_token', params.token)
    .single()

  if (!ticket || !ticket.upload_token_activo) notFound()

  return <UploadPublico ticket={ticket} token={params.token} />
}