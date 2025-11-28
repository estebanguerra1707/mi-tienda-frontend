"use client";

import { Devolucion } from "../types/Devolucion";

interface Props {
  devolucion: Devolucion;
  onClose: () => void;
}

export default function DevolucionResultModal({ devolucion, onClose }: Props) {
    const fechaFormateada = new Date(devolucion.fechaDevolucion).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
    });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50 animate-fadeIn">
      
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-slideUp">
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          ✔ Devolución registrada
        </h2>

        <div className="space-y-2 text-gray-700 text-sm">
          <p><b>ID de devolución:</b> {devolucion.id}</p>
          <p><b>Tipo:</b> {devolucion.tipoDevolucion}</p>
          <p><b>Monto devuelto:</b> ${Number(devolucion.totalDevolucion).toFixed(2)}</p>
          <p>
            <b>Fecha:</b> {fechaFormateada}
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
