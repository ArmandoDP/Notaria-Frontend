import { createClient } from '@/lib/supabase/server'
import BuscadorFolios from '@/components/sections/BuscadorFolios'

export default async function FoliosPage() {
  return <BuscadorFolios />
}