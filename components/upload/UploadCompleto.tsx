interface Props {
  color:  string
  ticket: any
}

export default function UploadCompleto({ color, ticket }: Props) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '24px',
        background: `${color}15`, border: `2px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '36px', margin: '0 auto 24px',
      }}>
        ✅
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        ¡Todo listo!
      </div>
      <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
        Recibimos todos tus documentos para el trámite<br />
        <strong>{ticket.tramites_config?.nombre}</strong> · Folio {ticket.numero}
      </div>
      <div style={{
        background: '#F7F7F5', borderRadius: '14px', padding: '16px',
        fontSize: '12px', color: '#666', lineHeight: '1.7',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        El equipo de la Notaría revisará tu expediente y te contactará si necesitan algo más.<br />
        <strong>Puedes cerrar esta página.</strong>
      </div>
      <div style={{ marginTop: '32px', fontSize: '11px', color: '#9C9890' }}>
        Notaría Pública No. 3 · Celaya, Guanajuato<br />
        ✨ Verificación de documentos con Azure AI
      </div>
    </div>
  )
}