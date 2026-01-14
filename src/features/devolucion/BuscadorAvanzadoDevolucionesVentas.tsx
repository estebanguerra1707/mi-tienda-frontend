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

const PAGE_SIZE = 6;

const BuscadorAvanzadoDevoluciones = forwardRef<
  BuscadorAvanzadoDevolucionesHandle,
  Props
>(({ onSelect, onClearFilters }, ref) => {
  const [filtros, setFiltros] = useState<DevolucionFiltro>({});
  const [buscado, setBuscado] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const queryClient = useQueryClient();

  useImperativeHandle(ref, () => ({
    limpiar() {
      setFiltros({});
      setBuscado(false);
      setPageIndex(0);

      queryClient.removeQueries({
        queryKey: ["devoluciones-ventas"],
        exact: false,
      });
    },
  }));

  const aplicarFiltros = (next: DevolucionFiltro) => {
    setFiltros(next);
    setBuscado(true);
    setPageIndex(0);
  };

  const { data, isFetching } = useSearchDevolucionesVentas(
    { ...filtros, page: 0, size: 50 },
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

      {/* FILTROS */}
      <div className="
        w-full
        max-w-5xl
        mx-auto
        px-4 sm:px-6
        py-6
      ">
        <div className="
          bg-white
          rounded-xl
          shadow-md
          border
          p-4 sm:p-6
        ">
          <AdvancedFiltersDevoluciones
            onApply={aplicarFiltros}
                onClear={onClearFilters}
          />
        </div>
      </div>

      {/* ESTADOS */}
      {buscado && isFetching && (
        <div className="text-center text-sm text-gray-500 animate-pulse">
          Buscando devoluciones…
        </div>
      )}

      {buscado && !isFetching && devoluciones.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-10">
          No se encontraron devoluciones de ventas.
        </div>
      )}

      {/* LISTADO */}
      {pageItems.length > 0 && (
        <div className="space-y-4">

          {/* GRID RESPONSIVO */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelect(d)}
                className="
                  text-left
                  bg-white border rounded-xl p-4
                  shadow-sm hover:shadow-md
                  transition
                  active:scale-[0.98]
                  flex flex-col justify-between
                "
              >
                {/* HEADER */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Devolución #{d.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Venta #{d.ventaId}
                    </p>
                  </div>

                  <span
                    className="
                      text-xs px-2 py-0.5 rounded-full font-semibold
                      bg-blue-100 text-blue-700
                    "
                  >
                    {d.tipoDevolucion}
                  </span>
                </div>

                {/* MONTO */}
                <p className="mt-3 text-lg font-bold text-green-700">
                  ${Number(d.montoDevuelto).toFixed(2)}
                </p>

                {/* PRODUCTO */}
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p className="font-medium">{d.productName}</p>
                  <p className="text-xs text-gray-500">
                    Cantidad devuelta: <b>{d.cantidadDevuelta}</b>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Motivo: {d.motivo}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex justify-between">
                  <span>{d.username}</span>
                  <span>{d.branchName}</span>
                </div>

                <p className="mt-1 text-[11px] text-gray-400">
                  {new Date(d.fechaDevolucion).toLocaleString()}
                </p>
              </button>
            ))}
          </div>

          {/* PAGINACIÓN */}
          <div className="
            sticky bottom-0 bg-white
            border-t pt-4
            flex flex-col sm:flex-row
            gap-3 justify-between items-center
          ">
            <button
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
              className="
                w-full sm:w-auto
                px-5 py-3 rounded-lg
                border bg-gray-50
                disabled:opacity-50
              "
            >
              ← Anterior
            </button>

            <span className="text-xs text-gray-600">
              Página <b>{pageIndex + 1}</b> de {totalPages}
            </span>

            <button
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              className="
                w-full sm:w-auto
                px-5 py-3 rounded-lg
                border bg-gray-50
                disabled:opacity-50
              "
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

BuscadorAvanzadoDevoluciones.displayName =
  "BuscadorAvanzadoDevoluciones";

export default BuscadorAvanzadoDevoluciones;
