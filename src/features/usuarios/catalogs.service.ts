import { api } from "@/lib/api";

export interface Sucursal {
  id: number;
  name: string;
}

export async function fetchSucursales(): Promise<Sucursal[]> {
  const { data } = await api.get<Sucursal[]>("/sucursales");
  return data;
}
