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
type OwnerType = "PROPIO" | "CONSIGNACION";

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

  const crearDevolucion = useCrearDevolucionVenta();

  const dynamicSchema = details
    ? baseSchema.extend({
        cantidad: baseSchema.shape.cantidad.max(
          details.quantity,
          `No puedes devolver más de ${details.quantity} unidades`
        ),
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
const usaInventarioPorDuenio = details.usaInventarioPorDuenio === true;

const ownerType: OwnerType = usaInventarioPorDuenio
  ? (details.inventarioOwnerType ?? details.inventarioOwnerType ?? "PROPIO")
  : "PROPIO";

  const submit = async (data: z.infer<typeof dynamicSchema>) => {
    if (!ownerType) {
        throw new Error("No se pudo determinar el tipo de inventario del producto.");
      }
      if (!usaInventarioPorDuenio && ownerType !== "PROPIO") {
        throw new Error(
          "Esta sucursal no maneja inventario por consignación."
        );
      }

      if (
        ownerType !== "PROPIO" &&
        ownerType !== "CONSIGNACION"
      ) {
        throw new Error("Tipo de inventario inválido.");
      }
    const payload = {
      ventaId: venta.id,
      detalleId: details.id,
      cantidad: data.cantidad,
      motivo: data.motivo,
      codigoBarras: details.codigoBarras,
      sku: details.sku,
      branchId: details.branchId,
      businessTypeId: details.businessTypeId,
      ownerType,
    };

    const resp = await crearDevolucion.mutateAsync(payload);
    onSuccess(resp);
    onClose();
  };

  const inputCls =
    "w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Producto · ${details.productName}`}
    >
      <div className="space-y-5 px-1 max-h-[80vh] overflow-y-auto">

        {/* ---------- INFO PRODUCTO (PLANO) ---------- */}
        <div className="text-sm text-gray-700 space-y-1">
          <p><b>Código:</b> {details.codigoBarras}</p>
          <p><b>SKU:</b> {details.sku}</p>
          {usaInventarioPorDuenio && (
            <p>
              <b>Tipo de producto:</b>{" "}
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
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
          {isSuperAdmin && (
            <>
              <p><b>Sucursal:</b> {details.branchName}</p>
              <p><b>Negocio:</b> {details.businessTypeName}</p>
            </>
          )}

          <p><b>Cantidad vendida:</b> {details.quantity}</p>
          <p><b>Precio unitario:</b> ${details.unitPrice.toFixed(2)}</p>

          {details.subTotal && (
            <p><b>Total:</b> ${Number(details.subTotal).toFixed(2)}</p>
          )}
        </div>

        {/* ---------- FORMULARIO ---------- */}
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">

          {/* Cantidad */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Cantidad a devolver
            </label>
            <input
              type="number"
              {...form.register("cantidad", { valueAsNumber: true })}
              className={inputCls}
            />
            {form.formState.errors.cantidad && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.cantidad.message}
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Motivo
            </label>
            <textarea
              {...form.register("motivo")}
              className={`${inputCls} min-h-[90px]`}
              placeholder="Describe el motivo"
            />
            {form.formState.errors.motivo && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.motivo.message}
              </p>
            )}
          </div>

          {/* ---------- BOTONES ---------- */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
