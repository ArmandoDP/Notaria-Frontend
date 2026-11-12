export const ROL_LABELS: Record<string, string> = {
  comprador:      'Comprador',
  vendedor:       'Vendedor',
  poderdante:     'Poderdante',
  apoderado:      'Apoderado',
  deudor:         'Deudor',
  socio:          'Socio',
  testador:       'Testador',
  solicitante:    'Solicitante',
  representante:  'Representante',
  donante:        'Donante',
  donatario:      'Donatario',
  herederos:      'Herederos',
  liquidador:     'Liquidador',
  comparecientes: 'Compareciente',
  conyuge:        'Cónyuge',
}

export const rolLabel = (rol?: string | null) =>
  rol ? ROL_LABELS[rol] || rol.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : ''

export function iniciales(nombre?: string | null) {
  const p = (nombre || '').trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'
}