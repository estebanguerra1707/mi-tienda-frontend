"use client";

import Modal from "@/components/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCrearDevolucionVenta } from "../hooks/useCrearDevolucionVenta";
import type { DetalleVentaResponseDTO } from "../types/DevolucionVenta";
import { VentaItem } from "@/hooks/useVentas";
import type { DevolucionVenta } from "../types/DevolucionVenta";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  venta: VentaItem;
  details: DetalleVentaResponseDTO | null;
  onClose: () => void;
  onSuccess: (resp: DevolucionVenta) => void;
}

const baseSchema = z.object({
  cantidad: z.number().min(1, "Debe ser mayor a 0"),
  motivo: z.string().min(3, "El motivo debe tener al menos 3 caracteres"),
});

export default function DetalleProductoVentaModal({
  venta,
  details,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Hook para crear devolución
  const crearDevolucion = useCrearDevolucionVenta();

  const dynamicSchema = details
    ? baseSchema.extend({
        cantidad: baseSchema.shape.cantidad.max(
          details.quantity,
          `No puedes devolver más de ${details.quantity} unidades`
        )
      })
    : baseSchema;

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      cantidad: 1,
      motivo: "",
    },
  });

  if (!details) return null;

  const submit = async (data: z.infer<typeof dynamicSchema>) => {
    const payload = {
      ventaId: venta.id,
      detalleId: details.id,
      cantidad: data.cantidad,
      motivo: data.motivo,
      codigoBarras: details.codigoBarras,
      sku: details.sku,
      branchId: details.branchId,
      businessTypeId: details.businessTypeId,
    };

    const resp = await crearDevolucion.mutateAsync(payload);
    onSuccess(resp);
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Detalle del producto – ${details.productName}`}
    >
      <div className="animate-fadeIn space-y-6 p-3 max-h-[70vh] overflow-y-auto pr-2">

        {/* INFORMACIÓN DEL PRODUCTO */}
        <div className="space-y-1 text-gray-700 text-sm border-b pb-3">
          <p><b>Producto:</b> {details.productName}</p>
          <p><b>Código de barras:</b> {details.codigoBarras}</p>
          <p><b>SKU:</b> {details.sku}</p>

          {isSuperAdmin && (
            <>
              <p><b>Sucursal:</b> {details.branchName}</p>
              <p><b>Tipo de negocio:</b> {details.businessTypeName}</p>
            </>
          )}

          <p><b>Cantidad vendida:</b> {details.quantity}</p>
          <p><b>Precio unitario:</b> ${details.unitPrice.toFixed(2)}</p>

          {details.subTotal && (
            <p><b>Total:</b> ${Number(details.subTotal).toFixed(2)}</p>
          )}
        </div>

        {/* FORMULARIO */}
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">

          {/* Cantidad */}
          <div>
            <label className="text-sm font-semibold pb-1">Cantidad a devolver</label>
            <input
              type="number"
              {...form.register("cantidad", { valueAsNumber: true })}
              className="w-full border px-3 py-2 rounded"
            />
            <p className="text-red-500 text-sm">
              {form.formState.errors.cantidad?.message}
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="text-sm font-semibold pb-1">Motivo</label>
            <textarea
              {...form.register("motivo")}
              className="w-full border px-3 py-2 rounded"
              placeholder="Describe el motivo"
            />
            <p className="text-red-500 text-sm">
              {form.formState.errors.motivo?.message}
            </p>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={form.watch("cantidad") > details.quantity}
            >
              Registrar devolución
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
}
