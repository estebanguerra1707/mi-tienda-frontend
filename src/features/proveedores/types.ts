export interface Proveedor {
  id: number;
  name: string;
  contact?: string | null;
  email?: string | null;
  direccion?: string | null;
  tipoNegocioId: number;
  tipoNegocioNombre?: string | null;
}

export interface CreateProveedorDto {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tipoNegocioId: number;
}

export type UpdateProveedorDto = Partial<CreateProveedorDto>;
