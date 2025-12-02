import { api } from "@/lib/api";

export const reportesApi = {


  getResumen: async (branchId: number) => {
    const { data } = await api.get(`/reportes/resumen`, {
      params: { branchId }
    });
    return data;
  },

  getTopSemana: async (branchId: number) => {
    const { data } = await api.get(`/reportes/dashboard/top/semana`, {
      params: { branchId }
    });
    return data;
  },

  getTopMes: async (branchId: number) => {
    const { data } = await api.get(`/reportes/dashboard/top/mes`, {
      params: { branchId }
    });
    return data;
  },
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
