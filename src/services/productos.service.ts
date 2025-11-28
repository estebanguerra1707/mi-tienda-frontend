import { api } from "../lib/api";

export type Producto = {
  id: number;
  name: string;
  sku: string;
  description?: string;
  purchasePrice: number;
  stock?: number;
  categoryId: number;
  providerId: number;
  codigoBarras: string;
  branchId?: number;
};

export interface CreateProductoDTO {
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice?: number;
  stock?: number;
  categoryId?: number;
  businessTypeId?: number;
  branchId?: number;
}

export type UpdateProductoDTO = Partial<CreateProductoDTO>


export async function listarProductos(): Promise<Producto[]> {
  const { data } = await api.get<Producto[]>("/productos");
  return data;
}

export async function crearProducto(p: CreateProductoDTO): Promise<Producto> {
  const { data } = await api.post<Producto>("/productos", p);
  return data;
}

export async function actualizarProducto(id: number, p: UpdateProductoDTO) {
  const { data } = await api.put<Producto>(`/productos/${id}`, p);
  return data;
}

export async function obtenerProducto(id: number): Promise<Producto> {
  const { data } = await api.get<Producto>(`/productos/${id}`);
  return data;
}

export async function borrarLogicoProducto(id: number) {
  await api.delete(`/productos/${id}`);
}
