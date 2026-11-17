'use client'

import FormPlantilla from './FormPlantilla'
import { apiPost, ApiError } from './waUtils'

interface Props {
  conversacion: any
  onEnviada:    () => void
  onError:      (mensaje: string) => void
  onCerrar?:    () => void
}

export default function PanelPlantillas({ conversacion, onEnviada, onError, onCerrar }: Props) {
  return (
    <FormPlantilla
      areaInicial={conversacion.areas?.nombre || null}
      textoBoton="Enviar plantilla"
      onError={onError}
      onCancelar={onCerrar}
      onEnviar={async (plantilla, parametros) => {
        try {
          await apiPost('/api/meta/enviar-plantilla', { conversacion_id: conversacion.id, plantilla, parametros })
          onEnviada()
        } catch (e) {
          onError(e instanceof ApiError ? e.message : 'No se pudo enviar la plantilla')
        }
      }}
    />
  )
}