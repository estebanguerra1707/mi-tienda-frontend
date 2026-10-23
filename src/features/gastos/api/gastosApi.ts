import { api } from "@/lib/api";

export interface GastoDTO {
  id: number;
  descripcion: string;
  monto: number;
  fechaGasto: string; 
  createdAt?: string;
}

export type GastoRequestDTO = Omit<GastoDTO, "id" | "createdAt">;

export interface SpringPage<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Página actual (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
}

export const gastosApi = {
  getAll: async (page = 0, size = 10) => {
    const { data } = await api.get<SpringPage<GastoDTO>>(`/gastos?page=${page}&size=${size}`);
    return data;
  },
  create: async (gasto: GastoRequestDTO) => {
    const { data } = await api.post<GastoDTO>("/gastos", gasto);
    return data;
  },
  update: async (id: number, gasto: GastoRequestDTO) => {
    const { data } = await api.put<GastoDTO>(`/gastos/${id}`, gasto);
    return data;
  },
  delete: async (id: number) => {
    await api.delete(`/gastos/${id}`);
  },
};