import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { type VentaItem, type VentaDetalleItem, getVentaDetails } from "@/features/ventas/api";
import { useAuth } from "@/hooks/useAuth";
import { printTicketUniversal } from "@/lib/printTicket";
interface VentaDetalleModalProps {
  venta: VentaItem;
  onClose: () => void;
}

export default function VentaDetalleModal({ venta, onClose }: VentaDetalleModalProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [details, setDetails] = useState<VentaDetalleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!venta?.id) {
        setLoading(false);
        setDetails([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getVentaDetails(venta.id);
        if (!cancelled) setDetails(data ?? []);
      } catch (e) {
        console.warn(e);
        if (!cancelled) {
          setError("No se pudo cargar el detalle de la venta.");
          setLoading(true);
          setError(null);
          setDetails([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [venta?.id]);

  if (!venta) return null;
  
  const getUM = (d: VentaDetalleItem): string => {
    const u = (d.unitAbbr ?? d.unitName ?? "").trim();
    return u || "—";
  };


  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-[95%] max-w-3xl p-4 sm:p-6 shadow-xl 
                      max-h-[85vh] overflow-y-auto">
 
        <h2 className="text-xl font-semibold mb-4 text-center">
          DETALLE DE VENTA #{venta.id}
        </h2>

        {/* Datos principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
          <p><strong>Cliente:</strong> {venta.clientName}</p>

          <p>
            <strong>Fecha:</strong>{" "}
            {isSuperAdmin
              ? new Date(venta.saleDate).toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
              : new Date(venta.saleDate).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
          </p>

          <p><strong>Método pago:</strong> {venta.paymentMethodName}</p>
          <p><strong>Atendido por:</strong> {venta.userName}</p>
        </div>

        {/* Productos */}
        <h3 className="text-lg font-semibold mb-2">Productos</h3>

        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">Producto</th>
                <th className="border px-2 py-1 text-center">Cantidad</th>
                <th className="border px-2 py-1 text-center">Unidad de Medida</th>
                <th className="border px-2 py-1 text-center">Precio unitario</th>
              </tr>
            </thead>

            <tbody>
             {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-gray-500">
                      Cargando productos...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : details.length ? (
                  details.map((d: VentaDetalleItem, i: number) => (
                    <tr key={`${d.productId}-${i}`}>
                      <td className="border px-2 py-1">{d.productName}</td>
                      <td className="border px-2 py-1 text-center">{String(d.quantity ?? "")}</td>
                      <td className="border px-2 py-1 text-center">{getUM(d)}</td>
                      <td className="border px-2 py-1 text-center">
                        ${Number(d.unitPrice ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-gray-500">
                      Sin productos para mostrar.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mt-4 text-right text-sm pr-1">
          <p className="text-lg font-semibold">
            Total: ${Number(venta.totalAmount ?? 0).toFixed(2)}
          </p>

          <p className="mt-1 text-xs italic tracking-tight leading-tight">
            {venta.amountInWords}
          </p>

          {venta.paymentMethodName === "EFECTIVO" && (
            <>
              <p>Total pagado:${Number(venta.amountPaid ?? 0).toFixed(2)}</p>
              <p>Cambio: ${Number(venta.changeAmount ?? 0).toFixed(2)}</p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => printTicketUniversal(venta.id, "venta")}
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
