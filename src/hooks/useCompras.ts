import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCompras,
  fetchCompraById,
  createCompra,
  deleteCompra,
  searchComprasPaginadas,
  devolucionCompra,
  type CompraItem,
  type CompraPage,
  type CompraCreate,
} from "@/features/compras/api";


// ---------------------------
// 🔹 Tipos
// ---------------------------
export type CompraParams = {
  page?: number;
  size?: number;
  [key: string]: string | number | boolean | undefined;
};

export interface CompraSearchFiltro {
  providerId?: number;
  start?: string;
  end?: string;
  min?: number;
  max?: number;
  day?: number;
  month?: number;
  year?: number;
  active?: boolean;
}

// ---------------------------
// 🔹 Claves de caché
// ---------------------------
export const compraKeys = {
  all: ["compras"] as const,
  list: (params?: CompraParams, filtros?: CompraSearchFiltro) =>
    [...compraKeys.all, "list", params ?? {}, filtros ?? {}] as const,
  search: (filtros?: CompraSearchFiltro) =>
    [...compraKeys.all, "search", filtros ?? {}] as const,
  detail: (id: number) => [...compraKeys.all, "detail", id] as const,
};

// ---------------------------
// 🔹 Obtener lista normal de compras (GET /compras)
// ---------------------------
export function useCompras(params?: CompraParams, filtros?: CompraSearchFiltro) {
  return useQuery<CompraPage, Error>({
    queryKey: compraKeys.list(params, filtros),
    queryFn: async (): Promise<CompraPage> => fetchCompras(params),
  });
}

// ---------------------------
// 🔹 Obtener lista filtrada paginada (POST /compras/search)
// ---------------------------
export function useSearchComprasPaginadas(filters?: {
  page?: number;
  size?: number;
} & CompraSearchFiltro) {
  return useQuery<CompraPage, Error>({
    queryKey: compraKeys.search(filters),
    queryFn: async (): Promise<CompraPage> =>
      searchComprasPaginadas(filters ?? {}),
    placeholderData: (prev) => prev,
  });
}
// ---------------------------
// 🔹 Obtener una compra por ID
// ---------------------------
export function useCompraById(id: number) {
  return useQuery<CompraItem, Error>({
    queryKey: compraKeys.detail(id),
    queryFn: async (): Promise<CompraItem> => fetchCompraById(id),
    enabled: !!id,
  });
}

// ---------------------------
// 🔹 Crear nueva compra
// ---------------------------
export function useCreateCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompraCreate) => createCompra(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compraKeys.all });
    },
  });
}

// ---------------------------
// 🔹 Eliminar compra
// ---------------------------
export function useDeleteCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compraKeys.all });
    },
  });
}

// ---------------------------
// 🔹 Devolución de compra
// ---------------------------
export function useDevolucionCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      compraId: number;
      codigoBarras: string;
      cantidad: number;
      motivo: string;
    }) => devolucionCompra(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compraKeys.all });
    },
  });
}
