'use client'

import s from './nuevaSolicitud.module.css'

interface Parte {
  rol:              string
  nombre_completo:  string
  curp:             string
  rfc:              string
  telefono:         string
  email:            string
  es_persona_moral: boolean
  es_extranjero:    boolean
  pasaporte:        string
  residencia:       string
  datos_adicionales: Record<string, string>
}

interface Props {
  partes:        Parte[]
  colorTramite?: string
  tieneSocios:   boolean
  onUpdate:      (index: number, field: keyof Parte, value: any) => void
  onAgregar:     () => void
  onQuitar:      (index: number) => void
  numero?:       number
}

const ROL_LABELS: Record<string, string> = {
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
}

export const nombreRol = (rol: string) => ROL_LABELS[rol] || rol.replace(/_/g, ' ')
export const parteCompleta = (p: any) => !!(p.nombre_completo?.trim() && p.telefono?.trim())

type Campo = { field: keyof Parte; label: string; placeholder: string; full?: boolean; upper?: boolean; type?: string; opcional?: boolean }

export default function SeccionPartes({ partes, tieneSocios, onUpdate, onAgregar, onQuitar, numero = 5 }: Props) {
  if (partes.length === 0) return null
  const completas = partes.filter(parteCompleta).length
  const socios = partes.filter(p => p.rol === 'socio').length

  return (
    <section className={s.section}>
      <header className={s.secHead}>
        <span className={s.secNum}>{numero}</span>
        <div className={s.secText}>
          <h2>Partes</h2>
          <p>Personas que intervienen en el trámite</p>
        </div>
        <span className={s.secAside}>{completas}/{partes.length} completas</span>
      </header>

      {partes.map((parte, idx) => {
        const completa = parteCompleta(parte)
        const campos: Campo[] = [
          { field: 'nombre_completo', label: 'Nombre completo', placeholder: 'Nombre y apellidos', full: true },
          ...(parte.es_extranjero ? [] : [{ field: 'curp' as const, label: 'CURP', placeholder: '18 caracteres', upper: true, opcional: true }]),
          { field: 'rfc',      label: 'RFC',      placeholder: '12 o 13 caracteres', upper: true, opcional: true },
          { field: 'telefono', label: 'Teléfono', placeholder: '461 123 4567', type: 'tel' },
          { field: 'email',    label: 'Correo',   placeholder: 'correo@ejemplo.com', type: 'email', opcional: true },
        ]

        return (
          <div key={idx} className={s.party}>
            <div className={s.partyHead}>
              <span className={s.partyNum}>{idx + 1}</span>
              <b>{nombreRol(parte.rol)}</b>
              <span className={`${s.state} ${completa ? s.stateOk : ''}`}>{completa ? 'Completa' : 'Pendiente'}</span>
              {parte.rol === 'socio' && socios > 1 && (
                <button type="button" className={s.remove} onClick={() => onQuitar(idx)}>Quitar</button>
              )}
            </div>

            <button
              type="button"
              className={s.switchRow}
              role="switch"
              aria-checked={!!parte.es_extranjero}
              onClick={() => onUpdate(idx, 'es_extranjero', !parte.es_extranjero)}
            >
              <span className={`${s.switch} ${parte.es_extranjero ? s.switchOn : ''}`} />
              Es extranjero
            </button>

            <div className={s.grid2}>
              {campos.map(f => (
                <div key={f.field} className={f.full ? s.full : ''}>
                  <label className={s.label} htmlFor={`ns-${idx}-${f.field}`}>
                    {f.label}{f.opcional && <small>opcional</small>}
                  </label>
                  <input
                    id={`ns-${idx}-${f.field}`}
                    type={f.type || 'text'}
                    value={(parte as any)[f.field] || ''}
                    onChange={e => onUpdate(idx, f.field, f.upper ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder={f.placeholder}
                    className={`${s.input} ${f.upper ? s.upper : ''}`}
                    autoComplete="off"
                  />
                </div>
              ))}

              {parte.es_extranjero && (
                <>
                  <div>
                    <label className={s.label} htmlFor={`ns-${idx}-pasaporte`}>Número de pasaporte</label>
                    <input
                      id={`ns-${idx}-pasaporte`}
                      value={parte.pasaporte || ''}
                      onChange={e => onUpdate(idx, 'pasaporte', e.target.value.toUpperCase())}
                      placeholder="Ej. AB123456"
                      className={`${s.input} ${s.upper}`}
                    />
                  </div>
                  <div>
                    <label className={s.label} htmlFor={`ns-${idx}-residencia`}>Documento migratorio</label>
                    <input
                      id={`ns-${idx}-residencia`}
                      value={parte.residencia || ''}
                      onChange={e => onUpdate(idx, 'residencia', e.target.value)}
                      placeholder="Residencia, FM2 o FM3"
                      className={s.input}
                    />
                  </div>
                  <div className={`${s.note} ${s.full}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                      <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
                    </svg>
                    <span>
                      Para extranjeros se solicita <b>pasaporte vigente</b> y <b>documento migratorio</b> en lugar de INE y CURP. Verifica la vigencia de ambos.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {tieneSocios && (
        <button type="button" className={s.addBtn} onClick={onAgregar}>+ Agregar socio</button>
      )}
    </section>
  )
}