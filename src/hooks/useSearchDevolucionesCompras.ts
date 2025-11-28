import { useQuery } from "@tanstack/react-query";
import { searchDevolucionesCompras } from "@/features/devolucion/devolucion-compras/devoluciones";
import { DevolucionComprasFiltro, DevolucionComprasPage } from "./types/devolucionesCompras";

export function useSearchDevolucionesCompras(
  filtros: DevolucionComprasFiltro,
  enabled: boolean
) {
  return useQuery<DevolucionComprasPage>({
    queryKey: ["devolucionesCompras", filtros],
    queryFn: () => searchDevolucionesCompras(filtros),
    enabled,
    staleTime: 60_000,
  });
}
