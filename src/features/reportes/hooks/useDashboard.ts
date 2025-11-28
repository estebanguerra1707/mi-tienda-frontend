import { useEffect, useState } from "react";
import { reportesApi } from "../dashboardApi";
import { DashboardResumenDTO } from "../api";
import { TopProductoDTO } from "@/features/dashboard/components/ProductChart";

export function useDashboard(branchId: number | null) {
  const [data, setData] = useState<DashboardResumenDTO | null>(null);
  const [topWeek, setTopWeek] = useState<TopProductoDTO[]>([]);
  const [topMonth, setTopMonth] = useState<TopProductoDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      setLoading(true);
      try {
        const resumen = await reportesApi.getResumen(branchId);
        const semana = await reportesApi.getTopSemana(branchId);
        const mes = await reportesApi.getTopMes(branchId);

        setData(resumen);
        setTopWeek(semana);
        setTopMonth(mes);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [branchId]);

  return { data, topWeek, topMonth, loading };
}
