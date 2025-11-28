// src/features/inventario/useMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createInventory,
  updateInventory,
  type InventoryItem,
  type InventoryCreate,
  type InventoryUpdate,
} from "./api";

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (p?: unknown) => [...inventoryKeys.lists(), p] as const,
  byId: (id: number | string) => [...inventoryKeys.all, "byId", id] as const,
};

export function useCreateInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, InventoryCreate>({
    mutationFn: createInventory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation<
    InventoryItem,
    Error,
    { id: number | string; payload: InventoryUpdate }
  >({
    mutationFn: ({ id, payload }) => updateInventory(id, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      qc.invalidateQueries({ queryKey: inventoryKeys.byId(v.id) });
    },
  });
}
