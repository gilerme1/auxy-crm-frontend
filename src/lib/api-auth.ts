import { api } from "./http";
import type { AuthResponse } from "@/types/auth";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterEmpresaPayload {
  email: string;
  password: string; // Min 6
  nombre: string;
  apellido: string;
  telefono?: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  contactoEmail: string;
  contactoTelefono?: string;
  planId?: string;
}

export interface RegisterProveedorPayload {
  email: string;
  password: string; // Min 8
  nombre: string;
  apellido: string;
  telefono?: string;
  razonSocial: string;
  cuit: string; // Length 11
  contactoEmail: string;
  contactoTelefono: string;
  direccion?: string;
  serviciosOfrecidos: string[];
  zonasCobertura?: any;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerEmpresa(payload: RegisterEmpresaPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/empresa", payload);
  return data;
}

export async function registerProveedor(payload: RegisterProveedorPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/proveedor", payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export function getGoogleOAuthUrl(): string {
  // Backend espera /api/auth/google (global prefix ya incluido en baseURL)
  return `${api.defaults.baseURL?.replace(/\/+$/, "") ?? ""}/auth/google`;
}

