import { api } from "@/lib/api";

export type InventarioOwnerType = "PROPIO" | "CONSIGNACION";

export type InventoryItem = {
  id: number;
  productId: number;
  productName?: string;
  branchId: number;
  branchName?: string;
  stock: number;
  minStock?: number;
  maxStock?: number;
  isStockCritico?: boolean;
  lastUpdated?: string;
  updatedBy?:string;
  businessTypeId?:number;
  ownerType: InventarioOwnerType;
};

export type InventoryPage = {
  content: InventoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type InventoryCreate = {
  productId: number;
  branchId: number;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  isStockCritico?: boolean;
  ownerType?: InventarioOwnerType;

};

export type InventoryUpdate = {
  quantity?: number;
  minStock?: number;
  maxStock?: number;
  isStockCritico?: boolean;
};

export type AddStockForm = {
  quantity: number;
}

/* ===== API ==== */
export async function fetchInventory(filter: {
  branchId?: number;
  businessTypeId?: number;
  ownerType?: InventarioOwnerType;
  q?: string;
  onlyCritical?: boolean;
  page?: number;
  size?: number;
}): Promise<InventoryPage> {
  const { page = 0, size = 20, ...rest } = filter;

  const response = await api.post(
    "/inventario/search",
    rest,
    { params: { page, size } }
  );

  return response.data;
}
export async function fetchInventoryByBranch(branchId: number): Promise<InventoryItem[]> {
  const { data } = await api.get<InventoryItem[]>(`/inventario/sucursal/${branchId}`);
  return data;
}

export async function fetchInventoryByProduct(productId: number): Promise<InventoryItem[]> {
  const { data } = await api.get<InventoryItem[]>(`/inventario/producto/${productId}`);
  return data;
}

export async function createInventory(payload: InventoryCreate): Promise<InventoryItem> {
  const { data } = await api.post<InventoryItem>("/inventario", payload);
  return data;
}

export async function updateInventory(id: number | string, payload: InventoryUpdate): Promise<InventoryItem> {
  const { data } = await api.put<InventoryItem>(`/inventario/${id}`, payload);
  return data;
}
export async function findInventoryRecord(
  productId: number,
  branchId: number,
  ownerType?: InventarioOwnerType
) {
  const list = await fetchInventoryByProduct(productId);

  if (ownerType) {
    return list.find(x => x.branchId === branchId && x.ownerType === ownerType);
  }
  return list.find(x => x.branchId === branchId);
}
export async function upsertInventory(payload: InventoryCreate): Promise<InventoryItem> {

  const existing = await findInventoryRecord(
    payload.productId,
    payload.branchId,
    payload.ownerType
  );
  if (existing) {
    const updatePayload: InventoryUpdate = {
      quantity: payload.quantity,
      minStock: payload.minStock,
      maxStock: payload.maxStock,
      isStockCritico: payload.isStockCritico,
    };
    return updateInventory(existing.id, updatePayload);
  }

  return createInventory(payload);
}