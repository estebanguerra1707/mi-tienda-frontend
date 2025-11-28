"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
} from "react";

import type {
  CompraItem,
  DetalleCompraResponseDTO,
} from "@/features/compras/api";

import BuscadorAvanzadoCompras, {
  BuscadorAvanzadoComprasHandle,
} from "../components/BuscadorAvanzadoCompras";

import DevolucionResultModal from "../components/DevolucionResultModal";
import type { Devolucion } from "../types/Devolucion";
import DetalleProductoModal from "../components/DetalleProductoModal";
import DetalleCompraCard from "../components/DetalleCompraCard";

export interface NuevaDevolucionPageHandle {
  limpiar: () => void;
}

function NuevaDevolucionPageInner(
  _props: unknown,
  ref: ForwardedRef<NuevaDevolucionPageHandle>
) {
  const [compraCompleta, setCompraCompleta] = useState<CompraItem | null>(null);
  const [detalle, setDetalle] = useState<DetalleCompraResponseDTO | null>(null);
  const [resultado, setResultado] = useState<Devolucion | null>(null);

  const buscadorRef = useRef<BuscadorAvanzadoComprasHandle>(null);

  useImperativeHandle(ref, () => ({
    limpiar() {
      setResultado(null);
      setCompraCompleta(null);
      setDetalle(null);
      buscadorRef.current?.limpiar?.();
    },
  }));

  return (
    <div className="p-6 space-y-6">
      <BuscadorAvanzadoCompras
        ref={buscadorRef}
        onSelect={(compra) => {
          setCompraCompleta(compra);
          setDetalle(null);
        }}
      />

      {!compraCompleta && (
        <div className="text-gray-400 mt-4">Sin búsqueda</div>
      )}

      {compraCompleta && (
        <>
          <DetalleCompraCard
            compra={compraCompleta}
            onSelectDetalle={setDetalle}
          />

          <DetalleProductoModal
            compra={compraCompleta}
            detalle={detalle}
            onClose={() => setDetalle(null)}
            onSuccess={(resp) => {
              setResultado(resp);
              setDetalle(null);
            }}
          />
        </>
      )}

      {resultado && (
        <DevolucionResultModal
          devolucion={resultado}
          onClose={() => buscadorRef.current?.limpiar()}
        />
      )}
    </div>
  );
}

export default forwardRef(NuevaDevolucionPageInner);
