import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVentas,
  searchVentasPaginadas,
  fetchVentaById,
  createVenta,
  deleteVenta,
  devolucionVenta,
  generarDetalleVentaConsolidada,
  generarVentaConsolidada,
  registrarAbonoVenta,
  obtenerPagosVenta,
  type VentaPagoRequest,
  type VentaPagoResponse,
  type GenerarVentaConsolidadaResponse,
  obtenerDetalleVentaConsolidadaPorTicket,
  type VentaPage,
  type VentaItem,
  type VentaCreate,
  type VentaSearchFiltro,
  type VentaParams,
  type VentaConsolidadaRequest,
  type VentaConsolidadaResponse,
  fetchComandasEnPreparacion,
  actualizarEstadoOrdenVenta,
} from "@/features/ventas/api";

export const ventaKeys = {
  all: ["ventas"] as const,
  list: (params?: Record<string, unknown>, filtros?: VentaSearchFiltro) =>
    [...ventaKeys.all, "list", params ?? {}, filtros ?? {}] as const,
  search: (filtros?: VentaSearchFiltro) =>
    [...ventaKeys.all, "search", filtros ?? {}] as const,
  detail: (id: number) => [...ventaKeys.all, "detail", id] as const,
  pagos: (ventaId: number) => [...ventaKeys.all, "pagos", ventaId] as const,
  consolidadoDetail: (weeklyTicketId: number | string) =>
  [...ventaKeys.all, "consolidado-detail", weeklyTicketId] as const,
  comandasActivas: () => [...ventaKeys.all, "comandas-activas"] as const,
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
  filtros?: VentaSearchFiltro & { page?: number; size?: number }
) {
  return useQuery<VentaPage, Error>({
    queryKey: ventaKeys.search(filtros),
    queryFn: () => searchVentasPaginadas(filtros ?? {}),
    // Ya no bloqueamos la petición, queremos que cargue la página 0 al iniciar
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

export function usePagosVenta(ventaId?: number | null) {
  return useQuery<VentaPagoResponse[], Error>({
    queryKey: ventaKeys.pagos(ventaId ?? 0),
    queryFn: () => obtenerPagosVenta(ventaId!),
    enabled: !!ventaId,
  });
}

export function useCreateVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VentaCreate) => createVenta(payload),
    onSuccess: () => {
      // Refresca la tabla y el historial de ventas
      qc.invalidateQueries({ queryKey: ventaKeys.all });
      // Refresca las tarjetas estáticas del Dashboard
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      // Refresca la gráfica semanal del Dashboard
      qc.invalidateQueries({ queryKey: ["dashboardSemana"] });
    },
  });
}

export function useRegistrarAbonoVenta() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      ventaId,
      payload,
    }: {
      ventaId: number;
      payload: VentaPagoRequest;
    }) => registrarAbonoVenta(ventaId, payload),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ventaKeys.all });
      qc.invalidateQueries({ queryKey: ventaKeys.detail(variables.ventaId) });
      qc.invalidateQueries({ queryKey: ventaKeys.pagos(variables.ventaId) });
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

export function useGenerarDetalleVentaConsolidada() {
  return useMutation<VentaConsolidadaResponse, Error, VentaConsolidadaRequest>({
    mutationFn: (payload) => generarDetalleVentaConsolidada(payload),
  });
}
export function useGenerarVentaConsolidada() {
  const qc = useQueryClient();

  return useMutation<
    GenerarVentaConsolidadaResponse,
    Error,
    VentaConsolidadaRequest
  >({
    mutationFn: (payload) => generarVentaConsolidada(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ventaKeys.all });
    },
  });
}

export function useDetalleVentaConsolidadaPorTicket(
  weeklyTicketId?: number | string | null
) {
  return useQuery<VentaConsolidadaResponse, Error>({
    queryKey: ventaKeys.consolidadoDetail(weeklyTicketId ?? ""),
    queryFn: () => obtenerDetalleVentaConsolidadaPorTicket(weeklyTicketId!),
    enabled: !!weeklyTicketId,
  });
}

export function useComandasEnPreparacion() {
  return useQuery<VentaItem[], Error>({
    queryKey: ventaKeys.comandasActivas(),
    queryFn: () => fetchComandasEnPreparacion(),
    // Opcional: refetchInterval hará que el tablero consulte nuevas comandas 
    // automáticamente cada 15 segundos sin necesidad de recargar la página.
    refetchInterval: 15000, 
  });
}

export function useActualizarEstadoOrden() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: "ENTREGADO" | "CANCELADO" }) =>
      actualizarEstadoOrdenVenta(id, estado),
    onSuccess: () => {
      // Invalida la lista de comandas para que desaparezca del Kanban
      qc.invalidateQueries({ queryKey: ventaKeys.comandasActivas() });
      // Invalida el historial de ventas general
      qc.invalidateQueries({ queryKey: ventaKeys.all });
    },
  });
}

export type {
  VentaSearchFiltro,
  VentaParams,
  VentaPage,
  VentaItem,
  VentaCreate,
  VentaConsolidadaRequest,
  VentaConsolidadaResponse,
  GenerarVentaConsolidadaResponse,
  VentaPagoRequest,
  VentaPagoResponse,
  obtenerDetalleVentaConsolidadaPorTicket,
} from "@/features/ventas/api";


