import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from "react";

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type ProductsPage,
  type ProductsQuery,
} from '@/features/productos/api';

// Claves de react-query
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductsQuery) => [...productKeys.lists(), params] as const,
};

type ProductSearchParamsObj  = Readonly<{
  barcodeName?: string;
  page?: number;
  size?: number;
  sort?: string;
  min?: string;
  max?: string;
  categoryId?: string;
  available?: string;
  withoutCategory?: string;
}>;

export function useProductSearchParams() {
  const [sp, setSp] = useSearchParams();

  const obj = useMemo<ProductSearchParamsObj>(() => {
    const o: Record<string, string> = Object.fromEntries(sp.entries());
    return o as ProductSearchParamsObj;
  }, [sp]);

  // antes setQ; ahora setSearch para barcodeName
  const setSearch = (value: string) =>
    setSp(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set("barcodeName", value); else next.delete("barcodeName");
      next.set("page", "1");
      return next;
    });

  const setParams = (next: URLSearchParams) => setSp(next);

  return { params: sp, paramsObj: obj, setSearch, setParams };
}


// Lista (v5, objeto de opciones, y data tipada)
export function useProducts(params?: ProductsQuery) {
  const emptyQuery: ProductsQuery = {} as ProductsQuery;
  const queryParams = params ?? emptyQuery;

  return useQuery<ProductsPage, Error>({
    queryKey: productKeys.list(queryParams),
    queryFn: () => fetchProducts(queryParams),
    staleTime: 30_000, // 30 segundos
  });
}


// Crear
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, Omit<Product, 'id'>>({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}


// Actualizar (mutationFn recibe UN objeto variables)
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<
    Product,
    Error,
    { id: number | string; payload: Partial<Product> }
  >({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

// Eliminar
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, number | string>({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}


