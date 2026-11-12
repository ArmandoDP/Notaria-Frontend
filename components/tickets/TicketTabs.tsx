'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import TabDocs          from './tabs/TabDocs'
import TabPartes        from './tabs/TabPartes'
import TabHistorial     from './tabs/TabHistorial'
import TabPreguntas     from './tabs/TabPreguntas'
import TabObservaciones from './tabs/TabObservaciones'
import t from './ticket.module.css'

type TabId = 'docs' | 'partes' | 'historial' | 'preguntas' | 'observaciones'

interface Props {
  activeTab:   TabId
  onTabChange: (tab: TabId) => void
  documentos:  any[]
  partes:      any[]
  eventos:     any[]
  tramite:     any
  ticket:      any
  preguntas:   any[]
  onSubir:     (docId: string, docTipoId: string, parteId: string | null, archivo: File) => void
  onValidar:   (docId: string) => void
}

// useLayoutEffect solo en el navegador (evita la advertencia en el servidor)
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function TicketTabs({
  activeTab, onTabChange,
  documentos, partes, eventos, tramite, ticket, preguntas,
  onSubir, onValidar,
}: Props) {
  const respondidas = preguntas.filter((p: any) => p.respuesta?.trim()).length
  const TABS: { id: TabId; label: string; count?: string | number }[] = [
    { id: 'docs',          label: 'Documentos',    count: documentos.length },
    { id: 'partes',        label: 'Partes',        count: partes.length },
    { id: 'preguntas',     label: 'Preguntas',     count: preguntas.length ? `${respondidas}/${preguntas.length}` : undefined },
    { id: 'historial',     label: 'Historial',     count: eventos.length },
    { id: 'observaciones', label: 'Observaciones' },
  ]

  // Barra que se desliza bajo la pestaña activa
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [barra, setBarra] = useState({ x: 0, w: 0 })
  useIsoLayoutEffect(() => {
    const medir = () => {
      const el = refs.current[activeTab]
      if (el) setBarra({ x: el.offsetLeft + 14, w: el.offsetWidth - 28 })
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [activeTab, documentos.length, partes.length, eventos.length])

  return (
    <section className={`${t.card} ${t.tabsCard}`}>
      <div className={t.tabBar} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            ref={el => { refs.current[tab.id] = el }}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${t.tab} ${activeTab === tab.id ? t.tabOn : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && <span className={t.tabCount}>{tab.count}</span>}
          </button>
        ))}
        <span className={t.indicator} style={{ width: barra.w, transform: `translateX(${barra.x}px)` }} />
      </div>

      <div key={activeTab} className={t.tabBody} role="tabpanel">
        {activeTab === 'docs'          && <TabDocs documentos={documentos} tramite={tramite} ticket={ticket} onSubir={onSubir} onValidar={onValidar} />}
        {activeTab === 'partes'        && <TabPartes partes={partes} tramite={tramite} ticketId={ticket.id} />}
        {activeTab === 'preguntas'     && <TabPreguntas ticketId={ticket.id} preguntas={preguntas} />}
        {activeTab === 'observaciones' && <TabObservaciones ticketId={ticket.id} />}
        {activeTab === 'historial'     && <TabHistorial eventos={eventos} />}
      </div>
    </section>
  )
}