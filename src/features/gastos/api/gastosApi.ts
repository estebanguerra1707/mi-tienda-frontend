import { api } from "@/lib/api";

export interface GastoDTO {
  id: number;
  descripcion: string;
  monto: number;
  fechaGasto: string; 
  createdAt?: string;
}

export type GastoRequestDTO = Omit<GastoDTO, "id" | "createdAt">;

export const gastosApi = {
  getAll: async () => {
    const { data } = await api.get<GastoDTO[]>("/gastos");
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