import { api } from "@/lib/api";

export const reportesApi = {

  // 🔵 Resumen del dashboard
  getResumen: async (branchId: number) => {
    const { data } = await api.get(`/reportes/resumen`, {
      params: { branchId }
    });
    return data;
  },

  // 🔵 Top vendidos de la semana (usa el endpoint dedicado del backend)
  getTopSemana: async (branchId: number) => {
    const { data } = await api.get(`/reportes/dashboard/top/semana`, {
      params: { branchId }
    });
    return data;
  },

  // 🔵 Top vendidos del mes (usa el endpoint dedicado del backend)
  getTopMes: async (branchId: number) => {
    const { data } = await api.get(`/reportes/dashboard/top/mes`, {
      params: { branchId }
    });
    return data;
  },

  // 🔵 Top vendidos usando un rango de fechas libre (inicio-fin)
  getTopVendidosRango: async (
    inicio: string,
    fin: string,
    branchId?: number
  ) => {
    const { data } = await api.get(`/reportes/top-vendidos`, {
      params: { inicio, fin, branchId }
    });
    return data;
  },
  getTopConsolidado: async (branchId: number) => {
  const { data } = await api.get(`/reportes/top/consolidado`, {
    params: { branchId },
  });
  return data;
},

getTopPorUsuario: async (branchId: number) => {
  const { data } = await api.get(`/reportes/top/por-usuario`, {
    params: { branchId },
  });
  return data;
},
 getTopProductos: async (
    groupBy: string,
    start: string,
    end: string,
    branchId?: number
  ) => {
    const { data } = await api.get(`/reportes/top-products`, {
      params: {
        groupBy,
        start,
        end,
        branchId,
      },
    });
    return data;
  },
  
};
