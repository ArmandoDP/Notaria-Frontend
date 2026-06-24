'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import AIAnalisisFolios from '../sections/AIAnalisisFolios'

interface Resultado {
  id:              string
  numero:          string
  folio_dba:       string | null
  folio_escritura: string | null
  estado:          string
  created_at:      string
  tramites_config: { nombre: string, color_hex: string } | null
  areas:           { nombre: string } | null
  partes:          { nombre_completo: string | null, rol: string }[]
}

const ESTADO_COLOR: Record<string, { bg: string, color: string, label: string }> = {
  nuevo:         { bg: '#EDEDFC', color: '#534AB7', label: 'Nuevo'         },
  asignado:      { bg: '#E6F1FB', color: '#185FA5', label: 'Asignado'      },
  folio_dba:     { bg: '#FEF3C7', color: '#854F0B', label: 'Folio DBA'     },
  escritura_dba: { bg: '#EAF3DE', color: '#3B6D11', label: 'Escritura DBA' },
  cancelado:     { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelado'     },
}

export default function BuscadorFolios() {
  const supabase = createClient()
  const router   = useRouter()

  const [query,      setQuery]      = useState('')
  const [tipo,       setTipo]       = useState<'todos' | 'dba' | 'escritura' | 'numero' | 'nombre'>('todos')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [buscando,   setBuscando]   = useState(false)
  const [buscado,    setBuscado]    = useState(false)

  async function buscar() {
    if (!query.trim()) return
    setBuscando(true)
    setBuscado(false)

    let q = supabase
      .from('tickets')
      .select(`
        id, numero, folio_dba, folio_escritura, estado, created_at,
        tramites_config (nombre, color_hex),
        areas (nombre),
        partes (nombre_completo, rol)
      `)
      .limit(20)

    if (tipo === 'dba') {
      q = q.ilike('folio_dba', `%${query}%`)
    } else if (tipo === 'escritura') {
      q = q.ilike('folio_escritura', `%${query}%`)
    } else if (tipo === 'numero') {
      q = q.ilike('numero', `%${query}%`)
    } else if (tipo === 'nombre') {
      const { data: partesMatch } = await supabase
        .from('partes')
        .select('ticket_id')
        .ilike('nombre_completo', `%${query}%`)
        .limit(20)
      const ticketIds = [...new Set((partesMatch || []).map((p: any) => p.ticket_id))]
      if (ticketIds.length === 0) {
        setResultados([])
        setBuscando(false)
        setBuscado(true)
        return
      }
      q = q.in('id', ticketIds)
    } else {
      q = q.or(`folio_dba.ilike.%${query}%,folio_escritura.ilike.%${query}%,numero.ilike.%${query}%`)
    }

    const { data } = await q.order('created_at', { ascending: false })
    setResultados((data as any) || [])
    setBuscando(false)
    setBuscado(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') buscar()
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#111' }}>
          Buscar folios
        </h1>
        <p className="text-[13px] mt-1" style={{ color: '#9C9890' }}>
          Busca por folio DBA, escritura, número de ticket o nombre del cliente
        </p>
      </div>

      {/* Widget IA — siempre visible arriba */}
      <div className="mb-6">
        <AIAnalisisFolios
          query={query}
          tipo={tipo}
          resultados={resultados}
          buscado={buscado}
        />
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl p-5 mb-4"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { id: 'todos',     label: 'Todos'           },
            { id: 'nombre',    label: '👤 Nombre'       },
            { id: 'dba',       label: 'Folio DBA'       },
            { id: 'escritura', label: 'Folio Escritura' },
            { id: 'numero',    label: 'No. Ticket'      },
          ] as const).map(t => (
            <button key={t.id} type="button" onClick={() => setTipo(t.id)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all"
              style={{ background: tipo === t.id ? '#111' : 'rgba(0,0,0,0.04)', color: tipo === t.id ? '#fff' : '#666' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              tipo === 'nombre'    ? 'Ej: Juan Pérez García'   :
              tipo === 'dba'       ? 'Ej: DBA-2026-123456'     :
              tipo === 'escritura' ? 'Ej: ESC-2026-123456'     :
              tipo === 'numero'    ? 'Ej: N3-2026-001'         :
              'Buscar folio, número de ticket, nombre del cliente...'
            }
            className="flex-1 px-4 py-3 rounded-xl text-[13px] outline-none"
            style={{
              fontFamily: tipo === 'nombre' ? 'system-ui' : 'monospace',
              background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)', color: '#111',
            }}
            autoFocus
          />
          <button type="button" onClick={buscar}
            disabled={!query.trim() || buscando}
            className="px-5 py-3 rounded-xl text-[13px] font-bold cursor-pointer border-none transition-all"
            style={{
              background: query.trim() ? '#111' : '#F0F0F0',
              color:      query.trim() ? '#fff' : '#CCC',
              boxShadow:  query.trim() ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
            }}>
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="flex flex-col gap-3">
          {resultados.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="text-[32px] mb-2">🔍</div>
              <div className="text-[14px] font-medium" style={{ color: '#999' }}>
                No se encontraron resultados para "{query}"
              </div>
              <div className="text-[12px] mt-1" style={{ color: '#CCC' }}>
                Verifica el dato o prueba con otro tipo de búsqueda
              </div>
            </div>
          ) : (
            <>
              <div className="text-[12px] font-medium px-1" style={{ color: '#9C9890' }}>
                {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} · Clic para ver el expediente
              </div>
              {resultados.map(r => {
                const est   = ESTADO_COLOR[r.estado] || ESTADO_COLOR.nuevo
                const color = (r.tramites_config as any)?.color_hex || '#666'
                const nombre = r.partes?.[0]?.nombre_completo || '—'
                return (
                  <button key={r.id} type="button"
                    onClick={() => router.push(`/tickets/${r.id}`)}
                    className="w-full text-left bg-white rounded-2xl p-4 cursor-pointer border-none transition-all"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-[12px] font-mono font-bold" style={{ color: '#9C9890' }}>{r.numero}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                          style={{ background: est.bg, color: est.color }}>
                          {est.label}
                        </span>
                        <span className="text-[10px]" style={{ color: '#9C9890' }}>Ver expediente →</span>
                      </div>
                    </div>

                    <div className="text-[14px] font-bold mb-1" style={{ color: '#111' }}>
                      {(r.tramites_config as any)?.nombre || '—'}
                    </div>

                    <div className="text-[12px] mb-2" style={{ color: '#666' }}>
                      {nombre} · {(r.areas as any)?.nombre || '—'}
                    </div>

                    {r.partes && r.partes.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {r.partes.slice(1, 4).map((p, pi) => p.nombre_completo && (
                          <span key={pi} className="text-[10px] px-2 py-0.5 rounded-md"
                            style={{ background: '#F7F7F5', color: '#666' }}>
                            {p.nombre_completo}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {r.folio_dba && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold"
                          style={{ background: '#FEF3C7', color: '#854F0B', border: '1px solid rgba(133,79,11,0.15)' }}>
                          <span style={{ color: '#9C9890' }}>DBA</span>{r.folio_dba}
                        </span>
                      )}
                      {r.folio_escritura && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold"
                          style={{ background: '#E6F1FB', color: '#185FA5', border: '1px solid rgba(27,95,165,0.15)' }}>
                          <span style={{ color: '#9C9890' }}>ESC</span>{r.folio_escritura}
                        </span>
                      )}
                      {!r.folio_dba && !r.folio_escritura && (
                        <span className="text-[11px]" style={{ color: '#CCC' }}>Sin folios vinculados</span>
                      )}
                    </div>

                    <div className="text-[11px] mt-2" style={{ color: '#CCC' }}>
                      Creado {format(new Date(r.created_at), "d 'de' MMMM yyyy", { locale: es })}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}