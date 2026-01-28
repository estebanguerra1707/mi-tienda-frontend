export interface Proveedor {
  id: number;
  name: string;
  contact?: string | null;
  email?: string | null;
  sucursales: SucursalLite[];
}

export interface CreateProveedorDto {
  name: string;
  contact?: string | null;
  email?: string | null;
  branchIds: number[];
}
export interface SucursalLite {
  id: number;
  name: string;
}

export type UpdateProveedorDto = Partial<Omit<CreateProveedorDto, "branchId">>;
