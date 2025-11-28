"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import AdvancedFiltersDevolucionCompras from "@/features/devolucion/AdvancedFilterDevolucionesCompras";
import {
  DevolucionComprasFiltro,
} from "@/hooks/types/devolucionesCompras";
import { useSearchDevolucionesCompras } from "@/hooks/useSearchDevolucionesCompras";
import { useQueryClient } from "@tanstack/react-query";

export interface BuscadorDevolucionesComprasHandle {
  limpiar: () => void;
}


const PAGE_SIZE = 5;

const BuscadorDevolucionesCompras = forwardRef<
  BuscadorDevolucionesComprasHandle
>((props, ref) => {
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

      {buscado && isFetching && (
        <p className="text-sm text-gray-500 animate-pulse">
          Buscando devoluciones...
        </p>
      )}

      {buscado && !isFetching && devoluciones.length === 0 && (
        <p className="text-sm text-gray-500">
          No se encontraron devoluciones de compras.
        </p>
      )}

      {pageItems.length > 0 && (
        <div className="space-y-4 w-full max-w-7xl mx-auto">

          {pageItems.map((d) => (
            <div
              key={d.id}
              className="
                w-full text-left 
                p-5 
                rounded-xl 
                border border-gray-200 
                bg-blue-50/30
                transition-all
              "
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-semibold text-gray-800">
                  Devolución #{d.id}
                </p>
                <p className="text-sm text-blue-700 font-medium flex items-center gap-1">
                  Compra #{d.compraId}
                </p>
              </div>

              <div className="text-sm text-gray-700 flex items-center gap-2 mb-2">
                {new Date(d.fechaDevolucion).toLocaleString()}
                <span className="mx-2 text-gray-400">•</span>
                <span className="font-semibold text-green-700">
                  ${d.montoDevuelto} MXN
                </span>
                <span className="text-gray-500">({d.tipoDevolucion})</span>
              </div>

              <hr className="my-3 border-gray-200" />

              <p className="text-sm text-gray-700 font-medium mb-1">
                Producto: {d.productName}
              </p>

              <p className="text-sm text-gray-600">
                Código: {d.codigoBarras} — Cantidad devuelta:
                <span className="font-bold"> {d.cantidadDevuelta}</span>
              </p>

              <p className="text-sm text-gray-700 mt-3">
                Usuario: {d.username} • Sucursal:
                <span className="font-medium"> {d.branchName}</span>
              </p>
            </div>
          ))}

          {/* PAGINADOR */}
          <div className="flex justify-between items-center pt-4">
            <button
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
              className={`px-4 py-2 border rounded-md ${
                pageIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              ← Anterior
            </button>

            <p className="text-sm text-gray-700">
              Página <span className="font-semibold">{pageIndex + 1}</span> de{" "}
              {totalPages}
            </p>

            <button
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              className={`px-4 py-2 border rounded-md ${
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

export default BuscadorDevolucionesCompras;
