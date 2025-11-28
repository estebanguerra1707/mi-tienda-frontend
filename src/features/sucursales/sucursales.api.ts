import { api } from "@/lib/api";
import { Sucursal } from "./types";

export async function getSucursales(): Promise<Sucursal[]> {
  const { data } = await api.get("/sucursales");
  return data;
}

export async function getSucursalById(id: number): Promise<Sucursal> {
  const { data } = await api.get(`/sucursales/${id}`);
  return data;
}

export async function createSucursal(payload: Partial<Sucursal>): Promise<Sucursal> {
  const { data } = await api.post("/sucursales", payload);
  return data;
}

export async function updateSucursal(id: number, payload: Partial<Sucursal>): Promise<Sucursal> {
  const { data } = await api.put(`/sucursales/${id}`, payload);
  return data;
}

export async function deleteSucursal(id: number): Promise<void> {
  await api.delete(`/sucursales/${id}`);
}
