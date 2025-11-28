import { useEffect, useState } from "react";
import { reportesApi } from "../dashboardApi";
import { TopProductoDTO } from "@/features/dashboard/components/ProductChart";

export function useTopProductos(branchId: number | null, isSuper: boolean) {
  const [consolidado, setConsolidado] = useState<TopProductoDTO[]>([]);
  const [porUsuario, setPorUsuario] = useState<TopProductoDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branchId) {
      setConsolidado([]);
      setPorUsuario([]);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);

 
        const conso = await reportesApi.getTopConsolidado(branchId);
        if (isMounted) setConsolidado(conso);

        if (isSuper) {
          const users = await reportesApi.getTopPorUsuario(branchId);
          if (isMounted) setPorUsuario(users);
        } else {
          if (isMounted) setPorUsuario([]);
        }

      } catch (error) {
        console.error("Error cargando top productos:", error);
        if (isMounted) {
          setConsolidado([]);
          setPorUsuario([]);
        }

      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [branchId, isSuper]);

  return { consolidado, porUsuario, loading };
}
