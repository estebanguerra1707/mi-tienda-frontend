import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { createProveedor, updateProveedor } from "../proveedores.api";
import type { Proveedor, CreateProveedorDto, UpdateProveedorDto } from "../types";

/* ================= SCHEMAS ================= */

// Convierte "" => null (para que opcionales no truene con "")
const contactSchema = z
  .string()
  .optional()
  .transform((v) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  });

const emailSchema = z
  .union([z.string().email("Correo inválido"), z.literal(""), z.undefined()])
  .transform((v) => (v === "" || v === undefined ? null : v));

const baseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contact: contactSchema,
  email: emailSchema,
  branchIds: z.array(z.number().int().positive()).default([]),
});

type FormInput = z.input<typeof baseSchema>;
type FormValues = z.output<typeof baseSchema>;

type SucursalLite = { id: number; name: string };

// ✅ tipo mínimo para leer sucursales desde initialData sin usar any
type ProveedorSucursalLite = { id: number };

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Proveedor | null;
  onSaved?: () => void;
}

export default function ProveedorFormModal({
  open,
  onClose,
  initialData,
  onSaved,
}: Props) {
  const { user, hasRole } = useAuth();
  const isSuper =
    (hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN") ?? false;

  const [sucursales, setSucursales] = useState<SucursalLite[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  const activeSchema = useMemo(() => {
    if (!isSuper) return baseSchema;

    return baseSchema.superRefine((val, ctx) => {
      if (!initialData && (!val.branchIds || val.branchIds.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchIds"],
          message: "Selecciona al menos una sucursal",
        });
      }
    });
  }, [isSuper, initialData]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, undefined, FormValues>({
    resolver: zodResolver(activeSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      branchIds: [],
    },
  });

  /* ===== Cargar sucursales (solo SUPER_ADMIN) ===== */
  useEffect(() => {
    if (!open || !isSuper) return;

    let alive = true;
    setLoadingCatalogo(true);

    (async () => {
      try {
        const { data } = await api.get<SucursalLite[]>("/sucursales");
        if (alive) setSucursales(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setSucursales([]);
      } finally {
        if (alive) setLoadingCatalogo(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, isSuper]);

  /* ===== Reset al abrir ===== */
  useEffect(() => {
    if (!open) return;

    // ✅ SIN any
    const initialBranchIds =
      (initialData?.sucursales as ProveedorSucursalLite[] | undefined)?.map(
        (s) => s.id
      ) ?? [];

    reset({
      name: initialData?.name ?? "",
      contact: initialData?.contact ?? "",
      email: initialData?.email ?? "",
      branchIds: isSuper
        ? initialData
          ? initialBranchIds
          : []
        : user?.branchId
          ? [user.branchId]
          : initialBranchIds,
    });

    if (!isSuper && user?.branchId) {
      setValue("branchIds", [user.branchId], { shouldValidate: true });
    }
  }, [open, initialData, reset, isSuper, setValue, user?.branchId]);

  /* ===== SUBMIT ===== */
  const onSubmit = async (values: FormValues) => {
    if (initialData) {
      const payload: UpdateProveedorDto = {
        name: values.name,
        contact: values.contact ?? null,
        email: values.email ?? null,
      };
      await updateProveedor(initialData.id, payload);
    } else {
      const branchIds =
        isSuper ? values.branchIds : user?.branchId ? [user.branchId] : [];

      if (!branchIds || branchIds.length === 0) {
        throw new Error("No se pudo determinar la(s) sucursal(es).");
      }

      const payload: CreateProveedorDto = {
        name: values.name,
        contact: values.contact ?? null,
        email: values.email ?? null,
        branchIds,
      };

      await createProveedor(payload);
    }

    onClose();
    onSaved?.();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] isolate">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="
          fixed left-0 right-0 bottom-0
          sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto
          sm:-translate-x-1/2 sm:-translate-y-1/2
          w-full sm:w-[min(100vw-2rem,44rem)]
          max-h-[92vh] sm:max-h-[85vh]
          bg-white
          rounded-t-3xl sm:rounded-2xl
          shadow-2xl
          overflow-hidden
          flex flex-col
        "
      >
        <div className="sm:hidden flex justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        <div className="px-5 sm:px-6 py-4 border-b bg-white/95 backdrop-blur sticky top-0 z-10">
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                {initialData ? "Editar proveedor" : "Nuevo proveedor"}
              </h2>
              <p className="text-sm text-slate-500">
                {initialData
                  ? "Actualiza la información del proveedor."
                  : "Completa los datos para registrar un proveedor."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-auto h-10 w-10 rounded-xl hover:bg-slate-100 transition flex items-center justify-center text-slate-600"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <form
          id="proveedor-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 px-5 sm:px-6 py-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Nombre
              </label>
              <input
                className="
                  mt-1 w-full rounded-xl border border-slate-300
                  px-3 py-2.5 bg-slate-50 focus:bg-white
                  focus:ring-2 focus:ring-blue-500 outline-none transition
                "
                placeholder="Ej. Proveedor ABC"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contacto
              </label>
              <input
                className="
                  mt-1 w-full rounded-xl border border-slate-300
                  px-3 py-2.5 bg-slate-50 focus:bg-white
                  focus:ring-2 focus:ring-blue-500 outline-none transition
                "
                placeholder="Teléfono / contacto"
                {...register("contact")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo
              </label>
              <input
                className="
                  mt-1 w-full rounded-xl border border-slate-300
                  px-3 py-2.5 bg-slate-50 focus:bg-white
                  focus:ring-2 focus:ring-blue-500 outline-none transition
                "
                placeholder="correo@ejemplo.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            {isSuper && !initialData && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Sucursales
                </label>

                <Controller
                  name="branchIds"
                  control={control}
                  render={({ field }) => (
                    <select
                      multiple
                      disabled={loadingCatalogo}
                      className="
                        mt-1 w-full min-h-[140px] rounded-xl border border-slate-300
                        px-3 py-2.5 bg-slate-50 focus:bg-white
                        focus:ring-2 focus:ring-blue-500 outline-none transition
                      "
                      value={(field.value ?? []).map(String)}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions
                        ).map((o) => Number(o.value));
                        field.onChange(selected);
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    >
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                />

                {errors.branchIds && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.branchIds.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="border-t bg-white/95 backdrop-blur px-5 sm:px-6 py-4 sticky bottom-0">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="
                h-11 px-4 rounded-xl border border-slate-300
                text-slate-700 hover:bg-slate-100 transition
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="proveedor-form"
              disabled={isSubmitting}
              className="
                h-11 px-5 rounded-xl bg-blue-600 text-white font-semibold
                hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </button>
          </div>

          <div className="h-[max(12px,env(safe-area-inset-bottom))]" />
        </div>
      </div>
    </div>,
    document.body
  );
}
