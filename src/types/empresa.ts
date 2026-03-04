export interface Empresa {
  id: string;
  razonSocial: string;
  cuit: string;
  telefono: string;
  email: string;
  direccion: string;
  planId?: string | null;
  isActive?: boolean;
}

