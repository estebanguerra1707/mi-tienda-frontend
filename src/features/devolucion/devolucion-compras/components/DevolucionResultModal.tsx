"use client";

import { Devolucion } from "../types/Devolucion";

interface Props {
  devolucion: Devolucion;
  onClose: () => void;
}

export default function DevolucionResultModal({
  devolucion,
  onClose,
}: Props) {
  const fechaFormateada = new Date(
    devolucion.fechaDevolucion
  ).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">

      {/* CONTENEDOR */}
      <div
        className="
          bg-white w-full sm:max-w-md
          rounded-t-2xl sm:rounded-2xl
          px-4 py-5
          animate-slideUp
        "
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="text-3xl">✅</div>
          <h2 className="text-lg font-semibold">
            Devolución registrada
          </h2>
        </div>

        {/* INFO */}
        <div className="mt-4 space-y-1 text-sm text-gray-700">
          <p><b>ID:</b> {devolucion.id}</p>
          <p><b>Tipo:</b> {devolucion.tipoDevolucion}</p>
          <p>
            <b>Monto devuelto:</b>{" "}
            ${Number(devolucion.totalDevolucion).toFixed(2)}
          </p>
          <p><b>Fecha:</b> {fechaFormateada}</p>
        </div>

        {/* BOTÓN */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="
              w-full py-3 rounded-lg
              bg-blue-600 text-white
              hover:bg-blue-700
              transition
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
