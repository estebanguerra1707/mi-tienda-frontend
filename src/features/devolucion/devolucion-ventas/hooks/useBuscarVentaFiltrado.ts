import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VentaItem } from "../types/DevolucionVenta";

export interface VentaFiltro {
  id?: string;
  clientId?: string;

  start?: string;
  end?: string;

  min?: string;
  max?: string;

  day?: string;
  month?: string;
  year?: string;

  active?: string;
}

export interface VentaPage {
  content: VentaItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export function useBuscarVentasFiltrado() {
  return useMutation<VentaPage, Error, VentaFiltro>({
    mutationFn: async (filtro) => {
      const payload = {
        id: filtro.id || undefined,
        clientId: filtro.clientId || undefined,
        start: filtro.start || undefined,
        end: filtro.end || undefined,
        min: filtro.min || undefined,
        max: filtro.max || undefined,
        day: filtro.day || undefined,
        month: filtro.month || undefined,
        year: filtro.year || undefined,
        active: filtro.active ?? undefined,
      };

      const { data } = await api.post<VentaPage>(
        "/ventas/filter?page=0&size=10",
        payload
      );

      return data;
    },
  });
}
