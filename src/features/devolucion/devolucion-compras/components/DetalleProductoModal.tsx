"use client";

import Modal from "@/components/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCrearDevolucion } from "../hooks/useCrearDevolucion";
import type { CompraItem, DetalleCompraResponseDTO } from "@/features/compras/api";
import type { Devolucion } from "../types/Devolucion";
import { useAuth } from "@/hooks/useAuth";
interface Props {
  compra: CompraItem;
  detalle: DetalleCompraResponseDTO | null;
  onClose: () => void;
  onSuccess: (resp: Devolucion) => void;
}

const baseSchema = z.object({
  cantidad: z.number().min(1, "Debe ser mayor a 0"),
  motivo: z.string().min(3, "El motivo debe tener al menos 3 caracteres"),
});

export default function DetalleProductoModal({
  compra,
  detalle,
  onClose,
  onSuccess,
}: Props) {
      const { user } = useAuth();
      const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  // Hooks antes de cualquier return
  const crearDevolucion = useCrearDevolucion();

  const buildSchema = detalle
    ? baseSchema.extend({
        cantidad: baseSchema.shape.cantidad.max(
          detalle.quantity,
          `No puedes devolver más de ${detalle.quantity} unidades`
        ),
      })
    : baseSchema;

  const schema = detalle ? buildSchema : baseSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cantidad: 1,
      motivo: "",
    },
  });

  // Render condicional DESPUÉS de los hooks
  if (!detalle) return null;

  const submit = async (data: z.infer<typeof schema>) => {
    const payload = {
      compraId: compra.id,
      detalleId: detalle.id,
      cantidad: data.cantidad,
      sku: detalle.sku,
      branchId:detalle.branchId,
      businessTypeId:detalle.businessTypeId,
      codigoBarras: detalle.codigoBarras,
      motivo: data.motivo,
    };

    const resp = await crearDevolucion.mutateAsync(payload);
    onSuccess(resp);
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Detalle del producto – ${detalle.productName}`}
    >
    <div className="animate-fadeIn space-y-6 p-3 max-h-[70vh] overflow-y-auto pr-2">

        <div className="space-y-1 text-gray-700 text-sm border-b pb-3">
          <p><b>Producto:</b> {detalle.productName}</p>
          <p><b>Código de barras:</b> {detalle.codigoBarras}</p>
          <p><b>SKU:</b> {detalle.sku}</p>
           {isSuperAdmin && (
                <>
                    <p><b>Sucursal:</b> {detalle.branchName}</p>
                    <p><b>Tipo de negocio:</b> {detalle.businessTypeName}</p>
                </>
                )}
          <p><b>Cantidad comprada:</b> {detalle.quantity}</p>
          <p><b>Precio unitario:</b> ${detalle.unitPrice.toFixed(2)}</p>

          {detalle.subTotal && (
            <p><b>Subtotal:</b> ${Number(detalle.subTotal).toFixed(2)}</p>
          )}
        </div>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">

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
              disabled={form.watch("cantidad") > detalle.quantity}
            >
              Registrar devolución
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
}
