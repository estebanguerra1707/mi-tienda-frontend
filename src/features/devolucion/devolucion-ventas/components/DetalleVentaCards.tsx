"use client";

import type { DetalleVentaResponseDTO } from "../types/DevolucionVenta";
import type { VentaItem } from "@/hooks/useVentas";
import { mapVentaDetalleToDTO } from "@/utils/mappers/ventaMapper";

interface Props {
  venta: VentaItem;
  onSelectDetalle: (d: DetalleVentaResponseDTO) => void;
}

export default function DetalleVentaCard({ venta, onSelectDetalle }: Props) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Productos de la venta <span className="text-blue-600">#{venta.id}</span>
      </h2>

      <div className="grid gap-4">
        {venta.details?.map((d) => (
          <button
            key={d.productId}
            onClick={() => onSelectDetalle(mapVentaDetalleToDTO(d))}
            className="flex justify-between items-center p-4 rounded-lg border border-gray-200 shadow-sm 
              hover:bg-blue-50 hover:border-blue-400 transition duration-150 text-left"
          >
            <div>
              <p className="text-gray-700 font-medium text-lg">{d.productName}</p>

              <p className="text-sm text-gray-600">
                <b>Cantidad:</b> {d.quantity}
              </p>

              <p className="text-sm text-gray-600">
                <b>Precio:</b> ${d.unitPrice.toFixed(2)}
              </p>
            </div>

            <span className="text-blue-600 font-semibold">Ver detalle →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
