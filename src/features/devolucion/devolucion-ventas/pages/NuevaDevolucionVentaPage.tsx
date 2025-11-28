"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
} from "react";

import BuscadorAvanzadoVentas, {
  BuscadorAvanzadoVentasHandle,
} from "../components/BuscadorAvanzadoVentas";

import DetalleVentaCard from "../components/DetalleVentaCards";
import DetalleProductoVentaModal from "../components/DetalleProductoVentaModal";
import DevolucionVentaResultModal from "../../devolucion-compras/pages/DevolucionVentaResultModal";

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

  useImperativeHandle(ref, () => ({
    limpiar() {
      setVenta(null);
      setDetalle(null);
      setResultado(null);
      buscadorRef.current?.limpiar?.();
    },
  }));

  return (
    <div className="p-6 space-y-6">
      <BuscadorAvanzadoVentas
        ref={buscadorRef}
        onSelect={(v) => {
          setVenta(v);
          setDetalle(null);
        }}
      />

      {!venta && <p className="text-gray-400">Sin búsqueda</p>}

      {venta && (
        <>
          <DetalleVentaCard venta={venta} onSelectDetalle={setDetalle} />

          <DetalleProductoVentaModal
            venta={venta}
            details={detalle}
            onClose={() => setDetalle(null)}
            onSuccess={(resp) => {
              setResultado(resp);
              setDetalle(null);
            }}
          />
        </>
      )}

      {resultado && (
        <DevolucionVentaResultModal
          devolucion={resultado}
          onClose={() =>
            ref && typeof ref !== "function" && ref.current?.limpiar()
          }
        />
      )}
    </div>
  );
}

export default forwardRef(NuevaDevolucionVentaPageInner);
