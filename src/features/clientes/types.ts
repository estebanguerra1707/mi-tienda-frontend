export type ClienteDTO = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  branchId?: number | null;
  branchIds?: number[];
};

export type ClienteResponseDTO = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;   
  sucursalId: number | null;
  sucursalesCount: number;
  multiSucursal: boolean;
  branchIds?: number[]; 
};
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type ClienteFiltroDTO = {
  id?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean | null;
   branchId?: number | null;
};

export type CreateClienteDto = {
  name: string;
  phone: string | null;
  email: string | null;
  branchIds?: number[] | null;
  branchId?: number | null;
};

export type Cliente = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  active?: boolean;
  branchId?: number | null;
};
