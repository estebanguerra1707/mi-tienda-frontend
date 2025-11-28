"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { DevolucionItem, DevolucionFiltro } from "@/hooks/types/devoluciones";
import { useSearchDevolucionesVentas } from "@/hooks/useDevolucionesVentas";

import AdvancedFiltersDevoluciones from "./AdvancedFiltersDevolucionesVentas";

export interface BuscadorAvanzadoDevolucionesHandle {
  limpiar: () => void;
}

interface Props {
  onSelect: (dev: DevolucionItem) => void;
  onClearFilters: () => void;
}

const BuscadorAvanzadoDevoluciones = forwardRef<
  BuscadorAvanzadoDevolucionesHandle,
  Props
>(({onClearFilters }, ref) => {
  const [filtros, setFiltros] = useState<DevolucionFiltro>({});
  const [buscado, setBuscado] = useState(false);
  
  const PAGE_SIZE = 5;
  const [pageIndex, setPageIndex] = useState(0);
  
  const queryClient = useQueryClient();

  useImperativeHandle(ref, () => ({
    limpiar() {
      setFiltros({});
      setBuscado(false);

      queryClient.removeQueries({
        queryKey: ["devoluciones-ventas"],
        exact: false,
      });

      queryClient.setQueryData(["devoluciones-ventas"], {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 0,
        number: 0,
        first: true,
        last: true,
      });
    },
  }));

  const aplicarFiltros = (next: DevolucionFiltro) => {
    setFiltros(next);
    setBuscado(true);
  };

  const { data, isFetching } = useSearchDevolucionesVentas(
    { ...filtros, page: 0, size: 20 },
    buscado
  );

  const devoluciones = buscado ? data?.content ?? [] : [];
  const total = devoluciones.length;

  const start = pageIndex * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const pageItems = devoluciones.slice(start, end);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdvancedFiltersDevoluciones onApply={aplicarFiltros} onClear={onClearFilters} />

      {/* Loading */}
      {buscado && isFetching && (
        <p className="text-sm text-gray-500 animate-pulse">Buscando devoluciones...</p>
      )}

      {/* Sin resultados */}
      {buscado && !isFetching && devoluciones.length === 0 && (
        <p className="text-gray-500 text-sm">No se encontraron devoluciones.</p>
      )}

      {/* Resultados */}
      {buscado && devoluciones.length > 0 && (
        <div className="space-y-3 w-full max-w-7xl mx-auto">

          {pageItems.map((d) => (
            <div
              key={d.id}
              className="
                w-full
                text-left 
                p-5 
                rounded-xl 
                border border-gray-200 
                bg-blue-50/20 
                transition-all
              "
            >
              {/* ENCABEZADO */}
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-semibold text-gray-800">
                  Devolución #{d.id}
                </p>
                <p className="text-sm text-blue-700 font-medium">
                  Venta #{d.ventaId}
                </p>
              </div>

              {/* FECHA + MONTO */}
              <div className="text-sm text-gray-700 mb-2">
                {new Date(d.fechaDevolucion).toLocaleString()} •{" "}
                <span className="font-semibold text-green-700">
                  ${d.montoDevuelto} MXN
                </span>{" "}
                ({d.tipoDevolucion})
              </div>

              {/* DETALLES */}
              <p className="text-sm font-medium mb-1">Producto: {d.productName}</p>
              <p className="text-sm text-gray-600">Usuario: {d.username}</p>
              <p className="text-sm text-gray-600">Sucursal: {d.branchName}</p>
            </div>
          ))}

          {/* CONTROLES DE PAGINACIÓN */}
          <div className="flex justify-between items-center pt-4">
            <button
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
              className={`px-4 py-2 rounded-md border ${
                pageIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              ← Anterior
            </button>

            <p className="text-sm text-gray-700">
              Página{" "}
              <span className="font-semibold">
                {pageIndex + 1}
              </span>{" "}
              de {totalPages}
            </p>

            <button
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              className={`px-4 py-2 rounded-md border ${
                pageIndex >= totalPages - 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

BuscadorAvanzadoDevoluciones.displayName = "BuscadorAvanzadoDevoluciones";
export default BuscadorAvanzadoDevoluciones;
