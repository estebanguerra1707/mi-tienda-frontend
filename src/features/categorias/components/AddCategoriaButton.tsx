import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
import { z, type ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { createCategoria } from "@/features/categorias/categorias.api";

type BusinessType = { id: number; name: string };

const baseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  businessTypeId: z.coerce.number().int().optional(), // requerido solo si es super
});
const superSchema = baseSchema.extend({
  businessTypeId: z.coerce.number().int().min(1, "Tipo de negocio requerido"),
});
type FormValues = z.infer<typeof baseSchema>;

const makeResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

function getApiErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof e.message === "string") return e.message;
  }
  return "No se pudo crear la categoría.";
}

export default function AddCategoriaButton({ onCreated }: { onCreated?: () => void }) {
  const { user, hasRole } = useAuth();
  const isSuper = (hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN") ?? false;

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  // catálogos BT (super)
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

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: useMemo(() => makeResolver<FormValues>(isSuper ? superSchema : baseSchema), [isSuper]),
      defaultValues: {},
    });

  // no-super: fija BT del usuario
  useEffect(() => {
    if (!open || isSuper) return;
    const bt = user?.businessType ?? undefined;
    if (bt) setValue("businessTypeId", bt);
  }, [open, isSuper, setValue, user?.businessType]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const onClose = useCallback(() => {
    setOpen(false);
    reset({});
  }, [reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createCategoria({
        name: values.name,
        description: values.description ?? "",
        businessTypeId: (values.businessTypeId ??
          (user?.businessType ?? 0)) as number,
      });
      setToast({ type: "success", message: "Categoría creada." });
      onClose();
      onCreated?.();
    } catch (err) {
      setToast({ type: "error", message: getApiErrorMessage(err) });
    }
  };

 return (
  <>
    {/* Botón principal */}
    <button
      onClick={() => setOpen(true)}
      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md 
                 transition-all duration-200 active:scale-[0.97]"
    >
      ➕ Nueva categoría
    </button>

    {/* TOAST flotante */}
    {toast &&
      createPortal(
        <div className="fixed bottom-6 right-6 z-[11000]">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          >
            {toast.message}
          </div>
        </div>,
        document.body
      )}

    {/* MODAL */}
    {open &&
      createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          {/* Fondo oscuro */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm
                       animate-fadeIn"
            onClick={onClose}
          />

          {/* Contenedor del modal */}
          <div
            className="relative z-10 w-[min(95vw,42rem)] max-h-[90vh]
                       bg-white rounded-2xl shadow-2xl overflow-hidden
                       animate-scaleIn flex flex-col"
          >
            {/* HEADER */}
            <div className="px-6 py-4 border-b bg-white/90 backdrop-blur-md flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Crear nueva categoría
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="px-6 py-5 overflow-y-auto space-y-5"
            >
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Nombre de la categoría
                </label>
                <input
                  className="border rounded-lg px-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-500 
                             focus:outline-none transition"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={3}
                  className="border rounded-lg px-3 py-2 w-full shadow-sm resize-y
                             focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  {...register("description")}
                />
              </div>

              {/* Tipo de negocio (solo super admin) */}
              {isSuper ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Tipo de negocio
                  </label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full shadow-sm focus:ring-blue-500"
                    {...register("businessTypeId", { valueAsNumber: true })}
                  >
                    <option value="">Selecciona…</option>
                    {businessTypes.map((bt) => (
                      <option key={bt.id} value={bt.id}>
                        {bt.name}
                      </option>
                    ))}
                  </select>
                  {errors.businessTypeId && (
                    <p className="text-xs text-red-600">
                      {errors.businessTypeId.message as string}
                    </p>
                  )}
                </div>
              ) : (
                <input type="hidden" {...register("businessTypeId")} />
              )}

              {/* FOOTER */}
              <div className="sticky bottom-0 left-0 right-0 -mx-6 mt-6 px-6 py-4 border-t
                              bg-white/95 backdrop-blur-md flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border shadow-sm hover:bg-gray-50 
                             text-gray-700 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow 
                             disabled:opacity-60 transition"
                >
                  {isSubmitting ? "Guardando…" : "Guardar categoría"}
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
