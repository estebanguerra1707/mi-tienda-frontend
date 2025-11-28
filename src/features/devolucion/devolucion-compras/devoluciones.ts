import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  DevolucionVentaRequest,
  DevolucionVentaResponse,
  DevolucionCompraRequest,
  DevolucionCompraResponse,
} from "@/types/devoluciones";

import { DevolucionFiltro, DevolucionPage } from "@/hooks/types/devoluciones";
import { DevolucionComprasFiltro, DevolucionComprasPage} from "@/hooks/types/devolucionesCompras";

export async function devolverVenta(
  payload: DevolucionVentaRequest
): Promise<DevolucionVentaResponse> {
  const { data } = await api.post<DevolucionVentaResponse>(
    "/ventas/devolucion",
    payload
  );
  return data;
}

export async function devolverCompra(
  payload: DevolucionCompraRequest
): Promise<DevolucionCompraResponse> {
  const { data } = await api.post<DevolucionCompraResponse>(
    "/compras/devolucion",
    payload
  );
  return data;
}

async function searchDevolucionesPaginadas(
  filtros: DevolucionFiltro
): Promise<DevolucionPage> {
  const page = filtros.page ?? "0";
  const size = filtros.size ?? "20";

  const { data } = await api.post(
    `/ventas/filterDevoluciones?page=${page}&size=${size}`,
    filtros
  );

  return data;
}

export function useFilterDevolucionesPaginadas(
  filtros: DevolucionFiltro,
  options?: { enabled?: boolean }
) {
  const filtrosSinPaginacion = { ...filtros };
  delete filtrosSinPaginacion.page;
  delete filtrosSinPaginacion.size;

  const hasFilters = Object.values(filtrosSinPaginacion).some(
    (v) => v !== undefined && v !== ""
  );

  return useQuery<DevolucionPage, Error>({
    queryKey: ["devoluciones-filter", filtros],
    queryFn: () => searchDevolucionesPaginadas(filtros),
    enabled: options?.enabled ?? hasFilters,
    staleTime: 60000,
  });
}

export async function searchDevolucionesCompras(
  filtros: DevolucionComprasFiltro
): Promise<DevolucionComprasPage> {
  const page = filtros.page ?? 0;
  const size = filtros.size ?? 20;

  const { data } = await api.post<DevolucionComprasPage>(
    `/compras/devolucion/search?page=${page}&size=${size}`,
    filtros
  );

  return data;
}