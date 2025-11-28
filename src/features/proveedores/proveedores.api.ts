import http from "@/lib/http";
import {
  Proveedor,
  CreateProveedorDto,
  UpdateProveedorDto,
} from "./types";

export async function fetchProveedores(): Promise<Proveedor[]> {
  const { data } = await http.get<Proveedor[]>("/proveedores");
  return data;
}

export async function fetchProveedorById(id: number): Promise<Proveedor> {
  const { data } = await http.get<Proveedor>(`/proveedores/${id}`);
  return data;
}

export async function createProveedor(payload: CreateProveedorDto): Promise<Proveedor> {
  const { data } = await http.post<Proveedor>("/proveedores", payload);
  return data;
}

export async function updateProveedor(id: number, payload: UpdateProveedorDto): Promise<Proveedor> {
  const { data } = await http.put<Proveedor>(`/proveedores/${id}`, payload);
  return data;
}

export async function deleteProveedor(id: number): Promise<void> {
  await http.delete(`/proveedores/${id}`);
}

export async function fetchProveedoresBySucursal(sucursalId: number): Promise<Proveedor[]> {
  const { data } = await http.get<Proveedor[]>(`/proveedores/proveedor-sucursal/${sucursalId}`);
  return data;
}