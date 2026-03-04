import type { RolUsuario } from "./auth";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  rol: RolUsuario | string;
  empresaId?: string | null;
  proveedorId?: string | null;
  isActive?: boolean;
  empresa?: {
    id: string;
    razonSocial: string;
  } | null;
  proveedor?: {
    id: string;
    razonSocial: string;
  } | null;
  vehiculoProveedorId?: string | null;
  vehiculoProveedor?: {
    id: string;
    patente: string;
    marca: string;
    modelo: string;
  } | null;
}

