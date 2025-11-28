import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchInventory,
  fetchInventoryByBranch,
  fetchInventoryByProduct,
  createInventory,
  updateInventory,
  upsertInventory,
  type InventoryItem,
  type InventoryPage,
  type InventoryCreate,
  type InventoryUpdate,
} from "@/features/inventario/api";

/* ===== Claves (mismo patrón que products) ===== */
export const inventoryKeys = {
  all: ["inventario"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (params: InventoryQuery) => [...inventoryKeys.lists(), params] as const,
  branch: (branchId: number | string) => [...inventoryKeys.all, "branch", branchId] as const,
  product: (productId: number | string) => [...inventoryKeys.all, "product", productId] as const,
};



/* ===== Query params (equivalente a ProductsQuery) ===== */
export type InventoryQuery = Readonly<{
  page?: number;
  size?: number;
  sort?: string;
}>;

/* Si necesitas filtros extra (solo críticos, etc.), agrégalos aquí y en fetchInventory(params). */
export type InventorySearchParamsObj = Readonly<{
  page?: string;
  size?: string;
  sort?: string;
  branchId?: string;
  businessTypeId?: string;
  q?: string;
  onlyCritical?: string;
}>;

export function useInventorySearchParams() {
  const [sp, setSp] = useSearchParams();

  const obj = useMemo<InventorySearchParamsObj>(() => {
    const o = Object.fromEntries(sp.entries());
    return o as InventorySearchParamsObj;
  }, [sp]);

  const setParam = (key: string, value?: string | number | boolean) =>
    setSp(prev => {
      const next = new URLSearchParams(prev);
      if (value !== undefined && value !== "" && value !== null)
        next.set(key, String(value));
      else next.delete(key);
      next.set("page", "1");
      return next;
    });

  const setBranch = (v?: string) => setParam("branchId", v);
  const setBusinessType = (v?: string) => setParam("businessTypeId", v);
  const setSearch = (v?: string) => setParam("q", v);
  const setOnlyCritical = (v: boolean) => setParam("onlyCritical", v);

  const setParams = (next: URLSearchParams) => setSp(next);

  return { params: sp, paramsObj: obj, setBranch, setBusinessType, setSearch, setOnlyCritical, setParams };
}

/* ===== Queries ===== */

/** Lista paginada: GET /inventario */
export function useInventory(filter: {
  branchId?: number;
  businessTypeId?: number;
  q?: string;
  onlyCritical?: boolean;
  page?: number;
  size?: number;
}) {
  return useQuery<InventoryPage, Error>({
    queryKey: inventoryKeys.list(filter),
    queryFn: () => fetchInventory(filter),
    staleTime: 30_000,
    placeholderData: prev => prev,
  });
}
/** Por sucursal: GET /inventario/sucursal/{branchId} */
// Por sucursal
export function useInventoryByBranch(branchId?: number) {
  const enabled = typeof branchId === "number" && Number.isFinite(branchId);
  return useQuery<InventoryItem[], Error>({
    queryKey: inventoryKeys.branch(enabled ? branchId! : "none"),
    queryFn: () => fetchInventoryByBranch(branchId as number),
    enabled,
    staleTime: 30_000,
  });
}

/** Por producto: GET /inventario/producto/{productId} */
export function useInventoryByProduct(productId?: number) {
  const enabled = typeof productId === "number" && Number.isFinite(productId);
  return useQuery<InventoryItem[], Error>({
    queryKey: inventoryKeys.product(enabled ? productId! : "none"),
    queryFn: () => fetchInventoryByProduct(productId as number),
    enabled,
    staleTime: 30_000,
  });
}

/* ===== Mutations (mismo patrón que products) ===== */

/** Crear: POST /inventario */
export function useCreateInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, InventoryCreate>({
    mutationFn: createInventory,
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

/** Actualizar: PUT /inventario/{id} */
export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, { id: number | string; payload: InventoryUpdate }>({
    mutationFn: ({ id, payload }) => updateInventory(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

/** Upsert (helper): crea o actualiza según exista registro (productId, branchId) */
export function useUpsertInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, InventoryCreate>({
    mutationFn: upsertInventory,
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

export type {
  InventoryItem,
  InventoryPage,
  InventoryCreate,
  InventoryUpdate,
} from "@/features/inventario/api";