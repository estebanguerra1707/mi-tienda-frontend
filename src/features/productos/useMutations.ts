// src/features/productos/useMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProduct,
  type Product,
  type ProductsPage,
  type ProductsQuery,
} from "@/features/productos/api";
import { productKeys } from "@/hooks/useProducts";

export type UpdateArgs = { id: number | string; payload: Partial<Product> };

export function useUpdateProduct(paramsActuales?: ProductsQuery) {
  const qc = useQueryClient();

  return useMutation<Product, Error, UpdateArgs>({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: (updated) => {
      if (paramsActuales) {
        qc.setQueryData<ProductsPage>(productKeys.list(paramsActuales), (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
          };
        });
      }
      qc.invalidateQueries({ queryKey: productKeys.lists() });
      // si luego defines productKeys.item, podrías invalidarlo aquí
      // qc.invalidateQueries({ queryKey: productKeys.item(updated.id) });
    },
  });
}
