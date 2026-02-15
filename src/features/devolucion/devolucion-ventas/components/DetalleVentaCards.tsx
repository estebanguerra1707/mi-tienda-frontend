"use client";
  {/* Pagina resultado de dar clic en una venta para devolver */}

import type { DetalleVentaResponseDTO } from "../types/DevolucionVenta";
import type { VentaItem } from "@/hooks/useVentas";
import { mapVentaDetalleToDTO } from "@/utils/mappers/ventaMapper";

interface Props {
  venta: VentaItem;
  onSelectDetalle: (d: DetalleVentaResponseDTO) => void;
}

export default function DetalleVentaCard({
  venta,
  onSelectDetalle,
}: Props) {
  return (
    <div className="space-y-3">

      {/* HEADER SIMPLE */}
      <h2 className="text-base font-semibold">
        Productos · Venta #{venta.id}
      </h2>

      {/* LISTA MOBILE-FIRST */}
      <div className="space-y-2">
        {venta.details?.map((d) => (
          <button
           key={d.id ?? `${d.productId}-${d.codigoBarras}-${d.unitPrice}`}
            onClick={() => onSelectDetalle(mapVentaDetalleToDTO(d))}
            className="
              w-full flex justify-between items-center
              px-3 py-3
              border rounded-lg
              text-left
              active:bg-blue-100 hover:bg-blue-50
              transition
            "
          >
            <div className="space-y-0.5">
              <p className="font-medium text-gray-800">
                {d.productName}
              </p>

             <p className="text-xs text-gray-600">
              Cantidad: {d.quantity} {d.unitAbbr ?? d.unitName ?? ""} · ${d.unitPrice.toFixed(2)}
            </p>
            </div>

            {/* INDICADOR */}
            <span className="text-blue-600 text-lg leading-none">
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
