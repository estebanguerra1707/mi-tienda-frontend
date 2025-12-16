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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4 animate-fadeIn">

      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        className="
          bg-white rounded-2xl shadow-2xl border border-gray-200
          w-full max-w-lg sm:max-w-xl lg:max-w-2xl
          max-h-[90vh] overflow-hidden
          animate-scaleIn
          flex flex-col
        "
      >

        {/* Header */}
        <div className="px-5 py-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
            Nueva sucursal
          </h2>
          <p className="text-sm text-gray-500">Completa los detalles para crear la nueva sucursal.</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-5 py-4 overflow-y-auto space-y-6"
        >

          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border-gray-300 outline-none transition"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border-gray-300 outline-none transition"
                {...register("address")}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border-gray-300 outline-none transition"
                {...register("phone")}
              />
            </div>

            {/* Checkbox */}
            <div className="sm:col-span-2 flex items-center gap-3 mt-1">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                {...register("isAlertaStockCritico")}
              />
              <span className="text-sm text-gray-700">
                Activar alerta de stock crítico
              </span>
            </div>

            {/* Tipo de negocio (solo SUPER ADMIN) */}
            {isSuper ? (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Tipo de negocio</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border-gray-300 outline-none transition"
                  {...register("businessTypeId", { valueAsNumber: true })}
                >
                  <option value="">Selecciona…</option>
                  {businessTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                  ))}
                </select>
                {errors.businessTypeId && (
                  <p className="text-red-600 text-xs mt-1">{errors.businessTypeId.message as string}</p>
                )}
              </div>
            ) : (
              <input type="hidden" {...register("businessTypeId", { valueAsNumber: true })} />
            )}

          </div>

          {/* Footer buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 border-t pt-4 mt-4">

            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2 rounded-lg border text-gray-700
                hover:bg-gray-100 transition
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                px-4 py-2 rounded-lg bg-blue-600 text-white shadow-sm
                hover:bg-blue-700 transition disabled:opacity-60
              "
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </button>

          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
    </>
  );
}
