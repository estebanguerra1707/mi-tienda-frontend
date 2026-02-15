"use client";
   {/*  Pagina resultado de buscar*boton en busqueda avanzada */}
import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  ForwardedRef,
} from "react";
import { fetchVentaById, getVentaDetails } from "@/features/ventas/api";
import { useSearchVentasPaginadas } from "@/hooks/useVentas";

import type { VentaItem, VentaSearchFiltro } from "@/hooks/useVentas";

import AdvancedFiltersVentas from "@/features/ventas/components/AdvancedFiltersVentas";

export interface BuscadorAvanzadoVentasHandle {
  limpiar: () => void;
}

export interface Props {
  onSelect: (venta: VentaItem) => void;
  selectedId?: number;
   onClearAll?: () => void; 
}

const BuscadorAvanzadoVentas = forwardRef<
  BuscadorAvanzadoVentasHandle,
  Props
>(({ onSelect, selectedId, onClearAll }, ref: ForwardedRef<BuscadorAvanzadoVentasHandle>) => {

  const [filtros, setFiltros] = useState<VentaSearchFiltro>({});
  const [buscado, setBuscado] = useState(false);
  const [ventaById, setVentaById] = useState<VentaItem | null>(null);
  const [loadingById, setLoadingById] = useState(false);
  const [errorById, setErrorById] = useState<string | null>(null);

  const [loadingDetalleId, setLoadingDetalleId] = useState<number | null>(null);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const folioId = filtros.id != null && filtros.id !== "" ? Number(filtros.id) : null;
  const buscandoPorId = buscado && folioId != null && !Number.isNaN(folioId);

const tieneId = filtros.id != null && String(filtros.id).trim() !== "";
const { data } = useSearchVentasPaginadas(
  { ...filtros, page: 0, size: 20 },
  { enabled: buscado && !tieneId }
);

const clearLocal = () => {
  setFiltros({});
  setBuscado(false);

  setVentaById(null);
  setLoadingById(false);
  setErrorById(null);

  setLoadingDetalleId(null);
  setErrorDetalle(null);
};

useImperativeHandle(ref, () => ({
  limpiar() {
    clearLocal();
  },
}));

  useEffect(() => {
    let cancelled = false;

    async function loadVentaById() {
      if (!buscandoPorId || folioId == null) return;

      setLoadingById(true);
      setErrorById(null);
      setVentaById(null);

      try {
        const v = await fetchVentaById(folioId);
        if (!cancelled) setVentaById(v);
      } catch (e) {
        console.warn(e);
        if (!cancelled) setErrorById("No se encontró la venta o no se pudo cargar.");
      } finally {
        if (!cancelled) setLoadingById(false);
      }
    }

    loadVentaById();
    return () => {
      cancelled = true;
    };
  }, [buscandoPorId, folioId]);

  const aplicarFiltros = (next: VentaSearchFiltro) => {
    const isClear = Object.keys(next).length === 0;

    if (isClear) {
      setFiltros({});
      setBuscado(false);
      return;
    }

    setFiltros(next);
    setVentaById(null);
    setErrorById(null);
    setBuscado(true);
  };

  const ventas = buscandoPorId
  ? (ventaById ? [ventaById] : [])
  : (data?.content ?? []);

const handleSelectVenta = async (v: VentaItem) => {
  setErrorDetalle(null);
  setLoadingDetalleId(v.id);

  try {
    const details = await getVentaDetails(v.id); // ✅ /ventas/{id}/detail
    onSelect({ ...v, details: details ?? [] });  // ✅ ahora ya trae details
  } catch (e) {
    console.warn(e);
    setErrorDetalle("No se pudo cargar el detalle de la venta.");
    onSelect({ ...v, details: [] }); // para no romper UI
  } finally {
    setLoadingDetalleId(null);
  }
};
  
  return (
    <div className="space-y-4">

      {/* FILTROS */}
      <AdvancedFiltersVentas 
        onApply={aplicarFiltros} 
        showId={true} 
        onClear={() => {
          clearLocal();
          onClearAll?.();
        }}
        />

      {/* SIN RESULTADOS */}
    {buscado && (
      <>
        {buscandoPorId && loadingById && (
          <p className="text-sm text-gray-500">Cargando venta...</p>
        )}

        {buscandoPorId && !loadingById && errorById && (
          <p className="text-sm text-red-600">{errorById}</p>
        )}

        {!buscandoPorId && ventas.length === 0 && (
          <p className="text-sm text-gray-500">No se encontraron resultados.</p>
        )}

        {buscandoPorId && !loadingById && !errorById && ventas.length === 0 && (
          <p className="text-sm text-gray-500">No se encontró la venta.</p>
        )}
      </>
    )}
      {/* LISTA MOBILE-FIRST */}
      {buscado && ventas.length > 0 && (
        <div className="space-y-2">
          {ventas.map((v) => {
            const selected = selectedId === v.id;

            return (
              <button
                key={v.id}
                onClick={() => handleSelectVenta(v)}
                disabled={loadingDetalleId === v.id}
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
                {errorDetalle && (
                    <p className="text-sm text-red-600">{errorDetalle}</p>
                  )}
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
                  <p className="text-xs text-gray-600">
                    Usuario: {v.userName}
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
