"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { ConfirmarVentaModalProps, ProductoResumen } from "@/types/catalogs";


function formatQty(qty: number): string {
  if (!Number.isFinite(qty)) return "0";
  // si es entero -> "2", si no -> "2.50"
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
}


function formatCantidadConUnidad(p: ProductoResumen): string {
  const qty = Number.isFinite(p.quantity) ? p.quantity : 0;

  const unit =
    (p.unitAbbr ?? "").trim() ||
    (p.unitName ?? "").trim() ||
    "";

  const qtyStr = formatQty(qty);
  return unit ? `${qtyStr} ${unit}` : qtyStr;
}


export default function ConfirmarVentaModal({
  open,
  onClose,
  onConfirm,
  resumen,
  isLoading,
}: ConfirmarVentaModalProps) {
  if (!resumen) return null;

  const { cliente, metodoPago, productos, total, pago, cambio, sucursal } =
    resumen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Confirmar venta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm sm:text-base p-1">
          <div>
            <p className="font-semibold">Cliente:</p>
            <p>{cliente}</p>
          </div>

          <div>
            <p className="font-semibold">Sucursal:</p>
            <p>{sucursal}</p>
          </div>

          <div>
            <p className="font-semibold">Método de pago:</p>
            <p>{metodoPago}</p>
          </div>

          <div>
            <p className="font-semibold mb-1">Productos:</p>

            {/* Scroll SOLO en la lista de productos si son muchos */}
            <ul className="ml-4 list-disc text-sm max-h-40 overflow-y-auto pr-2 sm:max-h-48">
              {productos.map((p: ProductoResumen, i: number) => (
                <li key={`${p.name}-${i}`}>
                  {p.name} — {formatCantidadConUnidad(p)} x $
                  {p.price.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>

          <div className="font-semibold text-base">Total: ${total.toFixed(2)}</div>

          {metodoPago === "EFECTIVO" && (
            <>
              <p>
                Pago recibido: <strong>${pago.toFixed(2)}</strong>
              </p>
              <p>
                Cambio: <strong>${cambio.toFixed(2)}</strong>
              </p>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              className="bg-blue-600 text-white"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Generando venta..." : "Confirmar y generar venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
