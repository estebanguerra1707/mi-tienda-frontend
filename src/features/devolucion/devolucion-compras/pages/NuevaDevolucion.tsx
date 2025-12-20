"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  useEffect, 
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
  const detalleCompraRef = useRef<HTMLDivElement | null>(null);


  useImperativeHandle(ref, () => ({
    limpiar() {
      setResultado(null);
      setCompraCompleta(null);
      setDetalle(null);
      buscadorRef.current?.limpiar?.();
    },
  }));

  useEffect(() => {
    if (compraCompleta && detalleCompraRef.current) {
      setTimeout(() => {
        detalleCompraRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [compraCompleta]);

  return (
    <div className="
      p-4 sm:p-6 
      space-y-6 
      max-w-5xl mx-auto 
      w-full
    ">

      <div className="bg-white shadow-md rounded-xl border p-4 sm:p-6">
        <BuscadorAvanzadoCompras
          ref={buscadorRef}
          selectedId={compraCompleta?.id}
          onSelect={(compra) => {
            setCompraCompleta(compra);
            setDetalle(null);
          }}
        />
      </div>

      {!compraCompleta && (
        <div className="text-gray-400 text-center py-6 text-sm sm:text-base">
          Sin búsqueda
        </div>
      )}

      {compraCompleta && (
        <div className="space-y-4">
          <div ref={detalleCompraRef} className="bg-white rounded-xl shadow border p-4 sm:p-6">
            <DetalleCompraCard
              compra={compraCompleta}
              onSelectDetalle={setDetalle}
            />
          </div>

          <DetalleProductoModal
            compra={compraCompleta}
            detalle={detalle}
            onClose={() => setDetalle(null)}
            onSuccess={(resp) => {
              setResultado(resp);
              setDetalle(null);
            }}
          />
        </div>
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
