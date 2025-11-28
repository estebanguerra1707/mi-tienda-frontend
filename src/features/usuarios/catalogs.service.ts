// src/features/usuarios/catalogs.service.ts
import http from "@/lib/http";

export interface Sucursal {
  id: number;
  name: string;
}

export async function fetchSucursales(): Promise<Sucursal[]> {
  const { data } = await http.get<Sucursal[]>("/sucursales");
  return data;
}
