import TabDocs     from './tabs/TabDocs'
import TabPartes   from './tabs/TabPartes'
import TabHistorial from './tabs/TabHistorial'
import TabPreguntas from './tabs/TabPreguntas'
import TabObservaciones from './tabs/TabObservaciones'

interface Props {
  activeTab:  'docs' | 'partes' | 'historial' | 'preguntas' | 'observaciones'
  onTabChange: (tab: 'docs' | 'partes' | 'historial' | 'preguntas' | 'observaciones') => void
  documentos:  any[]
  partes:      any[]
  eventos:     any[]
  tramite:     any
  ticket:      any
  preguntas:   any[]
  onSubir:     (docId: string, docTipoId: string, parteId: string | null, archivo: File) => void
  onValidar:   (docId: string) => void
}

export default function TicketTabs({
  activeTab, onTabChange,
  documentos, partes, eventos, tramite, ticket, preguntas,
  onSubir, onValidar,
}: Props) {
  const TABS = [
    { id: 'docs',      label: `Documentos (${documentos.length})` },
    { id: 'partes',    label: `Partes (${partes.length})`          },
    { id: 'preguntas', label: 'Preguntas'                          },
    { id: 'historial', label: `Historial (${eventos.length})`      },
    { id: 'observaciones', label: 'Observaciones'                  },
  ] as const

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      {/* Tab headers */}
      <div className="flex border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        {TABS.map(tab => (
          <button key={tab.id} type="button"
            onClick={() => onTabChange(tab.id)}
            className="px-5 py-3 text-[12.5px] font-semibold transition-all cursor-pointer border-none bg-transparent"
            style={{
              color:        activeTab === tab.id ? '#111' : '#9C9890',
              borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'docs'      && <TabDocs documentos={documentos} tramite={tramite} ticket={ticket} onSubir={onSubir} onValidar={onValidar} />}
        {activeTab === 'partes'    && <TabPartes partes={partes} tramite={tramite} ticketId={ticket.id} />}
        {activeTab === 'preguntas' && <TabPreguntas ticketId={ticket.id} preguntas={preguntas} />}
        {activeTab === 'observaciones' && <TabObservaciones ticketId={ticket.id}/>}
        {activeTab === 'historial' && <TabHistorial eventos={eventos} />}
      </div>
    </div>
  )
}