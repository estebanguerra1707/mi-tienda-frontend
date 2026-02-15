"use client";

import Modal from "@/components/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCrearDevolucionVenta } from "../hooks/useCrearDevolucionVenta";
import type { DetalleVentaResponseDTO } from "../types/DevolucionVenta";
import type { DevolucionVenta } from "../types/DevolucionVenta";
import type { VentaItem } from "@/hooks/useVentas";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  venta: VentaItem;
  details: DetalleVentaResponseDTO | null;
  onClose: () => void;
  onSuccess: (resp: DevolucionVenta) => void;
}
type OwnerType = "PROPIO" | "CONSIGNACION";

const baseSchema = z.object({
  cantidad: z.number().positive("Debe ser mayor a 0"),
  motivo: z.string().min(3, "El motivo debe tener al menos 3 caracteres"),
});
type FormValues = z.infer<typeof baseSchema>;

function normalizeUnit(input?: string | null): string {
  return (input ?? "").trim().toLowerCase();
}

function deriveUnitAbbr(unitAbbr?: string | null, unitName?: string | null): string {
  const abbr = normalizeUnit(unitAbbr).replace(".", "");
  if (abbr) return abbr;

  const name = normalizeUnit(unitName);

  if (name.includes("metro") || name === "mts" || name === "mt") return "m";
  if (name.includes("centimetro") || name === "cm") return "cm";
  if (name.includes("milimetro") || name === "mm") return "mm";

  if (name.includes("kilogramo") || name === "kg") return "kg";
  if (name === "gramo" || name === "g") return "g";

  if (name.includes("litro") || name === "l") return "l";
  if (name.includes("mililitro") || name === "ml") return "ml";

  if (name.includes("pieza") || name.includes("pza") || name === "un" || name.includes("unidad")) {
    return "pz";
  }
  return "pz";
}

function unitAllowsDecimals(unitAbbr: string): boolean {
  const u = normalizeUnit(unitAbbr);
  const noDecimals = new Set(["pz", "pza", "pieza", "un", "unidad"]);
  if (noDecimals.has(u)) return false;

  const yesDecimals = new Set(["kg", "g", "l", "ml", "m", "cm", "mm"]);
  if (yesDecimals.has(u)) return true;

  // default: NO (para no permitir decimales en unidades desconocidas)
  return false;
}

export default function DetalleProductoVentaModal({
  venta,
  details,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const crearDevolucion = useCrearDevolucionVenta();

  const max = Number(details?.quantity ?? 0);

  const unitAbbr = useMemo(() => {
    return deriveUnitAbbr(details?.unitAbbr ?? null, details?.unitName ?? null);
  }, [details?.unitAbbr, details?.unitName]);

  const permiteDecimales = useMemo(() => {
    if (typeof details?.permiteDecimales === "boolean") return details.permiteDecimales;
    return unitAllowsDecimals(unitAbbr);
  }, [details?.permiteDecimales, unitAbbr]);

  const step = permiteDecimales ? "0.01" : "1";
  const min = permiteDecimales ? 0.01 : 1;

  const schema = useMemo(() => {
    return baseSchema.extend({
      cantidad: baseSchema.shape.cantidad.max(
        max,
        `No puedes devolver más de ${max} ${unitAbbr}`
      ),
    });
  }, [max, unitAbbr]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cantidad: min, motivo: "" },
  });

  // ✅ IMPORTANTÍSIMO: cuando cambias de producto, resetea el form con el min correcto
  useEffect(() => {
    if (!details) return;
    form.reset({ cantidad: min, motivo: "" });
  }, [details?.id, min, form, details]);

  // ✅ ahora sí: si no hay details, no renderizamos UI
  if (!details) return null;

  const unitPrice = Number(details.unitPrice ?? 0);
  const subTotal = details.subTotal != null ? Number(details.subTotal) : null;

  const usaInventarioPorDuenio = details.usaInventarioPorDuenio === true;
  const ownerType: OwnerType = usaInventarioPorDuenio
    ? (details.inventarioOwnerType ?? "PROPIO")
    : "PROPIO";

  const submit = async (data: FormValues) => {
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

  const cantidad = Number(form.watch("cantidad") ?? 0);
  const disabled = crearDevolucion.isPending || cantidad > max || cantidad < min;

  return (
    <Modal open={true} onClose={onClose} title={`Producto · ${details.productName}`}>
      <div className="space-y-5 px-1 max-h-[80vh] overflow-y-auto">
        <div className="text-sm text-gray-700 space-y-1">
          <p><b>Código:</b> {details.codigoBarras}</p>
          <p><b>SKU:</b> {details.sku}</p>

          {usaInventarioPorDuenio && (
            <p>
              <b>Tipo de producto:</b>{" "}
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
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

          <p><b>Cantidad vendida:</b> {max} {unitAbbr}</p>
          <p><b>Precio unitario:</b> ${unitPrice.toFixed(2)}</p>
          {subTotal != null && <p><b>Total:</b> ${subTotal.toFixed(2)}</p>}
        </div>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Cantidad a devolver ({unitAbbr})
            </label>
            <input
              type="number"
              step={step}
              min={min}
              {...form.register("cantidad", { valueAsNumber: true })}
              className={inputCls}
            />
            {form.formState.errors.cantidad && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.cantidad.message}
              </p>
            )}
            {!permiteDecimales && (
              <p className="text-[11px] text-gray-500">
                Esta unidad ({unitAbbr}) no permite decimales: solo enteros.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Motivo</label>
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
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={disabled}
            >
              Registrar devolución
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
