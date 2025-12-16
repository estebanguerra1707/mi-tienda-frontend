"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { sendCompraTicketByEmail } from "@/features/compras/api";
import { toastSuccess } from "@/lib/toastSuccess";
import { toastError } from "@/lib/toast";
import { printTicketUniversal } from "@/lib/printTicket";

interface EnviarTicketCompraModalProps {
  compraId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function EnviarTicketCompraModal({
  compraId,
  open,
  onClose,
}: EnviarTicketCompraModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!compraId) return;

    try {
      setLoading(true);
      await sendCompraTicketByEmail(compraId, [email]);
      toastSuccess("Ticket de compra enviado correctamente.");
      onClose();
    } catch (err) {
      console.error(err);
      toastError("Error enviando ticket de compra por correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar ticket de compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Ingresa el correo al que deseas enviar el comprobante de la compra.
          </p>

          <Input
            type="email"
            value={email}
            placeholder="correo@correo.com"
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => {
              if (!compraId) {
                toastError("ID inválido");
                return;
              }
              printTicketUniversal(compraId, "compra");
            }}
            className="text-blue-600 text-sm underline hover:text-blue-800"
          >
            Imprimir ticket
          </button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>

              <Button
                className="bg-blue-600 text-white flex items-center justify-center gap-2"
                disabled={loading || !email.trim() || !compraId}
                onClick={handleSend}
                >
                {loading ? (
                    <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Enviando...
                    </div>
                ) : (
                    "Enviar"
                )}
                </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
