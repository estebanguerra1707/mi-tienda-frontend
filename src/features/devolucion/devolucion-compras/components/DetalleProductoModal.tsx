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

type OwnerType = "PROPIO" | "CONSIGNACION";

type DetalleCompraWithOwner = DetalleCompraResponseDTO & {
  ownerType?: OwnerType;
  inventarioOwnerType?: OwnerType;
  usaInventarioPorDuenio?: boolean;
};


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

  const crearDevolucion = useCrearDevolucion();

  const schema = detalle
    ? baseSchema.extend({
        cantidad: baseSchema.shape.cantidad.max(
          detalle.quantity,
          `No puedes devolver más de ${detalle.quantity} unidades`
        ),
      })
    : baseSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cantidad: 1,
      motivo: "",
    },
  });

  if (!detalle) return null;
  const normalizedDetalle = detalle as DetalleCompraWithOwner;

    const ownerType: OwnerType =
      normalizedDetalle.ownerType ??
      normalizedDetalle.inventarioOwnerType ??
      "PROPIO";

    const usaInventarioPorDuenio =
      normalizedDetalle.usaInventarioPorDuenio === true;
  

  const submit = async (data: z.infer<typeof schema>) => {
     if (!ownerType) {
        throw new Error("No se pudo determinar el tipo de inventario del producto.");
      }

      if (!usaInventarioPorDuenio && ownerType !== "PROPIO") {
        throw new Error(
          "Esta sucursal no maneja inventario por consignación."
        );
      }

      if (ownerType !== "PROPIO" && ownerType !== "CONSIGNACION") {
        throw new Error("Tipo de inventario inválido.");
      }

    const payload = {
      compraId: compra.id,
      detalleId: detalle.id,
      cantidad: data.cantidad,
      sku: detalle.sku,
      branchId: detalle.branchId,
      businessTypeId: detalle.businessTypeId,
      codigoBarras: detalle.codigoBarras,
      motivo: data.motivo,
      ownerType,
    };

    const resp = await crearDevolucion.mutateAsync(payload);
    onSuccess(resp);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={detalle.productName}
    >
      <div className="space-y-4 px-3 py-2 max-h-[75vh] overflow-y-auto">

        {/* INFO PRODUCTO */}
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-medium">{detalle.productName}</p>
          {usaInventarioPorDuenio && (
            <p className="text-xs">
              <b>Tipo de producto:</b>{" "}
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                  ${
                    ownerType === "PROPIO"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
              >
                {ownerType}
              </span>
            </p>
          )}
          <p className="text-xs text-gray-600">
            {detalle.codigoBarras} · SKU {detalle.sku}
          </p>

          {isSuperAdmin && (
            <p className="text-xs text-gray-600">
              {detalle.branchName} · {detalle.businessTypeName}
            </p>
          )}

          <p className="text-xs text-gray-600">
            Cantidad: {detalle.quantity} · ${detalle.unitPrice.toFixed(2)}
          </p>

          {detalle.subTotal && (
            <p className="text-xs font-medium">
              Subtotal: ${Number(detalle.subTotal).toFixed(2)}
            </p>
          )}
        </div>

        {/* FORM */}
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">

          <div>
            <label className="text-sm font-medium">Cantidad a devolver</label>
            <input
              type="number"
              {...form.register("cantidad", { valueAsNumber: true })}
              className="w-full border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-red-500">
              {form.formState.errors.cantidad?.message}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Motivo</label>
            <textarea
              {...form.register("motivo")}
              className="w-full border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe el motivo"
            />
            <p className="text-xs text-red-500">
              {form.formState.errors.motivo?.message}
            </p>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 rounded-lg border"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={form.watch("cantidad") > detalle.quantity}
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            >
              Registrar devolución
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
