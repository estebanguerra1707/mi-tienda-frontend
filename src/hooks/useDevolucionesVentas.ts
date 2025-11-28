import { useQuery  } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DevolucionFiltro,
  DevolucionPage
} from "@/hooks/types/devoluciones";

export async function searchDevolucionesVentas(
  filtros: DevolucionFiltro
): Promise<DevolucionPage> {
  const page = filtros.page ?? 0;
  const size = filtros.size ?? 20;

  const { data } = await api.post(
    `/ventas/filterDevoluciones?page=${page}&size=${size}`,
    filtros
  );

  return data;
}
export function useSearchDevolucionesVentas(
  filtros: DevolucionFiltro,
  enabled: boolean
) {
  return useQuery<DevolucionPage>({
    queryKey: ["devoluciones-ventas", filtros],
    queryFn: () => searchDevolucionesVentas(filtros),
    enabled,
    gcTime: 0,

    placeholderData: () => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 0,
      number: 0,
      first: true,
      last: true,
    }),
  });
}