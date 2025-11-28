import { api } from "@/lib/api";
import type { Categoria } from "./types";

type MaybePaged<T> = T[] | { content?: T[] };

function normalize<T>(data: MaybePaged<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export interface CategoriaCreateDTO {
  name: string;
  description?: string;
  businessTypeId: number;
}

export type CategoriaUpdateDTO = CategoriaCreateDTO;


export async function createCategoria(payload: CategoriaCreateDTO): Promise<Categoria> {
  const { data } = await api.post<Categoria>("/categorias", payload);
  return data;
}

export async function updateCategoria(
  id: number,
  payload: CategoriaUpdateDTO
): Promise<Categoria> {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, payload);
  return data;
}

export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`);
}


// --- .categorías “actuales” ---
export async function getCategoriasActual(): Promise<Categoria[]> {
  // Ajusta la ruta exactamente a tu backend: '/categorias/actual'
  const { data } = await api.get<MaybePaged<Categoria>>("/categorias/actual");

  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return []; // fallback seguro
}

export async function getCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<MaybePaged<Categoria>>("/categorias");
  return normalize<Categoria>(data);
}

