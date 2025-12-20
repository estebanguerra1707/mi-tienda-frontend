import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
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
  CatalogItem,
} from "@/hooks/useCatalogs";
import type { FieldErrors } from "react-hook-form";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";


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
/* ---------- schema ---------- */
const baseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  sku: z.string().min(1, "SKU requerido"),
  codigoBarras: z.string().min(1, "Código de barras requerido"),
  description: z.string().optional().default(""),
 purchasePrice: numberField({
  required: "Indica el precio de compra",
  invalid: "El precio debe ser un número válido",
}),
salePrice: numberField({
  required: "Indica el precio de venta",
  invalid: "El precio debe ser un número válido",
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
});

const superSchema = baseSchema.extend({
  branchId: numberField({
    required: "Selecciona una sucursal",
    invalid: "Sucursal inválida o no encontrada",
  }),
});

type FormValues = z.infer<typeof baseSchema> & { branchId?: number };

const makeZodResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;

  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;

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

/* Toast mini */
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



/* ---------- componente ---------- */
export default function AddProductButton({
  onCreated,
  className,
}: {
  onCreated?: () => void;
  className?: string;
}) {
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
  // obtiene la primera clave con error
  const firstKey = Object.keys(errors)[0] as keyof FormValues | undefined;
  if (!firstKey) return;

  // obtiene el primer error
  const firstError = errors[firstKey];
  let msg = "Revisa los campos requeridos.";

  if (firstError && "message" in firstError && typeof firstError.message === "string") {
    msg = firstError.message;
  }

  // intenta enfocar y desplazar al primer campo con error
  const el = document.querySelector(`[name="${String(firstKey)}"]`) as HTMLElement | null;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.focus?.(), 80);
  }

  setToast({ type: "error", message: msg });
};


  // catálogos por rol / BT
const categories = useCategories({
  businessTypeId: isSuper ? (derivedBT ?? undefined) : undefined,
});

const providers = useProviders({
  isSuper,
  businessTypeId: isSuper ? derivedBT ?? undefined : undefined,
  branchId: !isSuper ? user?.branchId : undefined,
});


const branches = useBranches({
  isSuper,
  businessTypeId: isSuper ? (derivedBT ?? undefined) : user?.businessTypeId ?? undefined,
  oneBranchId: !isSuper ? user?.branchId ?? null : null,
});

  // formulario
 const {
  register,
  handleSubmit,
  reset,
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
    purchasePrice: undefined,
    salePrice: undefined,
    categoryId: undefined,
    providerId: undefined,
    branchId: isSuper ? undefined : user?.branchId, // <-- CLAVE
  },
});

  const branchId = watch("branchId");

  useEffect(() => {
  let alive = true;
  (async () => {
    if (!isSuper) return;
    if (!branchId) {
      setDerivedBT(null);
      return;
    }
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
}, [isSuper, branchId, token]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const resetForm = useCallback(() => {
  reset({
    name: "",
    sku: "",
    codigoBarras: "",
    description: "",
    purchasePrice: undefined,
    salePrice: undefined,
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
    purchasePrice: undefined,
    salePrice: undefined,
    categoryId: undefined,
    providerId: undefined,
    branchId: isSuper ? undefined : user?.branchId, // <-- NO borrar
  });
  setDerivedBT(null);
}, [reset, isSuper, user?.branchId]);

  // focus inicial + Escape (igual que Edit)
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

    const payload: CreateArg = {
      name: values.name,
      sku: values.sku,
      codigoBarras: values.codigoBarras,
      description: values.description ?? "",
      purchasePrice: values.purchasePrice,
      salePrice: values.salePrice,
      categoryId: values.categoryId,
      providerId: values.providerId,
      ...(isSuper && values.branchId ? { branchId: values.branchId } : {}),
    } as unknown as CreateArg;

    try {
      await mutateAsync(payload);
      setToast({ type: "success", message: "Producto creado correctamente." });
      onClose();
      onCreated?.();
    } catch (err) {
      setToast({ type: "error", message: getErrorMessage(err) });
    }
  };

  const disableCatsProv = isSuper && !branchId;

  return (
    <>
     {(isSuper || isAdmin) && (
     <button
        className={`px-3 py-2 rounded bg-blue-600 text-white ${className ?? ""}`}
        onClick={() => {
           resetForm(); 
            setOpen(true);
          }}
        >
          Agregar producto
        </button>
     )}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000] isolate">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            {/* Caja centrada como en Edit */}
            <div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[min(100vw-1rem,42rem)] sm:w-[min(100vw-2rem,44rem)]
                         max-h-[85vh] rounded-xl bg-white shadow-2xl
                         flex flex-col"
            >
              {/* Header sticky */}
              <div className="px-4 sm:px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur z-10">
                <h2 className="text-lg font-semibold">Nuevo producto</h2>
              </div>

              {/* Body scrollable */}
             <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="px-4 sm:px-6 py-4 overflow-y-auto">
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
                    <input className="border rounded px-3 py-2" {...register("sku")} />
                    {errors.sku && <p className="text-red-600 text-xs">{errors.sku.message}</p>}
                  </label>

                  {/* Código de barras */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Código de barras</span>

                    <div className="flex gap-2">
                      <input
                        className="flex-1 border rounded px-3 py-2"
                        {...register("codigoBarras")}
                      />

                      {/* botón que abre el scanner */}
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
                      className="border rounded px-3 py-2 resize-y"
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
                    type="number"
                    step="0.01"
                    className="border rounded px-3 py-2"
                    {...register("purchasePrice", { valueAsNumber: true })}
                  />
                  {errors.purchasePrice && (
                    <p className="text-red-600 text-xs">{errors.purchasePrice.message}</p>
                  )}
                </label>

                {/* Precio venta */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Precio venta</span>
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-3 py-2"
                    {...register("salePrice", { valueAsNumber: true })}
                  />
                  {errors.salePrice && (
                    <p className="text-red-600 text-xs">{errors.salePrice.message}</p>
                  )}
                </label>
                  {/* Sucursal (solo SUPER_ADMIN) */}
                  {isSuper && (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-sm">Sucursal</span>
                        <select
                          className="border rounded px-3 py-2"
                          value={watch("branchId") ?? ""}
                          onChange={(e) => {
                            const newValue = e.target.value === "" ? undefined : Number(e.target.value);
                            reset({
                              ...watch(),
                              branchId: newValue,
                            });
                          }}
                        >
                          <option value="">Selecciona…</option>
                          {branches.data.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
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
                      disabled={disableCatsProv}
                      className={`border rounded px-3 py-2 ${
                        disableCatsProv ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      {...register("categoryId")}
                    >
                      <option value="">
                        {disableCatsProv ? "Selecciona una sucursal…" : "Selecciona…"}
                      </option>
                      {categories.data.map((c: CatalogItem) => (
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
                    className="border rounded px-3 py-2 disabled:bg-slate-100"
                    {...register("providerId")}
                  >
                    <option value="">
                      {disableCatsProv ? "Selecciona proveedor" : "Selecciona…"}
                    </option>
                    {providers.data.map((p: CatalogItem) => (
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

                {/* Footer sticky (igual que Edit) */}
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
                {showScanner && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[12000] flex items-center justify-center">
                    <div className="bg-white rounded-xl p-4 w-[95%] max-w-md shadow-xl">
                      <h2 className="text-xl font-semibold mb-3">Escanear código de barras</h2>

                      <BarcodeCameraScanner
                        onResult={(code) => {
                          setShowScanner(false);

                          // llenar código de barras
                          reset({
                            ...watch(),
                            codigoBarras: code,
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
