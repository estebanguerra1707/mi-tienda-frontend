import { api } from "@/lib/api";
export type InventarioOwnerType = "PROPIO" | "CONSIGNACION";

export type InventarioItem = {
   id: number;
  productId: number;
  productName: string;
  branchId: number;
  branchName: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number;
  isStockCritico: boolean;
  lastUpdated: string | null;
  updatedBy: string | null;
  ownerType: InventarioOwnerType| null;
};

export type UpsertInventarioDTO = {
  id?: number | null;   // ← para UPDATE opcional
  productId: number;
  branchId: number;
  stock: number;
  minStock: number;
  maxStock: number;
  ownerType: InventarioOwnerType
};

export async function getInventarioDeProducto(branchId: number, productId: number) {
  const { data } = await api.get<InventarioItem>(`/inventario/sucursal/${branchId}/producto/${productId}`
  );
  return data;
}

export async function upsertInventario(payload: UpsertInventarioDTO) {
  const { data } = await api.post<InventarioItem>("/inventario", payload);
  return data;
}