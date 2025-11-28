import { useEffect, useState } from "react";
import { reportesApi } from "../api";

interface Params {
  startDate: string | null;
  endDate: string | null;
  branchId: number | null;
}

export function useBrutasNetas({ startDate, endDate, branchId }: Params) {
  const [brutas, setBrutas] = useState<number | null>(null);
  const [netas, setNetas] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate || !branchId) return;

    const load = async () => {
      setLoading(true);
      try {
        const payload = { startDate, endDate, branchId };

        const [b, n] = await Promise.all([
          reportesApi.getVentasBrutasPorRango(payload),
          reportesApi.getVentasNetasPorRango(payload),
        ]);

        setBrutas(b);
        setNetas(n);

      } catch (err) {
        console.error("Error cargando brutas/netas:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [startDate, endDate, branchId]);

  return { brutas, netas, loading };
}
