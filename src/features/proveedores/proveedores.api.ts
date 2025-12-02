import { api } from "@/lib/api";
import {
  Proveedor,
  CreateProveedorDto,
  UpdateProveedorDto,
} from "./types";

export async function fetchProveedores(): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>("/proveedores");
  return data;
}

export async function fetchProveedorById(id: number): Promise<Proveedor> {
  const { data } = await api.get<Proveedor>(`/proveedores/${id}`);
  return data;
}

export async function createProveedor(payload: CreateProveedorDto): Promise<Proveedor> {
  const { data } = await api.post<Proveedor>("/proveedores", payload);
  return data;
}

export async function updateProveedor(id: number, payload: UpdateProveedorDto): Promise<Proveedor> {
  const { data } = await api.put<Proveedor>(`/proveedores/${id}`, payload);
  return data;
}

export async function deleteProveedor(id: number): Promise<void> {
  await api.delete(`/proveedores/${id}`);
}

export async function fetchProveedoresBySucursal(sucursalId: number): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>(`/proveedores/proveedor-sucursal/${sucursalId}`);
  return data;
}