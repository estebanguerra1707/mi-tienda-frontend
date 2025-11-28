import { useEffect, useState } from "react";
import {
  reportesApi,
  GananciaDiaDTO,
  ReporteGananciasDTO,
} from "../api";

interface UseGananciasParams {
  startDate: string | null;
  endDate: string | null;
  branchId: number | null;
}

export function useGanancias({ startDate, endDate, branchId }: UseGananciasParams) {
  const [resumen, setResumen] = useState<ReporteGananciasDTO | null>(null);
  const [diario, setDiario] = useState<GananciaDiaDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate || !branchId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await reportesApi.getResumenGanancias(branchId);
        const dias = await reportesApi.getGananciaDiariaRango({
          startDate,
          endDate,
          branchId,
        });
        setResumen(res);
        setDiario(dias);
      } catch (err) {
        console.error("Error cargando ganancias:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [startDate, endDate, branchId]);

  return { resumen, diario, loading };
}
