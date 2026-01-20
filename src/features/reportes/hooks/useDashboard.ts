import { useQuery } from "@tanstack/react-query";
import { reportesApi } from "../dashboardApi";

export function useDashboard(branchId: number | null) {
  return useQuery({
    queryKey: ["dashboard", branchId],
    queryFn: async () => {
      if (!branchId) throw new Error("branchId requerido");

      const [resumen, semana, mes] = await Promise.all([
        reportesApi.getResumen(branchId),
        reportesApi.getTopSemana(branchId),
        reportesApi.getTopMes(branchId),
      ]);

      return {
        data: resumen,
        topWeek: semana,
        topMonth: mes,
      };
    },
    enabled: !!branchId,
    staleTime: 5 * 60_000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}