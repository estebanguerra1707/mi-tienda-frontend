import { createPortal } from "react-dom";
import type { CompraItem, DetalleCompraResponseDTO } from "@/features/compras/api";
import { useAuth } from "@/hooks/useAuth";
import { printTicketUniversal } from "@/lib/printTicket";

interface CompraDetalleModalProps {
  compra: CompraItem;
  onClose: () => void;
onSelectDetalle?: (d: DetalleCompraResponseDTO) => void;
}

export default function CompraDetalleModal({ compra, onClose }: CompraDetalleModalProps) {
      const { user } = useAuth()
      const isSuperAdmin = user?.role === "SUPER_ADMIN";
  if (!compra) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-[95%] max-w-3xl p-4 sm:p-6 shadow-xl 
                          max-h-[85vh] overflow-y-auto">

        <h2 className="text-xl font-semibold mb-4 text-center">
          DETALLE DE COMPRA #{compra.id}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
          <p><strong>Proveedor:</strong> {compra.providerName}</p>
        <p>
            <strong>Fecha:</strong>{" "}
            {isSuperAdmin
                ? new Date(compra.purchaseDate).toLocaleString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                })
                : new Date(compra.purchaseDate).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })}
        </p>
          <p><strong>Método pago:</strong> {compra.paymentName}</p>
          <p><strong>Atendido por:</strong> {compra.userName}</p>
        </div>

        <h3 className="text-lg font-semibold mb-2">Productos</h3>
       <div className="overflow-x-auto">
            <table className="w-full border text-sm">
            <thead className="bg-gray-100">
                <tr>
                <th className="border px-2 py-1 text-left">Producto</th>
                <th className="border px-2 py-1 text-center">Cantidad</th>
                <th className="border px-2 py-1 text-center">Precio unitario</th>
                </tr>
            </thead>
            <tbody>
                {compra.details.map((d: DetalleCompraResponseDTO, i: number) => (
                <tr key={i}>
                    <td className="border px-2 py-1">{d.productName}</td>
                    <td className="border px-2 py-1 text-center">{d.quantity}</td>
                    <td className="border px-2 py-1 text-center">
                    ${d.unitPrice.toFixed(2)}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
       
           <div className="mt-4 text-right text-sm pr-1">
                <p className="text-lg font-semibold">
                    Total: ${compra.totalAmount.toFixed(2)}
                </p>
                <p className="mt-1 text-xs italic tracking-tight leading-tight">
                    {compra.amountInWords}
                </p>
                {compra.paymentName === "EFECTIVO" && (
                    <>
                    <p>Total pagado: ${compra.amountPaid.toFixed(2)}</p>
                    <p>Cambio: ${compra.changeAmount.toFixed(2)}</p>
                    </>
                )}
               
            </div>

       <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => printTicketUniversal(compra.id, "compra")}
            className="px-4 py-2 rounded bg-green-600 text-white"
        >
          🖨️ Reimprimir ticket
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Cerrar
        </button>

      </div>

      </div>
    </div>,
    document.body
  );
}
