"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import AdvancedFiltersDevolucionCompras from "@/features/devolucion/AdvancedFilterDevolucionesCompras";
import { DevolucionComprasFiltro } from "@/hooks/types/devolucionesCompras";
import { useSearchDevolucionesCompras } from "@/hooks/useSearchDevolucionesCompras";
import { useQueryClient } from "@tanstack/react-query";

export interface BuscadorDevolucionesComprasHandle {
  limpiar: () => void;
}

const PAGE_SIZE = 5;

const BuscadorDevolucionesCompras = forwardRef<
  BuscadorDevolucionesComprasHandle
>((_, ref) => {
  const [filtros, setFiltros] = useState<DevolucionComprasFiltro>({});
  const [buscado, setBuscado] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const queryClient = useQueryClient();

  const { data, refetch, isFetching } = useSearchDevolucionesCompras(
    { ...filtros, page: filtros.page ?? 0, size: filtros.size ?? 50 },
    buscado
  );

  useImperativeHandle(ref, () => ({
    limpiar() {
      setFiltros({});
      setBuscado(false);
      setPageIndex(0);
      queryClient.removeQueries({
        queryKey: ["devolucionesCompras"],
        exact: false,
      });
    },
  }));

  const aplicarFiltros = (next: DevolucionComprasFiltro) => {
    setFiltros(next);
    setBuscado(true);
    setPageIndex(0);
    refetch();
  };

  const devoluciones = data?.content ?? [];
  const total = devoluciones.length;
  const start = pageIndex * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = devoluciones.slice(start, end);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">

      {/* FILTROS */}
      
       
        <AdvancedFiltersDevolucionCompras
          onApply={aplicarFiltros}
          onClear={() => {
            setFiltros({});
            setBuscado(false);
            setPageIndex(0);
            queryClient.removeQueries({
              queryKey: ["devolucionesCompras"],
              exact: false,
            });
          }}
        />

      {/* ESTADOS */}
      {buscado && isFetching && (
        <div className="text-center text-sm text-gray-500 animate-pulse">
          Buscando devoluciones…
        </div>
      )}

      {buscado && !isFetching && devoluciones.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-10">
          No se encontraron devoluciones de compras.
        </div>
      )}

      {/* LISTADO */}
      {pageItems.length > 0 && (
        <div className="space-y-4">

          {/* GRID RESPONSIVO */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((d) => (
              <div
                key={d.id}
                className="
                  bg-white border rounded-xl p-4
                  shadow-sm hover:shadow-md
                  transition
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
                      Compra #{d.compraId}
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
                    Código: {d.codigoBarras}
                  </p>
                  <p className="text-xs">
                    Cantidad devuelta:{" "}
                    <b>{d.cantidadDevuelta}</b>
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
              </div>
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

export default BuscadorDevolucionesCompras;
