import { notFound } from 'next/navigation'
import UploadPublico from '@/components/upload/UploadPublico'
import { createClient } from '@supabase/supabase-js'

export default async function UploadPage({ params, searchParams }: { params: { token: string }; searchParams: { tipo?: string } }) {
  
  // Cliente público sin auth — solo anon key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      id, numero, upload_token_activo,
      tramites_config (nombre, color_hex, descripcion, requiere_partes),
      partes (nombre_completo, rol, orden),
      documentos (
        id, estado, doc_tipo_id, archivo_url, datos_ocr,
        doc_tipos_config (nombre, obligatorio, para_rol, descripcion_vigencia, alerta_descripcion)
      )
    `)
    .eq('upload_token', params.token)
    .eq('upload_token_activo', true)
    .single()

  if (!ticket) notFound()

  return <UploadPublico ticket={ticket} token={params.token} soloOperacion={searchParams.tipo === 'operacion'} />
}