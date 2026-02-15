import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVentas,
  searchVentasPaginadas,
  fetchVentaById,
  createVenta,
  deleteVenta,
  devolucionVenta,
  type VentaPage,
  type VentaItem,
  type VentaCreate,
  type VentaSearchFiltro,
  type VentaParams, 
} from "@/features/ventas/api";

export const ventaKeys = {
  all: ["ventas"] as const,
  list: (params?: Record<string, unknown>, filtros?: VentaSearchFiltro) =>
    [...ventaKeys.all, "list", params ?? {}, filtros ?? {}] as const,
  search: (filtros?: VentaSearchFiltro) =>
    [...ventaKeys.all, "search", filtros ?? {}] as const,
  detail: (id: number) => [...ventaKeys.all, "detail", id] as const,
};

export function useVentas(
  params?: VentaParams,
  filtros?: VentaSearchFiltro
) {
  const hasFilters = Object.values(filtros ?? {}).some(v =>
    v !== undefined && v !== "" && v !== null
  );

  return useQuery<VentaPage, Error>({
    queryKey: ventaKeys.list(params, filtros),
    queryFn: () => fetchVentas(params ?? {}, filtros),
    enabled: !hasFilters,
    staleTime: 60_000,
  });
}

export function useSearchVentasPaginadas(
  filtros?: VentaSearchFiltro & { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  const filtrosSinPaginacion = { ...filtros };
  delete filtrosSinPaginacion.page;
  delete filtrosSinPaginacion.size;

  const hasFilters = Object.values(filtrosSinPaginacion ?? {}).some(v =>
    v !== undefined && v !== "" && v !== null
  );

  return useQuery<VentaPage, Error>({
    queryKey: ventaKeys.search(filtros),
    queryFn: () => searchVentasPaginadas(filtros ?? {}),
    enabled: options?.enabled ?? hasFilters,
    staleTime: 60_000,
  });
}

export function useVentaById(id: number) {
  return useQuery<VentaItem, Error>({
    queryKey: ventaKeys.detail(id),
    queryFn: async () => fetchVentaById(id),
    enabled: !!id,
  });
}

export function useCreateVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VentaCreate) => createVenta(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ventaKeys.all });
    },
  });
}

export function useDeleteVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteVenta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ventaKeys.all });
    },
  });
}

export function useDevolucionVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ventaId: number; codigoBarras: string; cantidad: number; motivo: string }) =>
      devolucionVenta(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ventaKeys.all });
    },
  });
}
export type { VentaSearchFiltro, VentaParams, VentaPage, VentaItem, VentaCreate } from "@/features/ventas/api";