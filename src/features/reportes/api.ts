import { api } from "@/lib/api";
import { TopProductoDTO } from "../dashboard/components/ProductChart";
export interface GananciaPorFechaDTO {
  startDate: string;
  endDate: string;
  branchId: number | null;
}
export interface DashboardResumenDTO {
  totalProductos: number;
  productosCriticos: number;
  ventasHoy: number;
  ingresosMes: number;
}
export interface ReporteGananciasDTO {
  hoy: number;
  semana: number;
  mes: number;
}
export interface GananciaDiaDTO {
  fecha: string;
  ganancia: number;
}

export const reportesApi = {

  getResumen: async (branchId: number) => {
    const { data } = await api.get(`/reportes/resumen`, {
      params: { branchId }
    });
    return data;
  },

  // 🔵 TOP SEMANA
  getTopSemana: async (branchId: number): Promise<TopProductoDTO[]> => {
    const { data } = await api.get(`/reportes/dashboard/top/semana`, {
      params: { branchId }
    });
    return data.map((p: TopProductoDTO) => ({
      ...p,
      totalQuantity: Number(p.totalQuantity),
    }));
  },

  // 🔵 TOP MES
  getTopMes: async (branchId: number): Promise<TopProductoDTO[]> => {
    const { data } = await api.get(`/reportes/dashboard/top/mes`, {
      params: { branchId }
    });
    return data.map((p: TopProductoDTO) => ({
      ...p,
      totalQuantity: Number(p.totalQuantity),
    }));
  },

  // 🔵 TOP RANGO
  getTopVendidosRango: async (
    inicio: string,
    fin: string,
    branchId?: number
  ): Promise<TopProductoDTO[]> => {

    const { data } = await api.get(`/reportes/top-vendidos`, {
      params: { inicio, fin, branchId: branchId || null }
    });

    return data.map((p: TopProductoDTO) => ({
      ...p,
      totalQuantity: Number(p.totalQuantity),
    }));
  },
  // 🔵 Ventas brutas
  getVentasBrutasPorRango: async (
    payload: GananciaPorFechaDTO
  ): Promise<number> => {
    const { data } = await api.post(`/reportes/brutas`, payload);
    return Number(data);
  },

  // 🔵 Ventas netas
  getVentasNetasPorRango: async (
    payload: GananciaPorFechaDTO
  ): Promise<number> => {
    const { data } = await api.post(`/reportes/netas`, payload);
    return Number(data);
  },
    // =========================================================
  // 🔵 3) GANANCIA POR DÍA
  // =========================================================
  getGananciaDia: async (
    fecha: string,
    branchId: number
  ): Promise<GananciaDiaDTO> => {
    const { data } = await api.get(`/reportes/ganancia-dia`, {
      params: { fecha, branchId }
    });

    return {
      fecha: data.fecha,
      ganancia: Number(data.ganancia),
    };
  },
    // =========================================================
  // 🔵 5) GANANCIA TOTAL POR RANGO
  // =========================================================
  getGananciaPorRango: async (
    payload: GananciaPorFechaDTO
  ): Promise<number> => {
    const { data } = await api.post(`/reportes/ganancia-rango`, payload);
    return Number(data);
  },
 // =========================================================
  // 🔵 9) GANANCIA POR VENTA
  // =========================================================
  getGananciaPorVenta: async (
    ventaId: number,
    branchId: number | null
  ): Promise<number> => {
    const { data } = await api.get(`/reportes/ganancia/${ventaId}`, {
      params: { branchId }
    });

    return Number(data);
  },
    // =========================================================
  // 🔵 2) RESUMEN GANANCIAS (hoy/semana/mes)
  // =========================================================
  getGananciasResumen: async (
    branchId: number | null
  ): Promise<ReporteGananciasDTO> => {
    const { data } = await api.get(`/reportes/ganancias`, {
      params: { branchId }
    });
    return data as ReporteGananciasDTO;
  },
    // =========================================================
  // 🔵 4) GANANCIA DIARIA POR RANGO (para gráficas por día/semana/mes)
  // =========================================================
  getGananciaDiariaRango: async (
    payload: GananciaPorFechaDTO
  ): Promise<GananciaDiaDTO[]> => {

    const { data } = await api.post<GananciaDiaDTO[]>(
      `/reportes/ganancia-diaria-rango`,
      payload
    );

    return data.map((d): GananciaDiaDTO => ({
      fecha: d.fecha,
      ganancia: Number(d.ganancia),
    }));
  },
    // ==========================
  // 🔵 RESUMEN DE GANANCIAS (Hoy, Semana, Mes)
  // ==========================
  getResumenGanancias: async (branchId: number | null) => {
    const { data } = await api.get(`/reportes/ganancias`, {
      params: { branchId }
    });
    return data as ReporteGananciasDTO;
  },

};
