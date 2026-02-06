import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
import { z, type ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getErrorMessage } from "@/features/inventario/getErrorMessage";
import { updateInventory } from "@/features/inventario/api";
import type { InventoryItem } from "@/hooks/useInventory";
import { Pencil } from "lucide-react";

type FormValues = {
  quantity: number;
  minStock?: number;
  maxStock?: number;
  isStockCritico?: boolean;
};

const schema: ZodSchema<FormValues> = z.object({
  quantity: z.coerce.number().min(0, "Cantidad inválida"),
  minStock: z.coerce.number().min(0, "Stock mínimo inválido").optional(),
  maxStock: z.coerce.number().min(0, "Stock máximo inválido").optional(),
  isStockCritico: z.boolean().optional(),
});

const makeResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as (s: ZodSchema<T>) => Resolver<T>)(schema);

function Toast({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error"; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;
  const color = toast.type === "success" ? "bg-green-600" : "bg-red-600";
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[11000]">
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div
          className={`${color} text-white shadow-xl rounded-lg px-4 py-3 max-w-sm flex gap-3`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded px-2 hover:bg-white/15"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EditInventarioButton({
  row,
  onUpdated,
}: {
  row: InventoryItem;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resolver = useMemo(() => makeResolver<FormValues>(schema), []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      quantity: row.stock ?? 0,
      minStock: row.minStock ?? 0,
      maxStock: row.maxStock ?? 0,
      isStockCritico: row.isStockCritico  ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        quantity: row.stock ?? 0,
        minStock: row.minStock ?? 0,
        maxStock: row.maxStock ?? 0,
        isStockCritico: row.isStockCritico ?? false,
      });
    }
  }, [open, row, reset]);

  const onClose = useCallback(() => setOpen(false), []);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateInventory(row.id, {
        quantity: Number(values.quantity),
        minStock: values.minStock,
        maxStock: values.maxStock,
        isStockCritico: values.isStockCritico,
      });
      setToast({ type: "success", message: "Inventario actualizado correctamente." });
      onClose();
      onUpdated?.();
    } catch (err) {
      setToast({ type: "error", message: getErrorMessage(err) });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Editar"
        aria-label="Editar"
        className="
          inline-flex items-center justify-center
          h-10 w-10
          rounded-xl
          bg-slate-200 text-slate-900
          hover:bg-slate-300
          active:scale-[0.98]
          transition
        "
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000] isolate">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[min(100vw-1rem,26rem)] max-h-[80vh]
                         rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
                <h2 className="text-lg font-semibold">Editar inventario</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 space-y-3 overflow-y-auto">
                 {/* Tipo de dueño (solo lectura) */}
              {row.ownerType && (
                <div className="rounded-md bg-slate-50 border px-3 py-2">
                  <span className="text-xs text-slate-500">Tipo de dueño</span>
                  <div
                    className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-semibold
                      ${row.ownerType === "CONSIGNACION"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"}
                    `}
                  >
                    {row.ownerType === "CONSIGNACION" ? "Consignación" : "Propio"}
                  </div>
                </div>
              )}
               <label className="flex flex-col gap-1">
                  <span className="text-sm">Cantidad (stock)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="border rounded px-3 py-2"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="text-red-600 text-xs">{errors.quantity.message}</p>
                  )}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Stock mínimo</span>
                  <input
                    type="number"
                    className="border rounded px-3 py-2"
                    {...register("minStock")}
                  />
                  {errors.minStock && <p className="text-red-600 text-xs">{errors.minStock.message}</p>}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm">Stock máximo</span>
                  <input
                    type="number"
                    className="border rounded px-3 py-2"
                    {...register("maxStock")}
                  />
                  {errors.maxStock && <p className="text-red-600 text-xs">{errors.maxStock.message}</p>}
                </label>

                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" {...register("isStockCritico")} />
                  <span className="text-sm">Marcar como stock crítico</span>
                </label>

                <div className="sticky bottom-0 mt-4 bg-white border-t py-3 flex justify-end gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
