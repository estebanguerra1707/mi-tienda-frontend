import { api } from "@/lib/api";

export type InventarioOwnerType = "PROPIO" | "CONSIGNACION";

/* ===== Tipos ===== */
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


/* ===== API ===== */

/** GET /inventario  (paginado opcional) */
export async function fetchInventory(filter: {
  branchId?: number;
  businessTypeId?: number;
  q?: string;
  onlyCritical?: boolean;
  page?: number;
  size?: number;
}): Promise<InventoryPage> {
  const { page = 0, size = 20, ...rest } = filter;
  const response = await api.post(`/inventario/search`, {
    ...rest,
    page,
    size,
  });
  return response.data;
}
/** GET /inventario/sucursal/{branchId} */
export async function fetchInventoryByBranch(branchId: number): Promise<InventoryItem[]> {
  const { data } = await api.get<InventoryItem[]>(`/inventario/sucursal/${branchId}`);
  return data;
}

/** GET /inventario/producto/{productId} */
export async function fetchInventoryByProduct(productId: number): Promise<InventoryItem[]> {
  const { data } = await api.get<InventoryItem[]>(`/inventario/producto/${productId}`);
  return data;
}

/** POST /inventario */
export async function createInventory(payload: InventoryCreate): Promise<InventoryItem> {
  const { data } = await api.post<InventoryItem>("/inventario", payload);
  return data;
}

/** PUT /inventario/{id} */
export async function updateInventory(id: number | string, payload: InventoryUpdate): Promise<InventoryItem> {
  const { data } = await api.put<InventoryItem>(`/inventario/${id}`, payload);
  return data;
}

/* ===== Helpers opcionales ===== */

/** Busca el registro de inventario por (productId, branchId) a partir de /inventario/producto/{id} */
export async function findInventoryRecord(
  productId: number,
  branchId: number,
  ownerType?: InventarioOwnerType
) {
  const list = await fetchInventoryByProduct(productId);

  // ✅ Si viene ownerType, buscamos exacto (modo por dueño)
  if (ownerType) {
    return list.find(x => x.branchId === branchId && x.ownerType === ownerType);
  }

  // ✅ Si NO viene ownerType, buscamos por sucursal (modo normal)
  // (asumimos que solo hay un registro por product+branch cuando usaInventarioPorDuenio=false)
  return list.find(x => x.branchId === branchId);
}

/** UPSERT: crea si no existe; si existe hace PUT con los campos mutables */
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