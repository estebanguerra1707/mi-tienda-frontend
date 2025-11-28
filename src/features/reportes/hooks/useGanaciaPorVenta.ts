import { useEffect, useState } from "react";
import { reportesApi } from "../api";

export function useGananciaPorVenta(
  ventaId: number | null,
  branchId: number | null
) {
  const [ganancia, setGanancia] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ventaId) return;

    const load = async () => {
      setLoading(true);
      try {
        const g = await reportesApi.getGananciaPorVenta(ventaId, branchId);
        setGanancia(g);
      } catch (e) {
        console.error("Error obteniendo ganancia por venta", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ventaId, branchId]);

  return { ganancia, loading };
}
