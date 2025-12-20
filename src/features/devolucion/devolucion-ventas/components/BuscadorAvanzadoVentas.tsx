"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
} from "react";

import { useSearchVentasPaginadas } from "@/hooks/useVentas";
import type { VentaItem, VentaSearchFiltro } from "@/hooks/useVentas";

import AdvancedFiltersVentas from "@/features/ventas/components/AdvancedFiltersVentas";

export interface BuscadorAvanzadoVentasHandle {
  limpiar: () => void;
}

export interface Props {
  onSelect: (venta: VentaItem) => void;
  selectedId?: number;
}

const BuscadorAvanzadoVentas = forwardRef<
  BuscadorAvanzadoVentasHandle,
  Props
>(({ onSelect, selectedId }, ref: ForwardedRef<BuscadorAvanzadoVentasHandle>) => {

  const [filtros, setFiltros] = useState<VentaSearchFiltro>({});
  const [buscado, setBuscado] = useState(false);

  const { data } = useSearchVentasPaginadas(
    { ...filtros, page: 0, size: 20 },
    { enabled: buscado }
  );

  useImperativeHandle(ref, () => ({
    limpiar() {
      setFiltros({});
      setBuscado(false);
    },
  }));

  const aplicarFiltros = (next: VentaSearchFiltro) => {
    const isClear = Object.keys(next).length === 0;

    if (isClear) {
      setFiltros({});
      setBuscado(false);
      return;
    }

    setFiltros(next);
    setBuscado(true);
  };

  const ventas = data?.content ?? [];

  return (
    <div className="space-y-4">

      {/* FILTROS */}
      <AdvancedFiltersVentas onApply={aplicarFiltros} showId={true} />

      {/* SIN RESULTADOS */}
      {buscado && ventas.length === 0 && (
        <p className="text-sm text-gray-500">
          No se encontraron resultados.
        </p>
      )}

      {/* LISTA MOBILE-FIRST */}
      {buscado && ventas.length > 0 && (
        <div className="space-y-2">
          {ventas.map((v) => {
            const selected = selectedId === v.id;

            return (
              <button
                key={v.id}
                onClick={() => onSelect(v)}
                className={`
                  w-full flex justify-between items-center
                  px-3 py-3
                  rounded-lg border
                  text-left transition
                  ${selected
                    ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300"
                    : "border-gray-200 hover:bg-blue-50 active:bg-blue-100"}
                `}
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-800">
                    Venta #{v.id}
                  </p>

                  <p className="text-xs text-gray-600">
                    {new Date(v.saleDate).toLocaleString()} · ${v.amountPaid} MXN
                  </p>

                  <p className="text-xs text-gray-600">
                    {v.clientName} · {v.paymentMethodName}
                  </p>
                </div>

                {/* INDICADOR TÁCTIL */}
                <span className="text-blue-600 text-lg leading-none">
                  ›
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default BuscadorAvanzadoVentas;
