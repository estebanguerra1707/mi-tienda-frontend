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
}

const BuscadorAvanzadoVentas = forwardRef<
  BuscadorAvanzadoVentasHandle,
  Props
>(({ onSelect }, ref: ForwardedRef<BuscadorAvanzadoVentasHandle>) => {

  // 🔹 filtros completos (incluye ID)
  const [filtros, setFiltros] = useState<VentaSearchFiltro>({});
  const [buscado, setBuscado] = useState(false);

  const { data } = useSearchVentasPaginadas(
    { ...filtros, page: 0, size: 20 },
    { enabled: buscado }
  );

  // 🔹 método limpiar()
  useImperativeHandle(ref, () => ({
    limpiar() {
      setFiltros({});
      setBuscado(false);
    },
  }));

  const aplicarFiltros = (next: VentaSearchFiltro) => {
    // 👉 Si viene vacío, es un "Limpiar", no un "Buscar"
    const isClear = Object.keys(next).length === 0;

    if (isClear) {
      setFiltros({});
      setBuscado(false);   // ⬅️ Ocultamos resultados
      return;              // ⬅️ No llamamos a la API
    }

    // 👉 Aquí sí es un "Buscar"
    setFiltros(next);
    setBuscado(true);
  };

  const ventas = data?.content ?? [];

  return (
    <div className="space-y-6">

      {/* SOLO FILTROS AVANZADOS – SIN BÚSQUEDA SIMPLE */}
     <AdvancedFiltersVentas onApply={aplicarFiltros} showId={true} />

      {/* Resultados */}
      {buscado && ventas.length === 0 && (
        <p className="text-gray-500 text-sm">No se encontraron resultados.</p>
      )}

      {buscado && ventas.length > 0 && (
        <div className="space-y-2">
          {ventas.map((v: VentaItem) => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className="w-full text-left p-4 border rounded-md hover:bg-blue-50"
            >
              <p className="font-semibold">Venta #{v.id}</p>

              <p className="text-sm text-gray-600">
                {new Date(v.saleDate).toLocaleString()} – ${v.amountPaid} MXN
              </p>

              <p className="text-sm text-gray-600">
                Cliente: {v.clientName}
              </p>

              <p className="text-sm text-gray-600">
                Pago: {v.paymentMethodName}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default BuscadorAvanzadoVentas;
