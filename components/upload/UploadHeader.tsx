interface Props {
  color:   string
  tramite: any
  ticket:  any
}

export default function UploadHeader({ color, tramite, ticket }: Props) {
  return (
    <div style={{ background: color }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800, color: '#fff',
          }}>N3</div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Notaría Pública No. 3
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Celaya, Guanajuato</div>
          </div>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
          Subir documentos
        </h1>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          {tramite?.nombre} · Folio {ticket.numero}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          marginTop: '10px', padding: '4px 10px', borderRadius: '99px',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <span style={{ fontSize: '11px' }}>✨</span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            Verificación automática con Inteligencia Artificial
          </span>
        </div>
      </div>
    </div>
  )
}