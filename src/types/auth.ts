export type RolUsuario =
  | "SUPER_ADMIN"
  | "CLIENTE_ADMIN"
  | "CLIENTE_OPERADOR"
  | "PROVEEDOR_ADMIN"
  | "PROVEEDOR_OPERADOR";

export interface JwtPayload {
  sub: string;
  email: string;
  rol: RolUsuario | string;
  empresaId?: string | null;
  proveedorId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario | string;
  empresaId?: string | null;
  proveedorId?: string | null;
  isActive?: boolean;
  fotoPerfil?: string | null;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
  isNewUser?: boolean;
  message?: string;
}

