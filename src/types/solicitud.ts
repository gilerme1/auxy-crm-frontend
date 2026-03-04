export type TipoAuxilio = "GRUA" | "BATERIA" | "CAMBIO_RUEDA" | "COMBUSTIBLE" | string;

export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE" | string;

export type EstadoSolicitud =
  | "PENDIENTE"
  | "ASIGNADA"
  | "EN_CAMINO"
  | "EN_PROCESO"
  | "FINALIZADA"
  | "CANCELADA"
  | string;

export interface SolicitudCreatePayload {
  tipo: TipoAuxilio;
  prioridad: Prioridad;
  vehiculoId: string;
  latitud: number;
  longitud: number;
  direccion: string;
  observaciones?: string;
  fotos?: string[];
}

export interface SolicitudQueryParams {
  page?: number;
  limit?: number;
  estado?: EstadoSolicitud;
  tipo?: TipoAuxilio;
  empresaId?: string;
  proveedorId?: string;
  vehiculoId?: string;
}

