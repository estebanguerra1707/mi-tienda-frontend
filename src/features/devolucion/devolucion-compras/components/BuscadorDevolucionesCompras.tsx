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
    <div className="space-y-4">

      {/* ---------- FILTROS ---------- */}
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

      {/* ---------- ESTADOS ---------- */}
      {buscado && isFetching && (
        <p className="text-sm text-gray-500 animate-pulse">
          Buscando devoluciones…
        </p>
      )}

      {buscado && !isFetching && devoluciones.length === 0 && (
        <p className="text-sm text-gray-500">
          No se encontraron devoluciones de compras.
        </p>
      )}

      {/* ---------- LISTA MOBILE-FIRST ---------- */}
      {pageItems.length > 0 && (
        <div className="space-y-2">

          {pageItems.map((d) => (
            <div
              key={d.id}
              className="
                border rounded-lg
                px-3 py-3
                text-sm
                hover:bg-blue-50
                transition
              "
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-800">
                  Devolución #{d.id}
                </p>
                <span className="text-xs text-blue-600">
                  Compra #{d.compraId}
                </span>
              </div>

              {/* Meta */}
              <p className="text-xs text-gray-600 mt-1">
                {new Date(d.fechaDevolucion).toLocaleString()} ·{" "}
                <span className="font-semibold text-green-700">
                  ${d.montoDevuelto} MXN
                </span>{" "}
                · {d.tipoDevolucion}
              </p>

              {/* Producto */}
              <p className="text-xs text-gray-700 mt-2">
                <span className="font-medium">{d.productName}</span> ·{" "}
                {d.cantidadDevuelta} u · {d.codigoBarras}
              </p>

              {/* Usuario */}
              <p className="text-xs text-gray-600 mt-1">
                {d.username} · {d.branchName}
              </p>
            </div>
          ))}

          {/* ---------- PAGINACIÓN ---------- */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center pt-3">

            <button
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
              className="
                w-full sm:w-auto
                px-4 py-3
                border rounded-lg
                disabled:opacity-50
              "
            >
              ← Anterior
            </button>

            <p className="text-xs text-gray-600">
              Página <b>{pageIndex + 1}</b> de {totalPages}
            </p>

            <button
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              className="
                w-full sm:w-auto
                px-4 py-3
                border rounded-lg
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
