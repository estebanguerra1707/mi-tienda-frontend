import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { reportesApi } from "../dashboardApi";

export function useDashboard(branchId: number | null) {
  return useQuery({
    queryKey: ["dashboard", branchId],
    queryFn: async () => {
      if (!branchId) throw new Error("branchId requerido");
      const [resumen, semana, mes] = await Promise.all([
        reportesApi.getResumen(branchId), // Ya no lleva semanasAtras
        reportesApi.getTopSemana(branchId),
        reportesApi.getTopMes(branchId),
      ]);
      return { data: resumen, topWeek: semana, topMonth: mes };
    },
    enabled: !!branchId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
export function useDashboardSemana(branchId: number | null, semanasAtras: number = 0) {
  return useQuery({
    queryKey: ["dashboardSemana", branchId, semanasAtras],
    queryFn: () => {
      if (!branchId) throw new Error("branchId requerido");
      return reportesApi.getResumenSemana(branchId, semanasAtras);
    },
    enabled: !!branchId,
    placeholderData: keepPreviousData, // Evita que la gráfica parpadee
  });
}