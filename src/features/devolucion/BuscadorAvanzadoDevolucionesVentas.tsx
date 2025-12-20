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
>(({ onSelect, onClearFilters }, ref) => {
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
    <div
      className="
        w-full 
        max-w-5xl 
        mx-auto 
        space-y-6 
        px-4 sm:px-6 
        py-4
      "
    >
      <div className="bg-white rounded-xl shadow-md border p-4 sm:p-6">
        <AdvancedFiltersDevoluciones onApply={aplicarFiltros} onClear={onClearFilters} />
      </div>

      {buscado && isFetching && (
        <p className="text-sm text-gray-500 animate-pulse text-center">
          Buscando devoluciones...
        </p>
      )}

      {buscado && !isFetching && devoluciones.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-4">
          No se encontraron devoluciones.
        </div>
      )}

      {buscado && devoluciones.length > 0 && (
        <div className="space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-md border">

          <div className="space-y-4">
            {pageItems.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelect(d)}
                className="
                  w-full 
                  text-left 
                  p-4 sm:p-5 
                  rounded-xl 
                  border 
                  bg-blue-50/40 
                  hover:bg-blue-100 
                  transition 
                  shadow-sm 
                  active:scale-[0.98]
                "
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                  <p className="text-lg font-semibold text-gray-800">
                    Devolución #{d.id}
                  </p>
                  <p className="text-sm text-blue-700 font-medium">
                    Venta #{d.ventaId}
                  </p>
                </div>

                <p className="text-sm text-gray-700 mb-1">
                  {new Date(d.fechaDevolucion).toLocaleString()} •{" "}
                  <span className="font-semibold text-green-700">
                    ${d.montoDevuelto} MXN
                  </span>{" "}
                  ({d.tipoDevolucion})
                </p>

                <p className="text-sm font-medium">Producto: {d.productName}</p>
                <p className="text-sm text-gray-600">Usuario: {d.username}</p>
                <p className="text-sm text-gray-600">Sucursal: {d.branchName}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-3">

            <button
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
              className={`px-4 py-2 rounded-lg border bg-white shadow-sm text-sm sm:text-base ${
                pageIndex === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              ← Anterior
            </button>

            <p className="text-sm text-gray-700 text-center">
              Página{" "}
              <span className="font-semibold">{pageIndex + 1}</span> de {totalPages}
            </p>

            <button
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              className={`px-4 py-2 rounded-lg border bg-white shadow-sm text-sm sm:text-base ${
                pageIndex >= totalPages - 1
                  ? "opacity-40 cursor-not-allowed"
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
