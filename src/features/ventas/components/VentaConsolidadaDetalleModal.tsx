"use client";

import { createPortal } from "react-dom";
import type { VentaConsolidadaResponse } from "@/features/ventas/api";
import { printTicketUniversal } from "@/lib/printTicket";

interface Props {
  detalle: VentaConsolidadaResponse;
  onClose: () => void;
  onGenerarVenta?: () => void;
  isGenerating?: boolean;
}

export default function VentaConsolidadaDetalleModal({
  detalle,
  onClose,
  onGenerarVenta,
  isGenerating = false,
}: Props) {
  if (!detalle) return null;

  const formatMoney = (n?: number | null) => `$${Number(n ?? 0).toFixed(2)}`;

  const formatDate = (iso?: string) => {
    if (!iso) return "—";

    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getUM = (unitAbbr?: string | null) => {
    const u = (unitAbbr ?? "").trim();
    return u || "—";
  };

  const handleGenerarOReimprimir = () => {
  if (detalle.weeklyTicketId) {
    printTicketUniversal(detalle.weeklyTicketId, "venta-consolidada");
    return;
  }

  onGenerarVenta?.();
};

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div
        className="
          bg-white rounded-xl w-[95%] max-w-4xl p-4 sm:p-6 shadow-xl
          max-h-[85vh] overflow-y-auto
        "
      >
        <h2 className="text-xl font-semibold mb-4 text-center">
          DETALLE SEMANAL CONSOLIDADO
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
          <p>
            <strong>Cliente:</strong> {detalle.clientName}
          </p>

          <p>
            <strong>Vendido por:</strong> {detalle.userName ?? "—"}
          </p>

          <p>
            <strong>Periodo:</strong>{" "}
            {formatDate(detalle.startDate)} - {formatDate(detalle.endDate)}
          </p>

          <p>
            <strong>Fecha generación:</strong>{" "}
            {new Date(detalle.generatedAt).toLocaleString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </p>

          <p>
            <strong>Ventas incluidas:</strong>{" "}
            {detalle.ventaIds.map((id) => `#${id}`).join(", ")}
          </p>

          <p>
            <strong>Total de ventas:</strong> {detalle.totalVentas}
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-2">Productos consolidados</h3>

        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">Producto</th>
                <th className="border px-2 py-1 text-center">Cantidad</th>
                <th className="border px-2 py-1 text-center">Unidad</th>
                <th className="border px-2 py-1 text-center">Precio unitario</th>
                <th className="border px-2 py-1 text-center">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {detalle.productos?.length ? (
                detalle.productos.map((p, index) => (
                  <tr key={`${p.productId ?? "producto"}-${index}`}>
                    <td className="border px-2 py-1">{p.productName}</td>
                    <td className="border px-2 py-1 text-center">
                      {String(p.quantity ?? "")}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {getUM(p.unitAbbr)}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {formatMoney(p.unitPrice)}
                    </td>
                    <td className="border px-2 py-1 text-center font-semibold">
                      {formatMoney(p.subTotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-3 text-gray-500">
                    Sin productos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right text-sm pr-1">
          <p className="text-lg font-semibold">
            Total consolidado: {formatMoney(detalle.totalAmount)}
          </p>

          <p className="mt-1 text-xs italic tracking-tight leading-tight">
            {detalle.amountInWords}
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={handleGenerarOReimprimir}
            disabled={isGenerating}
            className="
                px-4 py-2 rounded bg-green-600 text-white font-semibold
                hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
            "
            >
            {isGenerating
                ? "Generando..."
                : detalle.weeklyTicketId
                ? "🖨 Reimprimir ticket"
                : "Generar ticket"}
            </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}