"use client";

import type { DevolucionVenta } from "../../devolucion-ventas/types/DevolucionVenta";

interface Props {
  devolucion: DevolucionVenta;
  onClose: () => void;
}

export default function DevolucionVentaResultModal({ devolucion, onClose }: Props) {
  const fecha = new Date(devolucion.fechaDevolucion).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-4">✔ Devolución registrada</h2>

        <p><b>ID:</b> {devolucion.id}</p>
        <p><b>Tipo:</b> {devolucion.tipoDevolucion}</p>
        <p>
          <b>Total devuelto:</b> ${Number(devolucion.totalDevuelto).toFixed(2)}
        </p>
        <p><b>Fecha:</b> {fecha}</p>

        <div className="text-center mt-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
