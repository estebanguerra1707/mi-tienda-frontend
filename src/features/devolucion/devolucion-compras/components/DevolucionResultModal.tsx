"use client";

import { useEffect } from "react";
import { Devolucion } from "../types/Devolucion";

interface Props {
  devolucion: Devolucion;
  onClose: () => void;
}

export default function DevolucionResultModal({
  devolucion,
  onClose,
}: Props) {
  const fechaFormateada = new Date(devolucion.fechaDevolucion).toLocaleString(
    "es-MX",
    { dateStyle: "medium", timeStyle: "short" }
  );

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/40 backdrop-blur-sm
        flex items-end sm:items-center justify-center
      "
      onClick={onClose} // click fuera cierra
    >
      {/* CONTENEDOR */}
      <div
        onClick={(e) => e.stopPropagation()} // evita cerrar al click interno
        className="
          bg-white w-full sm:max-w-md
          rounded-t-2xl sm:rounded-2xl
          px-5 py-6
          shadow-xl
          animate-slideUp
          max-h-[90vh] overflow-y-auto
        "
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg sm:text-xl font-semibold">
            Devolución registrada
          </h2>
        </div>

        {/* INFO */}
        <div className="mt-5 space-y-1 text-sm sm:text-base text-gray-700">
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
              w-full py-3 rounded-xl
              bg-blue-600 text-white
              hover:bg-blue-700 active:bg-blue-800
              transition font-medium
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
