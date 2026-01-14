import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { buscarProductosAvanzado, type ProductoFiltroDTO, type PageResp, type Producto } from "./productos.api";

export function useAdvancedProducts(
  filtro: ProductoFiltroDTO,
  page: number,
  size: number
) {
  return useQuery<PageResp<Producto>>({
    queryKey: ["advanced-products", filtro, page, size],
    queryFn: () => buscarProductosAvanzado(filtro, { page, size }),
    placeholderData: keepPreviousData,
  });
}