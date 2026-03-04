export interface Plan {
  id: string;
  nombre: string;
  descripcion?: string | null;
  serviciosIncluidos: string[];
  precioMensual: number;
  isActive?: boolean;
}

