// src/features/devoluciones/hooks/useBuscarComprasFiltrado.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CompraItem } from "@/features/compras/api";

// Filtro que mandas al backend
export interface CompraFiltro {
   purchaseId?: string;
  proveedorId?: string;

  start?: string;
  end?: string;

  min?: string;
  max?: string;

  day?: string;
  month?: string;
  year?: string;

  active?: string;
   username?: string;
}

export type CleanFilters = {
  purchaseId?: number;
  proveedorId?: number;
  start?: string;
  end?: string;
  min?: number;
  max?: number;
  day?: number;
  month?: number;
  year?: number;
  active?: boolean;
};


// Estructura de página que devuelve /compras/search
export interface CompraPage {
  content: CompraItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export function useBuscarComprasFiltrado() {
  return useMutation<CompraPage, Error, CompraFiltro>({
    mutationFn: async (filtro) => {

      const payload = {
        purchaseId: filtro.purchaseId || undefined,
        proveedorId: filtro.proveedorId || undefined,
        start: filtro.start || undefined,
        end: filtro.end || undefined,
        min: filtro.min || undefined,
        max: filtro.max || undefined,
        day: filtro.day || undefined,
        month: filtro.month || undefined,
        year: filtro.year || undefined,
        active: filtro.active ?? undefined,
      };

      const { data } = await api.post<CompraPage>(
        "/compras/search?page=0&size=10",
        payload
      );

      return data;
    },
  });
}
