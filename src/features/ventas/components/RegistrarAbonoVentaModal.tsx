"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { usePaymentMethods } from "@/hooks/useCatalogs";
import { useRegistrarAbonoVenta } from "@/hooks/useVentas";
import type { VentaItem } from "@/features/ventas/api";
import { toastError } from "@/lib/toast";
import { toastSuccess } from "@/lib/toastSuccess";

interface Props {
  open: boolean;
  venta: VentaItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RegistrarAbonoVentaModal({
  open,
  venta,
  onClose,
  onSuccess,
}: Props) {
  const { data: paymentMethods = [] } = usePaymentMethods();
  const registrarAbono = useRegistrarAbonoVenta();

  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setPaymentMethodId("");
    }
  }, [open]);

  if (!venta) return null;

  const totalAmount = Number(venta.totalAmount ?? 0);
  const totalPaid = Number(venta.totalPaid ?? 0);
  const pendingBalance = Number(venta.pendingBalance ?? 0);
  const isPaid = pendingBalance <= 0;

  const formatMoney = (value: number) => `$${value.toFixed(2)}`;

  const handleSubmit = async () => {
    const amountNumber = Number(amount);
    const methodId = Number(paymentMethodId);

    if (!amount || Number.isNaN(amountNumber)) {
      toastError("Ingresa el monto del abono.");
      return;
    }

    if (amountNumber <= 0) {
      toastError("El abono debe ser mayor a cero.");
      return;
    }

    if (amountNumber > pendingBalance) {
      toastError("El abono no puede ser mayor al saldo pendiente.");
      return;
    }

    if (!methodId || Number.isNaN(methodId)) {
      toastError("Selecciona un método de pago.");
      return;
    }

    try {
      await registrarAbono.mutateAsync({
        ventaId: venta.id,
        payload: {
          amount: amountNumber,
          paymentMethodId: methodId,
        },
      });

      toastSuccess("Abono registrado correctamente.");
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

      toastError(
        err?.response?.data?.message ??
          err?.message ??
          "Error al registrar el abono."
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="
          z-[10050]
          w-[calc(100vw-1rem)]
          max-w-[calc(100vw-1rem)]
          sm:max-w-lg
          md:max-w-xl
          max-h-[calc(100dvh-1rem)]
          overflow-y-auto
          rounded-xl
          p-4
          sm:p-5
        "
      >
        <DialogHeader className="space-y-1 pb-1">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">
            Registrar abono
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white border px-3 py-2">
                <p className="text-xs text-slate-500">Venta</p>
                <p className="font-semibold text-slate-900">#{venta.id}</p>
              </div>

              <div className="rounded-lg bg-white border px-3 py-2">
                <p className="text-xs text-slate-500">Estado</p>
                <p className="font-semibold text-slate-900">
                  {venta.paymentStatus}
                </p>
              </div>

              <div className="rounded-lg bg-white border px-3 py-2 col-span-2">
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-semibold text-slate-900 break-words">
                  {venta.clientName}
                </p>
              </div>

              <div className="rounded-lg bg-white border px-3 py-2">
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-semibold text-slate-900">
                  {formatMoney(totalAmount)}
                </p>
              </div>

              <div className="rounded-lg bg-white border px-3 py-2">
                <p className="text-xs text-slate-500">Pagado</p>
                <p className="font-semibold text-green-700">
                  {formatMoney(totalPaid)}
                </p>
              </div>

              <div className="rounded-lg bg-white border border-red-200 px-3 py-2 col-span-2">
                <p className="text-xs text-slate-500">Saldo pendiente</p>
                <p className="text-xl font-bold text-red-600">
                  {formatMoney(pendingBalance)}
                </p>
              </div>
            </div>
          </div>

          {isPaid ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Esta venta ya está pagada.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Monto del abono
                </label>

                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej. 100.00"
                  className="
                    h-11
                    text-base
                    [appearance:textfield]
                    [&::-webkit-inner-spin-button]:appearance-none
                    [&::-webkit-outer-spin-button]:appearance-none
                  "
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Método de pago
                </label>

                <select
                  className="
                    h-11
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-200
                  "
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                >
                  <option value="">Selecciona método</option>
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            {!isPaid && (
              <Button
                className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
                disabled={registrarAbono.isPending}
                onClick={handleSubmit}
              >
                {registrarAbono.isPending ? "Guardando..." : "Registrar abono"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}