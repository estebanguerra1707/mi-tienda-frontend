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

  lastUpdated: string | null;
  updatedBy: string | null;
  unitId: number | null;
  unitAbbr: string | null;
  unitName: string | null;
  permiteDecimales: boolean | null;
  isStockCritico: boolean;
  ownerType: InventarioOwnerType | null;
};

export type UpsertInventarioDTO = {
  id?: number | null;
  productId: number;
  quantity: number;
  branchId: number;
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