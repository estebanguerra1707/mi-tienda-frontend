import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";
import { useProveedor, useUpdateProveedor } from "../useProveedores";
import { Pencil } from "lucide-react";
const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contact: z.string().optional().nullable(),
  email: z.string().email("Correo inválido").optional().nullable(),
  branchIds: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditProveedorButton({
  id,
}: {
  id: number;
  onUpdated?: () => void;
}) {
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [open, setOpen] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const { user, hasRole } = useAuth();
  const isSuperAdmin =
    (hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN") ?? false;

const { data: branches = [], isLoading: branchesLoading } = useBranches({
  isSuper: isSuperAdmin,
  businessTypeId: null,
  oneBranchId: !isSuperAdmin ? user?.branchId ?? null : null,
});

  const { data: proveedor, isFetching } = useProveedor(open ? id : undefined);
  const updateMutation = useUpdateProveedor();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);
  

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ✅ cuando llegue proveedor, llenar form
  useEffect(() => {
    if (!open || !proveedor) return;

    const branchIds = proveedor.sucursales?.map((s) => s.id) ?? [];

    reset({
      name: proveedor.name ?? "",
      contact: proveedor.contact ?? "",
      email: proveedor.email ?? "",
      branchIds,
    });

    setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [open, proveedor, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: FormValues = {
        ...values,
        branchIds: isSuperAdmin
          ? values.branchIds
          : user?.branchId
            ? [user.branchId]
            : [],
      };

      await updateMutation.mutateAsync({ id, payload });

      setToast({ type: "success", message: "Proveedor actualizado correctamente" });
      onClose();
    } catch {
      setToast({ type: "error", message: "Error al actualizar el proveedor" });
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Editar"
        aria-label="Editar"
        className="
          inline-flex items-center justify-center
          px-2 py-1
          rounded
          bg-slate-200 text-slate-900
          hover:bg-slate-300
          active:scale-[0.98]
          transition
        "
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  const nameReg = register("name");

  return (
    <>
      {toast &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[11000]">
            <div
              className={`px-4 py-2 rounded text-white shadow ${
                toast.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {toast.message}
            </div>
          </div>,
          document.body
        )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000]">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

            <div
              role="dialog"
              aria-modal="true"
              className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center px-0 md:px-4"
            >
              <div
                className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] md:max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-5 py-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Editar proveedor</h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {isFetching ? "Cargando…" : "Actualiza los datos del proveedor"}
                    </p>
                  </div>

                  <button type="button" onClick={onClose} className="h-10 w-10 rounded-xl hover:bg-slate-100">
                    ✕
                  </button>
                </div>

                <form
                  id="edit-proveedor-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="px-5 py-5 overflow-y-auto"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Nombre</span>
                      <input
                        {...nameReg}
                        ref={(el) => {
                          nameReg.ref(el);
                          firstFieldRef.current = el;
                        }}
                        className="mt-1 w-full h-11 border rounded-xl px-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border-slate-300 outline-none transition"
                        placeholder="Ej. Proveedor Centro"
                      />
                      {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                    </label>

                    <label>
                      <span className="text-sm font-medium">Contacto</span>
                      <input {...register("contact")} className="mt-1 w-full h-11 rounded-xl border px-3" />
                    </label>

                    <label>
                      <span className="text-sm font-medium">Correo</span>
                      <input {...register("email")} className="mt-1 w-full h-11 rounded-xl border px-3" />
                    </label>

                    {isSuperAdmin && (
                      <label className="sm:col-span-2">
                        <span className="text-sm font-medium">Sucursales</span>
                        <Controller
                          control={control}
                          name="branchIds"
                          render={({ field }) => (
                            <select
                              multiple
                              className="mt-1 w-full min-h-[120px] rounded-xl border px-3"
                              disabled={branchesLoading}
                              value={(field.value ?? []).map(String)}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                                field.onChange(selected);
                              }}
                              onBlur={field.onBlur}
                              ref={field.ref}
                            >
                              {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </label>
                    )}
                    {!isSuperAdmin && (
                      <div className="sm:col-span-2">
                        <span className="text-sm font-medium text-slate-700">
                          Sucursal asignada
                        </span>

                        <input
                          readOnly
                          className="mt-1 w-full h-11 rounded-xl border px-3 bg-gray-100 text-gray-700"
                          value={
                            branchesLoading
                              ? "Cargando…"
                              : branches.find((b) => b.id === user?.branchId)?.name
                                ?? "Sucursal asignada"
                          }
                        />
                      </div>
                    )}
                  </div>
                </form>

                <div className="border-t px-5 py-4 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    form="edit-proveedor-form"
                    disabled={isSubmitting || updateMutation.isPending}
                    className="px-5 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {isSubmitting || updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}