"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import type { VentaConsolidadaResponse } from "@/features/ventas/api";
import { toastError } from "@/lib/toast";
import { toastSuccess } from "@/lib/toastSuccess";

interface Props {
  open: boolean;
  detalle: VentaConsolidadaResponse | null;
  onClose: () => void;
}

export default function EnviarTicketConsolidadoModal({
  open,
  detalle,
  onClose,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setLoading(false);
    }
  }, [open]);

  const handlePrint = () => {
    if (!detalle) {
      toastError("Detalle consolidado inválido.");
      return;
    }

    toastSuccess("Siguiente paso: imprimir ticket consolidado.");
  };

  const handleSend = async () => {
    if (!detalle) {
      toastError("Detalle consolidado inválido.");
      return;
    }

    if (!email.trim()) {
      toastError("Ingresa un correo válido.");
      return;
    }

    try {
      setLoading(true);

      // Aquí después conectamos el endpoint real:
      // await sendVentaConsolidadaTicketByEmail(...)

      toastSuccess("Siguiente paso: enviar ticket consolidado por correo.");
      onClose();
    } catch (err) {
      console.error(err);
      toastError("Error enviando ticket consolidado por correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar ticket consolidado por correo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Ingresa el correo al que deseas enviar el comprobante de la venta
            consolidada.
          </p>

          {detalle && (
            <div className="rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <p>
                <strong>Cliente:</strong> {detalle.clientName}
              </p>
              <p>
                <strong>Ventas incluidas:</strong>{" "}
                {detalle.ventaIds?.map((id) => `#${id}`).join(", ")}
              </p>
              <p>
                <strong>Total:</strong> ${Number(detalle.totalAmount ?? 0).toFixed(2)}
              </p>
            </div>
          )}

          <Input
            type="email"
            value={email}
            placeholder="cliente@correo.com"
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrint}
              className="text-blue-600 text-sm underline hover:text-blue-800"
            >
              🖨 Imprimir ticket
            </button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>

              <Button
                className="bg-blue-600 text-white"
                disabled={loading || !email.trim()}
                onClick={handleSend}
              >
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}