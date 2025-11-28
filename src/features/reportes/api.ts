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

  // 🔵 Ganancia por venta
  getGananciaPorVenta: async (
    ventaId: number,
    branchId: number | null
  ): Promise<number> => {
    const { data } = await api.get(`/ventas/ganancia/${ventaId}`, {
      params: { branchId }
    });
    return Number(data);
  },

  // 🔵 Ventas brutas
  getVentasBrutasPorRango: async (
    payload: GananciaPorFechaDTO
  ): Promise<number> => {
    const { data } = await api.post(`/ventas/brutas`, payload);
    return Number(data);
  },

  // 🔵 Ventas netas
  getVentasNetasPorRango: async (
    payload: GananciaPorFechaDTO
  ): Promise<number> => {
    const { data } = await api.post(`/ventas/netas`, payload);
    return Number(data);
  },

};
