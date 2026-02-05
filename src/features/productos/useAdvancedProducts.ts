import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  buscarProductosAvanzado,
  type ProductoFiltroDTO,
  type PageResp,
  type Producto,
} from "./productos.api";

export function useAdvancedProducts(
  filtro: ProductoFiltroDTO,
  page: number,
  size: number,
  options?: {
    enabled?: boolean;
  }
) {
  const filtroKey = JSON.stringify(filtro);

  return useQuery<PageResp<Producto>>({
    queryKey: ["advanced-products", filtroKey, page, size],
    queryFn: () => buscarProductosAvanzado(filtro, { page, size }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    enabled: options?.enabled ?? true,
  });
}
