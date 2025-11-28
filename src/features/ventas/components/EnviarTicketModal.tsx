"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { sendVentaTicketByEmail } from "@/features/ventas/api";
import { EnviarTicketModalProps } from "@/types/catalogs";
import { toastSuccess } from "@/lib/toastSuccess";
import { toastError } from "@/lib/toast";
import { printTicketUniversal } from "@/lib/printTicket";

export default function EnviarTicketModal({ ventaId, open, onClose }: EnviarTicketModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!ventaId) return;

    try {
      setLoading(true);
      await sendVentaTicketByEmail(ventaId, [email]);
      toastSuccess("Ticket enviado correctamente.");
      onClose();
    } catch (err) {
      console.error(err);
      toastError("Error enviando ticket por correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar ticket por correo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Ingresa el correo al que deseas enviar el comprobante de la venta.
          </p>

          <Input
            type="email"
            value={email}
            placeholder="cliente@correo.com"
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* ============================
              FILA DE IMPRESIÓN + BOTONES
              ============================ */}
          <div className="flex justify-between items-center mt-6">

            {/* 🔵 Enlace de imprimir */}
            <button
              onClick={() => printTicketUniversal(ventaId!, "venta")}
              className="text-blue-600 text-sm underline hover:text-blue-800"
            >
              Imprimir ticket
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
