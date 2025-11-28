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
      <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => setOpen(true)}>
        Agregar categoría
      </button>

      {toast &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[11000]">
            <div className={`px-3 py-2 rounded text-white shadow ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
              {toast.message}
            </div>
          </div>,
          document.body
        )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000] isolate">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                            w-[min(100vw-1rem,40rem)] max-h-[85vh] rounded-xl bg-white shadow-2xl flex flex-col">
              <div className="px-5 py-4 border-b sticky top-0 bg-white/95 backdrop-blur z-10">
                <h2 className="text-lg font-semibold">Nueva categoría</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 overflow-y-auto space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Nombre</span>
                  <input className="border rounded px-3 py-2" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm">Descripción</span>
                  <textarea className="border rounded px-3 py-2 resize-y" rows={3} {...register("description")} />
                </label>

                {isSuper ? (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Tipo de negocio</span>
                    <select className="border rounded px-3 py-2" {...register("businessTypeId", { valueAsNumber: true })}>
                      <option value="">Selecciona…</option>
                      {businessTypes.map(bt => (
                        <option key={bt.id} value={bt.id}>{bt.name}</option>
                      ))}
                    </select>
                    {errors.businessTypeId && <p className="text-xs text-red-600">{errors.businessTypeId.message as string}</p>}
                  </label>
                ) : (
                  <input type="hidden" {...register("businessTypeId", { valueAsNumber: true })} />
                )}

                <div className="sticky bottom-0 -mx-5 mt-4 bg-white/95 backdrop-blur border-t px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Cancelar</button>
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
