"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm, type Resolver, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import type { ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useCreateProduct } from "@/hooks/useProducts";
import {
  useCategories,
  useProviders,
  useBranches,
  fetchBranchInfo,
} from "@/hooks/useCatalogs";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";
import { useDisableNumberWheel } from "@/hooks/useDisableNumberWheel";

/* ---------------- helpers ---------------- */

interface NumberFieldMessages {
  required: string;
  invalid: string;
}

const numberField = (messages: NumberFieldMessages) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const n = Number(val);
        return Number.isNaN(n) ? undefined : n;
      }
      if (typeof val === "number") return val;
      return undefined;
    },
    z.union([
      z.number().refine((v) => !Number.isNaN(v), { message: messages.invalid }),
      z.undefined().refine(() => false, { message: messages.required }),
    ])
  );

const normalizeLeadingDot = (s: string) => (s.startsWith(".") ? `0${s}` : s);

const decimalString = (messages: NumberFieldMessages) =>
  z
    .string()
    .min(1, messages.required)
    .transform((v) => v.trim().replace(",", "."))
    .refine((v) => {
      // permite: 12 | 12. | 12.3 | 12.34 | .2 | .20
      return /^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(v);
    }, messages.invalid);

const makeZodResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;

  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as
      | { message?: unknown; error?: unknown }
      | undefined;

    if (data) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "string") return data.error;
      try {
        return JSON.stringify(data);
      } catch {
        /* ignore */
      }
    }
    if (typeof e.message === "string") return e.message;
  }

  return "Ocurrió un error al crear el producto.";
}

function getApiFieldError(err: unknown): { field?: string; message?: string } {
  if (err && typeof err === "object") {
    const e = err as {
      response?: {
        data?: {
          message?: string;
          details?: { field?: string };
        };
      };
    };

    if (e.response?.data?.details?.field) {
      return {
        field: e.response.data.details.field,
        message: e.response.data.message,
      };
    }
  }
  return {};
}

const sanitizeDecimal = (raw: string) => {
  const v = raw.replace(/[^\d.,]/g, "");
  const parts = v.split(/[.,]/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

/* ---------------- unidades (UI) ---------------- */

export const UNIDADES = [
  { id: 3, code: "PIEZA", label: "Pieza" },
  { id: 4, code: "KG", label: "Kilogramo" },
  { id: 5, code: "LITRO", label: "Litro" },
  { id: 6, code: "METRO", label: "Metro" },
] as const;

export type UnidadMedidaCodigo = (typeof UNIDADES)[number]["code"];
const UNIDAD_CODES = UNIDADES.map((u) => u.code) as readonly UnidadMedidaCodigo[];

/* ---------------- schema ---------------- */

const baseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  sku: z.string().min(1, "SKU requerido"),
  codigoBarras: z.string().min(1, "Código de barras requerido"),
  description: z.string().optional().default(""),
  purchasePrice: decimalString({
    required: "Indica el precio de compra",
    invalid: "El precio debe ser un decimal válido",
  }),
  salePrice: decimalString({
    required: "Indica el precio de venta",
    invalid: "El precio debe ser un decimal válido",
  }),
  categoryId: numberField({
    required: "Selecciona una categoría",
    invalid: "Categoría inválida o no encontrada",
  }),
  providerId: numberField({
    required: "Selecciona un proveedor",
    invalid: "Proveedor inválido",
  }),
  branchId: z.number().optional(),

  // ✅ BACKEND: unidadMedidaCodigo (String)
  unidadMedidaCodigo: z
    .string()
    .min(1, "Selecciona una unidad")
    .refine((v): v is UnidadMedidaCodigo => UNIDAD_CODES.includes(v as UnidadMedidaCodigo), {
      message: "Unidad inválida",
    }),
});

const superSchema = baseSchema.extend({
  branchId: numberField({
    required: "Selecciona una sucursal",
    invalid: "Sucursal inválida o no encontrada",
  }),
});

type FormValues = z.infer<typeof baseSchema> & { branchId?: number };

/* ---------------- toast ---------------- */

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
        <div className={`${color} text-white shadow-xl rounded-lg px-4 py-3 max-w-sm flex gap-3`}>
          <span>{toast.message}</span>
          <button type="button" onClick={onClose} className="ml-auto rounded px-2 hover:bg-white/15">
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- component ---------------- */

export default function AddProductButton({
  onCreated,
  className,
}: {
  onCreated?: () => void;
  className?: string;
}) {
  useDisableNumberWheel();
  const { user, hasRole, token } = useAuth() as unknown as {
    user?: {
      id: number;
      username: string;
      role: string;
      businessType: number;
      businessTypeId?: number;
      branchId: number;
    };
    hasRole?: (r: string) => boolean;
    token: string;
  };

  const isSuper = hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN";
  const isAdmin = hasRole ? hasRole("ADMIN") : user?.role === "ADMIN";

  const { mutateAsync, isPending } = useCreateProduct();
  const [open, setOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // SUPER_ADMIN: sucursal elegida y BT derivado
  const [derivedBT, setDerivedBT] = useState<number | null>(null);

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    const firstKey = Object.keys(errors)[0] as keyof FormValues | undefined;
    if (!firstKey) return;

    const firstError = errors[firstKey];
    let msg = "Revisa los campos requeridos.";

    if (firstError && "message" in firstError && typeof firstError.message === "string") {
      msg = firstError.message;
    }

    const el = document.querySelector(`[name="${String(firstKey)}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus?.(), 80);
    }

    setToast({ type: "error", message: msg });
  };

  /* catálogos */
  const { data: categories = [], isLoading: categoriesLoading } = useCategories({
    businessTypeId: isSuper ? (derivedBT ?? undefined) : undefined,
  });

  const { data: providers = [], isLoading: providersLoading } = useProviders({
    isSuper,
    businessTypeId: isSuper ? derivedBT ?? undefined : undefined,
    branchId: !isSuper ? user?.branchId : undefined,
  });

  const { data: branches = [], isLoading: branchesLoading } = useBranches({
    isSuper,
    businessTypeId: isSuper ? (derivedBT ?? undefined) : user?.businessTypeId ?? undefined,
    oneBranchId: !isSuper ? user?.branchId ?? null : null,
  });

  /* form */
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
    setFocus,
    watch,
  } = useForm<FormValues>({
    resolver: makeZodResolver<FormValues>(isSuper ? superSchema : baseSchema),
    defaultValues: {
      name: "",
      sku: "",
      codigoBarras: "",
      description: "",
      purchasePrice: "",
      salePrice: "",
      unidadMedidaCodigo: "PIEZA", // ✅ default por código
      categoryId: undefined,
      providerId: undefined,
      branchId: isSuper ? undefined : user?.branchId,
    },
  });

  const branchId = watch("branchId");

  useEffect(() => {
    if (!open) return;
    if (!isSuper) return;
    if (!branchId) {
      setDerivedBT(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const info = await fetchBranchInfo(branchId, token);
        if (alive) setDerivedBT(info.businessTypeId);
      } catch {
        if (alive) setDerivedBT(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, isSuper, branchId, token]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!isSuper) return;
    setValue("categoryId", undefined, { shouldDirty: true });
    setValue("providerId", undefined, { shouldDirty: true });
  }, [branchId, isSuper, setValue]);

  const resetForm = useCallback(() => {
    reset({
      name: "",
      sku: "",
      codigoBarras: "",
      description: "",
      purchasePrice: "",
      salePrice: "",
      unidadMedidaCodigo: "PIEZA",
      categoryId: undefined,
      providerId: undefined,
      branchId: isSuper ? undefined : user?.branchId,
    });
  }, [reset, isSuper, user?.branchId]);

  const onClose = useCallback(() => {
    setOpen(false);
    reset({
      name: "",
      sku: "",
      codigoBarras: "",
      description: "",
      purchasePrice: "",
      salePrice: "",
      unidadMedidaCodigo: "PIEZA",
      categoryId: undefined,
      providerId: undefined,
      branchId: isSuper ? undefined : user?.branchId,
    });
    setDerivedBT(null);
  }, [reset, isSuper, user?.branchId]);

  /* focus + escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => setFocus("name"));
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [open, setFocus, onClose]);

  type CreateArg = Parameters<typeof mutateAsync>[0];

  const onSubmit = async (values: FormValues) => {
    if (isSuper && !values.branchId) {
      setToast({ type: "error", message: "Selecciona una sucursal primero." });
      return;
    }

    const purchase = Number(normalizeLeadingDot(values.purchasePrice.replace(",", ".")));
    const sale = Number(normalizeLeadingDot(values.salePrice.replace(",", ".")));

    // ✅ BACKEND: unidadMedidaCodigo
    const payload: CreateArg = {
      name: values.name,
      sku: values.sku,
      codigoBarras: values.codigoBarras,
      description: values.description ?? "",
      purchasePrice: purchase,
      salePrice: sale,
      categoryId: values.categoryId,
      providerId: values.providerId,
      unidadMedidaCodigo: values.unidadMedidaCodigo,
      ...(isSuper && values.branchId ? { branchId: values.branchId } : {}),
    } as unknown as CreateArg;

    try {
      await mutateAsync(payload);
      setToast({ type: "success", message: "Producto creado correctamente." });
      onClose();
      onCreated?.();
    } catch (err) {
      const apiError = getApiFieldError(err);

      if (apiError.field && apiError.message) {
        setError(apiError.field as keyof FormValues, {
          type: "server",
          message: apiError.message,
        });
        setFocus(apiError.field as keyof FormValues);
        return;
      }

      setToast({ type: "error", message: getErrorMessage(err) });
    }
  };

  const disableCatsProv = useMemo(() => isSuper && !branchId, [isSuper, branchId]);

  return (
    <>
      {(isSuper || isAdmin) && (
        <>
          {/* MOBILE FAB */}
          <button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className={`
              md:hidden
              group inline-flex items-center justify-center
              h-12 w-12 rounded-full
              bg-blue-600 text-white
              shadow-lg hover:bg-blue-700
              active:scale-[0.95] transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              fixed bottom-[calc(110px+env(safe-area-inset-bottom))] right-4 z-40
              md:static md:w-auto md:h-10 md:px-4 md:rounded-lg
            `}
            aria-label="Agregar producto"
          >
            <span className="text-2xl leading-none">＋</span>
          </button>

          {/* DESKTOP BUTTON */}
          <button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className={`
              hidden md:inline-flex items-center gap-2
              h-10 px-4
              rounded-lg
              bg-blue-600 text-white font-semibold
              shadow-sm hover:shadow-md hover:bg-blue-700
              active:scale-[0.98] transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${className ?? ""}
            `}
          >
            <span className="text-lg leading-none">＋</span>
            <span className="text-sm">Agregar producto</span>
          </button>
        </>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000] isolate">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[min(100vw-1rem,42rem)] sm:w-[min(100vw-2rem,44rem)]
                         max-h-[85vh] rounded-xl bg-white shadow-2xl
                         flex flex-col"
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur z-10">
                <h2 className="text-lg font-semibold">Nuevo producto</h2>
              </div>

              {/* Body */}
              <form
                onSubmit={handleSubmit(onSubmit, onInvalid)}
                className="px-4 sm:px-6 py-4 overflow-y-auto"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Nombre */}
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm">Nombre</span>
                    <input className="border rounded px-3 py-2" {...register("name")} />
                    {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
                  </label>

                  {/* SKU */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">SKU</span>
                    <input
                      className="border rounded px-3 py-2 uppercase"
                      {...register("sku", {
                        setValueAs: (v) => (typeof v === "string" ? v.toUpperCase() : v),
                      })}
                    />
                    {errors.sku && <p className="text-red-600 text-xs">{errors.sku.message}</p>}
                  </label>

                  {/* Código de barras */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Código de barras</span>

                    <div className="flex gap-2">
                      <input
                        className="flex-1 border rounded px-3 py-2"
                        inputMode="numeric"
                        autoComplete="off"
                        {...register("codigoBarras")}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D+/g, "");
                          setValue("codigoBarras", onlyDigits, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />

                      <button
                        type="button"
                        className="px-3 py-2 rounded bg-green-600 text-white"
                        onClick={() => setShowScanner(true)}
                      >
                        📷
                      </button>
                    </div>

                    {errors.codigoBarras && (
                      <p className="text-red-600 text-xs">{errors.codigoBarras.message}</p>
                    )}
                  </label>

                  {/* Descripción */}
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm">Descripción</span>
                    <textarea
                      rows={3}
                      className="border rounded px-3 py-2 resize-none"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-red-600 text-xs">{errors.description.message}</p>
                    )}
                  </label>

                  {/* Precio compra */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Precio compra</span>
                    <input
                      type="text"
                      data-no-wheel="true"
                      inputMode="decimal"
                      autoComplete="off"
                      className="border rounded px-3 py-2"
                      {...register("purchasePrice")}
                      onChange={(e) => {
                        const cleaned = sanitizeDecimal(e.target.value);
                        const normalized = normalizeLeadingDot(cleaned);
                        setValue("purchasePrice", normalized, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      onBlur={(e) => {
                        // aquí ya normalizas bonito
                        const v = e.target.value.trim().replace(",", ".");
                        const normalized = normalizeLeadingDot(v); // ".2" -> "0.2"
                        setValue("purchasePrice", normalized, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      
                    />
                    {errors.purchasePrice && (
                      <p className="text-red-600 text-xs">{errors.purchasePrice.message}</p>
                    )}
                  </label>

                  {/* Precio venta */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Precio venta</span>
                    <input
                      type="text"
                      data-no-wheel="true"
                      inputMode="decimal"
                      autoComplete="off"
                      className="border rounded px-3 py-2"
                      {...register("salePrice")}
                      onChange={(e) => {
                        const cleaned = sanitizeDecimal(e.target.value);
                        const normalized = normalizeLeadingDot(cleaned);
                        setValue("salePrice", normalized, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      onBlur={(e) => {
                      // aquí ya normalizas bonito
                      const v = e.target.value.trim().replace(",", ".");
                      const normalized = normalizeLeadingDot(v); // ".2" -> "0.2"
                      setValue("purchasePrice", normalized, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    />
                    {errors.salePrice && (
                      <p className="text-red-600 text-xs">{errors.salePrice.message}</p>
                    )}
                  </label>

                  {/* ✅ Unidad de medida (CODIGO) */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Unidad de medida</span>
                    <select className="border rounded px-3 py-2" {...register("unidadMedidaCodigo")}>
                      <option value="">Selecciona…</option>
                      {UNIDADES.map((u) => (
                        <option key={u.code} value={u.code}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    {errors.unidadMedidaCodigo && (
                      <p className="text-red-600 text-xs">{errors.unidadMedidaCodigo.message}</p>
                    )}
                  </label>

                  {/* Sucursal (SUPER_ADMIN) */}
                  {isSuper && (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-sm">Sucursal</span>
                      <select
                        className="border rounded px-3 py-2"
                        disabled={branchesLoading}
                        value={watch("branchId") ?? ""}
                        onChange={(e) => {
                          const newValue = e.target.value === "" ? undefined : Number(e.target.value);
                          reset({
                            ...watch(),
                            branchId: newValue,
                          });
                        }}
                      >
                        <option value="">{branchesLoading ? "Cargando…" : "Selecciona…"}</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {errors.branchId && (
                        <p className="text-red-600 text-xs">{errors.branchId.message}</p>
                      )}
                    </label>
                  )}

                  {/* Categoría */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Categoría</span>
                    <select
                      disabled={disableCatsProv || categoriesLoading}
                      className={`border rounded px-3 py-2 ${
                        disableCatsProv || categoriesLoading ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      {...register("categoryId")}
                    >
                      <option value="">
                        {disableCatsProv
                          ? "Selecciona una sucursal…"
                          : categoriesLoading
                          ? "Cargando…"
                          : "Selecciona…"}
                      </option>

                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-red-600 text-xs">{errors.categoryId.message}</p>
                    )}
                  </label>

                  {/* Proveedor */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Proveedor</span>
                    <select
                      {...register("providerId")}
                      disabled={providersLoading}
                      className="border rounded px-3 py-2 disabled:bg-slate-100"
                    >
                      <option value="">{providersLoading ? "Cargando…" : "Selecciona…"}</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.providerId && (
                      <p className="text-red-600 text-xs">{errors.providerId.message}</p>
                    )}
                  </label>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 -mx-4 sm:-mx-6 mt-4 bg-white/95 backdrop-blur border-t px-4 sm:px-6 py-3">
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                    >
                      {isPending ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>

                {/* Scanner overlay */}
                {showScanner && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[12000] flex items-center justify-center">
                    <div className="bg-white rounded-xl p-4 w-[95%] max-w-md shadow-xl">
                      <h2 className="text-xl font-semibold mb-3">Escanear código de barras</h2>

                      <BarcodeCameraScanner
                        onResult={(code) => {
                          const onlyDigits = String(code).replace(/\D+/g, "");
                          setShowScanner(false);
                          setValue("codigoBarras", onlyDigits, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        onError={(e) => console.error("Error escáner:", e)}
                      />

                      <button
                        onClick={() => setShowScanner(false)}
                        className="mt-4 w-full bg-red-600 text-white py-2 rounded-xl"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
