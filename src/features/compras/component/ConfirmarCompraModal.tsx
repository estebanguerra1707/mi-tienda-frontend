"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { ResumenCompra, ProductoResumen } from "@/types/catalogs";


type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  resumen: ResumenCompra | null;
};

function formatCantidadConUnidad(p: ProductoResumen): string {
  const qty = Number.isFinite(p.quantity) ? p.quantity : 0;

  // Si viene abreviatura, úsala primero; si no, el nombre; si no, nada.
  const unit =
    (p.unitAbbr && p.unitAbbr.trim()) ||
    (p.unitName && p.unitName.trim()) ||
    "";

  // Ej: "2 pz" / "0.50 kg" / "3"
  return unit ? `${qty} ${unit}` : `${qty}`;
}

export default function ConfirmarCompraModal({
  open,
  onClose,
  onConfirm,
  resumen,
  isLoading,
}: Props) {
  if (!resumen) return null;

  const { proveedor, sucursal, metodoPago, productos, total, pago, cambio } =
    resumen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Confirmar compra
          </DialogTitle>
        </DialogHeader>

        {/* SCROLL INTERNO */}
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
          <div>
            <p className="font-semibold">Proveedor:</p>
            <p>{proveedor}</p>
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
              {productos.map((p, i) => (
                <li key={`${p.name}-${i}`}>
                  {p.name} — {formatCantidadConUnidad(p)} x $
                  {p.price.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>

          <div className="font-semibold">Total: ${total.toFixed(2)}</div>

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
        </div>

        {/* BOTONES ABAJO (SIEMPRE VISIBLES) */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            className="bg-blue-600 text-white"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Registrando compra…" : "Confirmar compra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
