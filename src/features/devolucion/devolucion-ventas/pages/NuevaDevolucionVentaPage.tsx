"use client";
 {/* Crear devolucion sobre ventas */}
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  useEffect, 
} from "react";

import BuscadorAvanzadoVentas, {
  BuscadorAvanzadoVentasHandle,
} from "../components/BuscadorAvanzadoVentas";

import DetalleVentaCard from "../components/DetalleVentaCards";
import DetalleProductoVentaModal from "../components/DetalleProductoVentaModal";
import DevolucionVentaResultModal from "../components/DevolucionVentaResultModal";

import type {
  DetalleVentaResponseDTO,
  DevolucionVenta,
} from "../types/DevolucionVenta";
import type { VentaItem } from "@/hooks/useVentas";

export interface NuevaDevolucionVentaPageHandle {
  limpiar: () => void;
}

function NuevaDevolucionVentaPageInner(
  _props: unknown,
  ref: ForwardedRef<NuevaDevolucionVentaPageHandle>
) {
  const [venta, setVenta] = useState<VentaItem | null>(null);
  const [detalle, setDetalle] = useState<DetalleVentaResponseDTO | null>(null);
  const [resultado, setResultado] = useState<DevolucionVenta | null>(null);

  const buscadorRef = useRef<BuscadorAvanzadoVentasHandle>(null);
  const detalleVentaRef = useRef<HTMLDivElement | null>(null);

  const limpiarTodo = () => {
  setVenta(null);
  setDetalle(null);
  setResultado(null);
  buscadorRef.current?.limpiar?.();
};

useImperativeHandle(ref, () => ({
  limpiar: limpiarTodo,
}));

  useEffect(() => {
  if (venta && detalleVentaRef.current) {
    const t = setTimeout(() => {
      detalleVentaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => clearTimeout(t);
  }
}, [venta]);
  return (
    <div
      className="
        w-full 
        max-w-5xl 
        mx-auto 
        px-4 sm:px-6 
        py-4 sm:py-6 
        space-y-6
      "
    >
      <div className="bg-white rounded-xl shadow-md border p-4 sm:p-6">
        <BuscadorAvanzadoVentas
          ref={buscadorRef}
          selectedId={venta?.id}
          onSelect={(v) => {
            setVenta(v);
            setDetalle(null);
          }}
          onClearAll={limpiarTodo}
        />
      </div>

      {!venta && (
        <div className="text-gray-400 text-center py-6 text-sm sm:text-base">
          Sin búsqueda
        </div>
      )}

      {venta && (
        <div className="space-y-4">
          <div
            ref={detalleVentaRef}
          className="bg-white rounded-xl shadow border p-4 sm:p-6 animate-fadeIn"
          >
            <DetalleVentaCard
              venta={venta}
              onSelectDetalle={setDetalle}
            />
          </div>

          <DetalleProductoVentaModal
            venta={venta}
            details={detalle}
            onClose={() => setDetalle(null)}
            onSuccess={(resp) => {
              setResultado(resp);
              setDetalle(null);
            }}
          />
        </div>
      )}
     {resultado && (
        <DevolucionVentaResultModal
          devolucion={resultado}
          onClose={limpiarTodo}
        />
      )}
    </div>
  );
}

export default forwardRef(NuevaDevolucionVentaPageInner);
