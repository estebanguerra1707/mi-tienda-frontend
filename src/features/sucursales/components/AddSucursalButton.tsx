import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
import { z, type ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { createSucursal } from "@/features/sucursales/sucursales.api";

type BusinessType = { id: number; name: string };

function getApiErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof e.message === "string") return e.message;
  }
  return "No se pudo crear la sucursal.";
}

const baseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  isAlertaStockCritico: z.boolean().default(false),
  businessTypeId: z.coerce.number().int().optional(), // requerido solo si es super
});
const superSchema = baseSchema.extend({
  businessTypeId: z.coerce.number().int().min(1, "Tipo de negocio requerido"),
});
type FormValues = z.infer<typeof baseSchema>;

const makeResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

function Toast({ toast, onClose }: { toast: { type: "success"|"error"; message: string } | null; onClose: () => void }) {
  if (!toast) return null;
  const color = toast.type === "success" ? "bg-green-600" : "bg-red-600";
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[11000]">
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className={`${color} text-white shadow-xl rounded-lg px-4 py-3 max-w-sm flex gap-3`}>
          <span>{toast.message}</span>
          <button type="button" onClick={onClose} className="ml-auto rounded px-2 hover:bg-white/15">×</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AddSucursalButton({ onCreated }: { onCreated?: () => void }) {
  const { user, hasRole } = useAuth();
  const isSuper = (hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN") ?? false;

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success"|"error"; message: string } | null>(null);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  // Cargar catálogo solo para super
  useEffect(() => {
    if (!open || !isSuper) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get<BusinessType[]>("/business-types");
        if (alive) setBusinessTypes(data);
      } catch {
        if (alive) setBusinessTypes([]);
      }
    })();
    return () => { alive = false; };
  }, [open, isSuper]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: useMemo(() => makeResolver<FormValues>(isSuper ? superSchema : baseSchema), [isSuper]),
    defaultValues: { isAlertaStockCritico: false },
  });

  // Para roles no super, fija businessTypeId desde el usuario
  useEffect(() => {
    if (!open) return;
    if (!isSuper) {
      const bt = (user?.businessType ?? undefined) as number | undefined; // tu User tiene businessType: number|null
      if (bt) setValue("businessTypeId", bt);
    }
  }, [open, isSuper, setValue, user?.businessType]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const onClose = useCallback(() => {
    setOpen(false);
    reset({ name: "", address: "", phone: "", isAlertaStockCritico: false, businessTypeId: undefined });
  }, [reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        name: values.name,
        address: values.address ?? "",
        phone: values.phone ?? "",
        isAlertaStockCritico: !!values.isAlertaStockCritico,
        businessTypeId: values.businessTypeId!, // validado por zod (super) o seteado (no super)
      };
      await createSucursal(payload);
      setToast({ type: "success", message: "Sucursal creada correctamente." });
      onClose();
      onCreated?.();
    } catch (err) {
            setToast({ type: "error", message: getApiErrorMessage(err) });
    }
  };

  return (
    <>
      <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => setOpen(true)}>
        Agregar sucursal
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
                         w-[min(100vw-1rem,42rem)] sm:w-[min(100vw-2rem,44rem)]
                         max-h-[85vh] rounded-xl bg-white shadow-2xl flex flex-col">
              <div className="px-4 sm:px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur z-10">
                <h2 className="text-lg font-semibold">Nueva sucursal</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm">Nombre</span>
                    <input className="border rounded px-3 py-2" {...register("name")} />
                    {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Dirección</span>
                    <input className="border rounded px-3 py-2" {...register("address")} />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Teléfono</span>
                    <input className="border rounded px-3 py-2" {...register("phone")} />
                  </label>

                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" className="h-4 w-4" {...register("isAlertaStockCritico")} />
                    <span className="text-sm">Activar alerta de stock crítico</span>
                  </label>

                  {isSuper ? (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-sm">Tipo de negocio</span>
                      <select className="border rounded px-3 py-2" {...register("businessTypeId", { valueAsNumber: true })}>
                        <option value="">Selecciona…</option>
                        {businessTypes.map((bt) => (
                          <option key={bt.id} value={bt.id}>{bt.name}</option>
                        ))}
                      </select>
                      {errors.businessTypeId && (
                        <p className="text-red-600 text-xs">{errors.businessTypeId.message as string}</p>
                      )}
                    </label>
                  ) : (
                    <input type="hidden" {...register("businessTypeId", { valueAsNumber: true })} />
                  )}
                </div>

                <div className="sticky bottom-0 -mx-4 sm:-mx-6 mt-4 bg-white/95 backdrop-blur border-t px-4 sm:px-6 py-3">
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
                      {isSubmitting ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
