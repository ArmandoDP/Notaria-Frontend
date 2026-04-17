export type EstadoTicket =
  | 'nuevo' | 'en_proceso' | 'pend_docs' | 'pend_pago'
  | 'completo' | 'firma' | 'demorado' | 'entregado' | 'cancelado'

export type CanalTicket =
  | 'telefono' | 'whatsapp' | 'mail' | 'front_desk'
  | 'whatsapp_vip' | 'link_carga'

export type RolUsuario =
  | 'admin' | 'notario' | 'notario_auxiliar' | 'area_lead' | 'agente'

export interface Area {
  id:                 string
  nombre:             string
  responsable_nombre: string | null
  whatsapp_numero:    string | null
  color_hex:          string
  activa:             boolean
  orden:              number
}

export interface TramiteConfig {
  id:              string
  nombre:          string
  slug:            string
  area_id_default: string
  sla_dias_total:  number
  descripcion:     string | null
  activo:          boolean
  requiere_partes: ParteConfig[]
  sla_etapas:      SlaEtapa[]
  riesgos:         Riesgo[]
  color_hex:       string
  orden:           number
}

export interface ParteConfig {
  rol:           string
  descripcion:   string
  es_pm:         boolean
  es_obligatorio: boolean
  campos_extra?: CampoExtra[]
}

export interface CampoExtra {
  label:    string
  key:      string
  tipo:     string
  opciones?: string[]
}

export interface SlaEtapa {
  etapa:        string
  dias_max:     number
  texto_alerta: string
}

export interface Riesgo {
  nivel: 'alto' | 'medio' | 'bajo'
  tipo:  string
  titulo: string
  desc:  string
}

export interface Ticket {
  id:                string
  numero:            string
  tramite_id:        string
  estado:            EstadoTicket
  canal:             CanalTicket
  area_id:           string
  areas_adicionales: string[]
  responsable_id:    string | null
  folio_dba:         string | null
  nota_demora:       string | null
  sla_vence_at:      string
  created_at:        string
  updated_at:        string
  // joins
  tramites_config?:  TramiteConfig
  areas?:            Area
  partes?:           Parte[]
}

export interface Parte {
  id:               string
  ticket_id:        string
  rol:              string
  nombre_completo:  string | null
  curp:             string | null
  rfc:              string | null
  domicilio:        string | null
  email:            string | null
  telefono:         string | null
  es_persona_moral: boolean
  datos_adicionales: Record<string, any>
  orden:            number
}

export interface Documento {
  id:                 string
  ticket_id:          string
  parte_id:           string | null
  doc_tipo_id:        string
  estado:             'pendiente' | 'recibido' | 'ocr_procesado' | 'validado' | 'rechazado'
  archivo_url:        string | null
  datos_ocr:          Record<string, any> | null
  alerta_ia:          string | null
  fecha_vigencia_doc: string | null
  vigencia_vencida:   boolean | null
  validado_por:       string | null
  validado_at:        string | null
  // join
  doc_tipos_config?:  DocTipoConfig
}

export interface DocTipoConfig {
  id:                   string
  tramite_id:           string
  nombre:               string
  obligatorio:          boolean
  para_rol:             string | null
  vigencia_dias:        number
  descripcion_vigencia: string | null
  alerta_ia:            boolean
  alerta_descripcion:   string | null
  campos_ocr:           CampoOCR[]
  orden:                number
}

export interface CampoOCR {
  campo:     string
  label:     string
  requerido: boolean
}

export interface TicketEvento {
  id:          string
  ticket_id:   string
  tipo:        string
  descripcion: string
  usuario_id:  string | null
  metadata:    Record<string, any>
  created_at:  string
}