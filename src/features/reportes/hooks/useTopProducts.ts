import { useQuery } from "@tanstack/react-query";
import { reportesApi } from "../dashboardApi";

export function useTopProductos(
  branchId: number | null,
  isSuper: boolean
) {
  return useQuery({
    queryKey: ["top-productos", branchId, isSuper],
    queryFn: async () => {
      if (!branchId) throw new Error("branchId requerido");

      const consolidado = await reportesApi.getTopConsolidado(branchId);

      const porUsuario = isSuper
        ? await reportesApi.getTopPorUsuario(branchId)
        : [];

      return { consolidado, porUsuario };
    },
    enabled: !!branchId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
