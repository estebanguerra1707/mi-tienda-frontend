"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import {
  ConfirmarVentaModalProps,
  ProductoResumen,
} from "@/types/catalogs";

export default function ConfirmarVentaModal({
  open,
  onClose,
  onConfirm,
  resumen,
  isLoading
}: ConfirmarVentaModalProps) {
  if (!resumen) return null;

  const {
    cliente,
    metodoPago,
    productos,
    total,
    pago,
    cambio,
    sucursal,
  } = resumen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Confirmar venta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
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
            <p className="font-semibold">Productos:</p>
            <ul className="ml-4 list-disc text-sm">
              {productos.map((p: ProductoResumen, i: number) => (
                <li key={i}>
                  {p.name} — {p.quantity} x ${p.price.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>

          <div className="font-semibold">
            Total: ${total.toFixed(2)}
          </div>

          {metodoPago === "EFECTIVO" && (
            <>
              <p className="text-sm">
                Pago recibido: <strong>${pago.toFixed(2)}</strong>
              </p>
              <p className="text-sm">
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
                disabled={isLoading}   // ← agregaremos este prop
                >
                {isLoading ? "Generando venta..." : "Confirmar y generar venta"}
                </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
