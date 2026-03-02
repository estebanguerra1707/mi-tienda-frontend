import { useQuery } from "@tanstack/react-query";
import { reportesApi } from "../dashboardApi";

export function useTopProductos(
  branchId: number | null,
  isSuper: boolean,
  enabled = true
) {
  return useQuery({
    queryKey: ["top-productos", branchId, isSuper],
    queryFn: async () => {
      if (branchId == null) throw new Error("branchId requerido");

      const [consolidado, porUsuario] = await Promise.all([
        reportesApi.getTopConsolidado(branchId),
        isSuper ? reportesApi.getTopPorUsuario(branchId) : Promise.resolve([]),
      ]);

      return { consolidado, porUsuario };
    },
    enabled: branchId != null && enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
