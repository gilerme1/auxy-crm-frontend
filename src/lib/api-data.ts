import { api } from "./http";

// ─── Enums (mirror del backend Prisma) ────────────────────────────────────────
export type TipoVehiculo = "AUTO" | "CAMIONETA" | "CAMION" | "MOTO" | "OTRO";
export type TipoVehiculoProveedor = "GRUA_PESADA_CAMIONES" | "REMOLQUE" | "MECANICA" | "CERRAJERIA" | "GOMERIA_NEUMATICOS" | "OTRO";
export type TipoAuxilio = "MECANICO" | "GRUA" | "BATERIA" | "COMBUSTIBLE" | "CAMBIO_RUEDA" | "CERRAJERIA" | "OTROS";
export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
export type EstadoSolicitud = "PENDIENTE" | "ASIGNADO" | "EN_CAMINO" | "EN_SERVICIO" | "FINALIZADO" | "CANCELADO";

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export interface CreateUsuarioPayload {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: "CLIENTE_OPERADOR" | "PROVEEDOR_OPERADOR";
  empresaId?: string | null;
  proveedorId?: string | null;
}

export async function createUsuario(payload: CreateUsuarioPayload) {
  const { data } = await api.post("/usuarios", payload);
  return data;
}

export async function getUsuarios() {
  const { data } = await api.get("/usuarios");
  return data;
}

export async function toggleUsuarioActive(id: string) {
  const { data } = await api.patch(`/usuarios/${id}/toggle-active`);
  return data;
}

export async function updateUsuario(id: string, payload: Partial<CreateUsuarioPayload>) {
  const { data } = await api.patch(`/usuarios/${id}`, payload);
  return data;
}

export async function deleteUsuario(id: string) {
  const { data } = await api.delete(`/usuarios/${id}`);
  return data;
}

// ─── Vehículos Empresa ────────────────────────────────────────────────────────
export interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo?: TipoVehiculo;
  tipos?: TipoVehiculoProveedor[];
  empresaId?: string;
  proveedorId?: string;
  createdAt: string;
}

export interface CreateVehiculoPayload {
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo: TipoVehiculo;
  empresaId: string;
}

export interface CreateVehiculoProveedorPayload {
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipos: TipoVehiculoProveedor[];
  proveedorId: string;
}

export async function createVehiculo(payload: CreateVehiculoPayload) {
  const { data } = await api.post("/vehiculos-empresa", payload);
  return data;
}

export async function getVehiculos() {
  const { data } = await api.get("/vehiculos-empresa");
  return data;
}

export async function updateVehiculo(id: string, payload: Partial<CreateVehiculoPayload>) {
  const { data } = await api.patch(`/vehiculos-empresa/${id}`, payload);
  return data;
}

export async function deleteVehiculo(id: string) {
  const { data } = await api.delete(`/vehiculos-empresa/${id}`);
  return data;
}

// ─── Vehículos Proveedor ──────────────────────────────────────────────────────
export async function createVehiculoProveedor(payload: CreateVehiculoProveedorPayload) {
  const { data } = await api.post("/vehiculos-proveedor", payload);
  return data;
}

export async function getVehiculoProveedor(id: string) {
  const { data } = await api.get(`/vehiculos-proveedor/${id}`);
  return data;
}

export async function getVehiculosProveedor() {
  const { data } = await api.get("/vehiculos-proveedor");
  return data;
}

export async function updateVehiculoProveedor(id: string, payload: Partial<CreateVehiculoProveedorPayload>) {
  const { data } = await api.patch(`/vehiculos-proveedor/${id}`, payload);
  return data;
}

export async function deleteVehiculoProveedor(id: string) {
  const { data } = await api.delete(`/vehiculos-proveedor/${id}`);
  return data;
}

export async function assignOperadorToVehiculo(vehiculoId: string, operadorId: string) {
  const { data } = await api.post(`/vehiculos-proveedor/${vehiculoId}/assign-operator`, { operadorId });
  return data;
}

export async function unassignOperadorFromVehiculo(vehiculoId: string, operadorId: string) {
  const { data } = await api.post(`/vehiculos-proveedor/${vehiculoId}/unassign-operator`, { operadorId });
  return data;
}

export async function getVehiculoProveedorHistorial(id: string) {
  const { data } = await api.get(`/vehiculos-proveedor/${id}/historial`);
  return data;
}

// ─── Empresas ─────────────────────────────────────────────────────────────────
export interface Empresa {
  id: string;
  razonSocial: string;
  cuit: string;
  email: string;
  telefono: string;
  direccion: string;
  isActive: boolean;
  createdAt: string;
}

export async function getEmpresas(): Promise<Empresa[]> {
  const { data } = await api.get("/empresas");
  return data;
}

export async function getEmpresa(id: string): Promise<Empresa> {
  const { data } = await api.get(`/empresas/${id}`);
  return data;
}

// ─── Proveedores ──────────────────────────────────────────────────────────────
export interface Proveedor {
  id: string;
  razonSocial: string;
  cuit: string;
  email: string;
  telefono: string;
  direccion?: string;
  serviciosOfrecidos?: string[];
  isActive: boolean;
  createdAt: string;
}

export async function createProveedor(payload: any) {
  const { data } = await api.post("/proveedores", payload);
  return data;
}

export async function getProveedores(): Promise<Proveedor[]> {
  const { data } = await api.get("/proveedores");
  return data;
}

export async function getProveedor(id: string): Promise<Proveedor> {
  const { data } = await api.get(`/proveedores/${id}`);
  return data;
}

export async function updateProveedor(id: string, payload: Partial<Proveedor>) {
  const { data } = await api.patch(`/proveedores/${id}`, payload);
  return data;
}

export async function deleteProveedor(id: string) {
  const { data } = await api.delete(`/proveedores/${id}`);
  return data;
}

export async function getProveedorEstadisticas(id: string) {
  const { data } = await api.get(`/proveedores/${id}/estadisticas`);
  return data;
}

// ─── Solicitudes ──────────────────────────────────────────────────────────────
export interface Solicitud {
  id: string;
  numero: string;
  tipo: TipoAuxilio;
  estado: EstadoSolicitud;
  prioridad: Prioridad;
  direccion: string;
  observaciones?: string;
  fechaSolicitud: string;
  vehiculo?: { patente: string; marca: string; modelo: string };
  solicitadoPor?: { nombre: string; apellido: string };
  proveedor?: { razonSocial: string };
  atendidoPor?: { id: string; nombre: string; apellido: string };
  vehiculoProveedor?: { id: string; patente: string; marca: string; modelo: string };
  fotos?: string[];
}

export interface CreateSolicitudPayload {
  tipo: TipoAuxilio;
  prioridad: Prioridad;
  vehiculoId: string;
  latitud: number;
  longitud: number;
  direccion: string;
  observaciones?: string;
}

export async function getSolicitudes(params?: Record<string, string>): Promise<Solicitud[]> {
  const { data } = await api.get("/solicitudes", { params });
  return data?.data || [];
}

export async function getSolicitud(id: string): Promise<Solicitud> {
  const { data } = await api.get(`/solicitudes/${id}`);
  return data;
}

export async function createSolicitud(payload: CreateSolicitudPayload) {
  const { data } = await api.post("/solicitudes", payload);
  return data;
}

export async function cancelarSolicitud(id: string, motivo: string) {
  const { data } = await api.post(`/solicitudes/${id}/cancelar`, { motivo });
  return data;
}

export async function cambiarEstadoSolicitud(id: string, estado: EstadoSolicitud) {
  const { data } = await api.patch(`/solicitudes/${id}/estado`, { estado });
  return data;
}

export async function aceptarSolicitud(id: string, payload?: { operadorId?: string; vehiculoProveedorId?: string }) {
  const { data } = await api.post(`/solicitudes/${id}/aceptar`, payload || {});
  return data;
}

export async function finalizarSolicitud(id: string, payload: { costoFinal: number; observaciones?: string }) {
  const { data } = await api.post(`/solicitudes/${id}/finalizar`, payload);
  return data;
}

export async function calificarSolicitud(id: string, payload: { calificacion: number; comentario?: string }) {
  const { data } = await api.post(`/solicitudes/${id}/calificar`, payload);
  return data;
}

// ─── Fotos ────────────────────────────────────────────────────────────────────
export async function uploadFotoPerfil(userId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/usuarios/${userId}/foto-perfil`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadFotosSolicitud(solicitudId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await api.post(`/solicitudes/${solicitudId}/fotos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteFotoSolicitud(solicitudId: string, fotoUrl: string) {
  const { data } = await api.delete(`/solicitudes/${solicitudId}/fotos`, {
    data: { fotoUrl },
  });
  return data;
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────
export async function getSuperAdminStats() {
  const { data } = await api.get("/stats/super-admin");
  return data;
}

export async function getStatsProveedor() {
  const { data } = await api.get("/stats/proveedor");
  return data;
}

export async function getStatsCliente() {
  const { data } = await api.get("/stats/cliente");
  return data;
}
