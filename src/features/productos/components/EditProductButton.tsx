import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
import { z, type ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProduct } from "@/features/productos/useMutations";
import type { Product, ProductsQuery } from "@/features/productos/api";

import { getInventarioDeProducto } from "@/features/productos/inventario.service";
import { upsertInventory } from "@/features/inventario/api"; 


import {
  useCategories,
  useProviders,
  useBranches,
  fetchBranchInfo,
} from "@/hooks/useCatalogs";

const baseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  sku: z.string().min(1, "SKU requerido"),
  codigoBarras: z.string().min(1, "Código de barras requerido"),
  description: z.string().optional().default(""),
  purchasePrice: z.coerce.number().nonnegative("Precio de compra inválido"),
  salePrice: z.coerce.number().nonnegative("Precio de venta inválido"),
  categoryId: z.coerce.number().int().min(1, "Categoría requerida"),
  providerId: z.coerce.number().int().min(1, "Proveedor requerido"),
  branchId: z.coerce.number().int().optional(),
  stock: z.coerce.number().int().min(0, "Stock inválido").optional().default(0),
   minStock: z.coerce.number().int().min(0).optional().default(0),
  maxStock: z.coerce.number().int().min(0).optional().default(0),
});

type EditableProduct =
  Pick<
    Product,
    | "id"
    | "name"
    | "sku"
    | "codigoBarras"
    | "description"
    | "purchasePrice"
    | "salePrice"
    | "categoryId"
    | "providerId"
  > & {
    branchId?: number | null;
  };

const superSchema = baseSchema.extend({
  branchId: z.coerce.number().int().min(1, "Sucursal requerida"),
});

type FormValues = z.infer<typeof baseSchema> & { branchId?: number };

const makeResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as (s: ZodSchema<T>) => Resolver<T>)(schema);


function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof e.message === "string") return e.message;
  }
  return "Ocurrió un error al actualizar el producto.";
}

 export default function EditProductButton({
   product,
   onUpdated,
   paramsActuales,
 }: {
   product: EditableProduct;
   onUpdated?: () => void;
   paramsActuales?: ProductsQuery;

 }) {
 const { mutateAsync, isPending } = useUpdateProduct(paramsActuales);
 const auth = useAuth();
 
  const isSuper = auth.hasRole ? auth.hasRole("SUPER_ADMIN") : auth.user?.role === "SUPER_ADMIN";

  // Derivado de la sucursal elegida
  const [derivedBT, setDerivedBT] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // schema & form
  const schema: ZodSchema<FormValues> = useMemo(
    () => (isSuper ? superSchema : baseSchema),
    [isSuper]
  );
  const resolver = useMemo<Resolver<FormValues>>(() => makeResolver<FormValues>(schema), [schema]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setFocus,
    watch,
    setValue, 
  } = useForm<FormValues>({

    resolver,
    defaultValues: {
      name: product.name,
      sku: product.sku,
      codigoBarras: product.codigoBarras,
      description: product.description ?? "",
      stock: 0,
      purchasePrice: product.purchasePrice ?? 0,
      salePrice: product.salePrice ?? 0,
      categoryId: product.categoryId ?? 0,
      providerId: product.providerId ?? 0,
      branchId: (auth.user?.branchId ?? product.branchId) ?? undefined,
      minStock: 0,
      maxStock: 0, 
    },
  });



  // Observa la sucursal elegida en el form (o la inicial del producto)
  const watchedBranchId = watch("branchId"); // number | undefined
const branches = useBranches({
  isSuper,
  businessTypeId: isSuper
    ? undefined                // SUPER_ADMIN ve todas
    : auth.user?.businessType ?? undefined,  // ADMIN / VENDOR
  oneBranchId: isSuper
    ? null                     // super no filtra por sucursal específica
    : auth.user?.branchId ?? product.branchId ?? null,
});

const effectiveBranchId = useMemo<number | undefined>(() => {
  if (isSuper) return watchedBranchId ?? undefined;
  return (auth.user?.branchId ?? product.branchId) ?? undefined;
}, [isSuper, watchedBranchId, auth.user?.branchId, product.branchId]);

// Nombre legible para mostrar cuando NO es super
const branchName = useMemo(() => {
  if (!effectiveBranchId) return "—";
  const found = branches.data.find(b => b.id === effectiveBranchId);
  return found?.name ?? "—";
}, [branches.data, effectiveBranchId]);



const defaultFormValues = useMemo(() => ({
  name: product.name,
  sku: product.sku,
  codigoBarras: product.codigoBarras,
  description: product.description ?? "",
  purchasePrice: product.purchasePrice ?? 0,
  salePrice: product.salePrice ?? 0,
  categoryId: product.categoryId ?? 0,
  providerId: product.providerId ?? 0,
  branchId: (auth.user?.branchId ?? product.branchId) ?? undefined,
}), [product, auth.user?.branchId]);



useEffect(() => {
  if (!open) return;

  // reset inicial
 reset({
  ...defaultFormValues,
  purchasePrice: Number(defaultFormValues.purchasePrice ?? 0),
  salePrice: Number(defaultFormValues.salePrice ?? 0),
});
  if (!effectiveBranchId) {
    if (isSuper) setDerivedBT(null);
    setValue("stock", 0);
    setValue("minStock", 0);
    setValue("maxStock", 0);
    return;
  }

  let alive = true;

  (async () => {
  try {
    const [btInfo, inv] = await Promise.all([
      isSuper
        ? fetchBranchInfo(Number(effectiveBranchId), auth.token ?? "")
        : null,
      getInventarioDeProducto(Number(effectiveBranchId), product.id)
        .catch(() => null),
    ]);

    if (!alive) return;

    if (isSuper) setDerivedBT(btInfo?.businessTypeId ?? null);


    // Y seteamos los valores en el formulario
    setValue("stock", inv?.stock ?? 0);
    setValue("minStock", inv?.minStock ?? 0);
    setValue("maxStock", inv?.maxStock ?? 0);

  } catch {
    if (!alive) return;
    if (isSuper) setDerivedBT(null);

    setValue("stock", 0);
    setValue("minStock", 0);
    setValue("maxStock", 0);
  }
})();

  return () => { alive = false };
}, [
  open,
  reset,
  defaultFormValues,
  effectiveBranchId,
  isSuper,
  auth.token,
  product.id,
  setValue
]);


useEffect(() => {
  if (!isSuper) {
    // asegura que el hidden lleve el branchId correcto
    setValue("branchId", effectiveBranchId as unknown as number | undefined, { shouldDirty: false });
  }
}, [isSuper, effectiveBranchId, setValue]);

  // Catálogos (filtrados por BT derivado cuando aplica)
const cats = useCategories({
  businessTypeId: isSuper ? (derivedBT ?? undefined) : (auth.user?.businessType ?? undefined),
  // branchId: no lo pases; el hook lo resuelve con el auth si no eres super
});
const provs = useProviders({
  businessTypeId: isSuper ? (derivedBT ?? undefined) : (auth.user?.businessType ?? undefined),
});

const onClose = useCallback(() => {
  setOpen(false);
}, []);


  // Escape + focus inicial
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

const onSubmit = async (values: FormValues) => {
  try {
    // 1) actualiza producto
    const payload = {
      name: values.name,
      sku: values.sku,
      codigoBarras: values.codigoBarras,
      description: values.description ?? "",
      purchasePrice: Number(values.purchasePrice ?? 0),
      salePrice: Number(values.salePrice ?? 0),
      categoryId: Number(values.categoryId),
      providerId: Number(values.providerId),

      // 👇 SIEMPRE MANDAR stock
      stock: Number(values.stock ?? 0),

      // 👇 SIEMPRE MANDAR branchId (super o no)
      branchId: isSuper
        ? Number(values.branchId)
        : Number(auth.user?.branchId ?? product.branchId),
    };
    await mutateAsync({ id: product.id, payload });

    // 2) upsert inventario para la sucursal actual
    const branchId = isSuper ? values.branchId : (auth.user?.branchId ?? product.branchId);
    if (branchId) {
      await upsertInventory({
      productId: product.id,
      branchId: Number(branchId),
      quantity: Number(values.stock ?? 0), // <-- ESTE ES EL CORRECTO
      minStock: Number(values.minStock ?? 0),
      maxStock: Number(values.maxStock ?? 0),
});
    }

    setToast({ type: "success", message: "Producto actualizado." });
    onClose();
    onUpdated?.();
  } catch (err) {
    setToast({ type: "error", message: getErrorMessage(err) });
  }
};

  // UI helpers
  const disableCatsProv = isSuper && !watchedBranchId;

  return (
    <>
      <button
        type="button"
        className="px-2 py-1 text-xs rounded border hover:bg-slate-100"
        onClick={() => setOpen(true)}
        title="Editar"
      >
        Editar
      </button>

      {/* Toast */}
      {toast &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[11000]">
            <div
              className={`px-3 py-2 rounded text-white shadow ${
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
          <div className="fixed inset-0 z-[10000] isolate">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />

            {/* Sheet */}
            <div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[min(100vw-1rem,42rem)] sm:w-[min(100vw-2rem,44rem)]
                         max-h-[85vh] rounded-xl bg-white shadow-2xl
                         flex flex-col overflow-hidden"
            >
              {/* Header sticky */}
              <div className="px-4 sm:px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur z-10">
                <h2 className="text-lg font-semibold">Editar producto</h2>
              </div>

              {/* Body scrollable */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="px-4 sm:px-6 py-4 pb-0 overflow-y-auto"
              >
                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Nombre */}
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm">Nombre</span>
                    <input
                      className="border rounded px-3 py-2"
                      {...register("name")}
                      inputMode="text"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-xs">{errors.name.message}</p>
                    )}
                  </label>

                  {/* SKU */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">SKU</span>
                    <input className="border rounded px-3 py-2" {...register("sku")} />
                    {errors.sku && (
                      <p className="text-red-600 text-xs">{errors.sku.message}</p>
                    )}
                  </label>

                  {/* Código de barras */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Código de barras</span>
                    <input
                      className="border rounded px-3 py-2"
                      {...register("codigoBarras")}
                      inputMode="numeric"
                    />
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
                      inputMode="decimal"
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
                  
                    {/* Stock (solo lectura, viene del inventario por sucursal) */}
                    <label className="flex flex-col gap-1">
                    <span className="text-sm">Stock</span>
                    <input
                        type="number"
                        inputMode="numeric"
                        className="border rounded px-3 py-2"
                         {...register("stock", { valueAsNumber: true })} readOnly
                    />
                    {errors.stock && (
                        <p className="text-red-600 text-xs">{errors.stock.message}</p>
                    )}
                    </label>
                  {/* Min Stock */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Stock mínimo</span>
                    <input
                      type="number"
                      className="border rounded px-3 py-2"
                      {...register("minStock", { valueAsNumber: true })}
                    />
                  </label>

                  {/* Max Stock */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Stock máximo</span>
                    <input
                      type="number"
                      className="border rounded px-3 py-2"
                      {...register("maxStock", { valueAsNumber: true })}
                    />
                  </label>
                  {/* Categoría */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">Categoría</span>
                    <select
                      className="border rounded px-3 py-2"
                      {...register("categoryId", { valueAsNumber: true })}
                      disabled={cats.loading || disableCatsProv}
                    >
                      <option value="">Selecciona…</option>
                      {cats.data.map((c) => (
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
                      className="border rounded px-3 py-2"
                      {...register("providerId", { valueAsNumber: true })}
                      disabled={provs.loading || disableCatsProv}
                    >
                      <option value="">Selecciona…</option>
                      {provs.data.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.providerId && (
                      <p className="text-red-600 text-xs">{errors.providerId.message}</p>
                    )}
                  </label>

                  {/* Sucursal (solo SUPER_ADMIN) */}
                  {isSuper ? (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-sm">Sucursal</span>
                        <select
                        className="border rounded px-3 py-2"
                        {...register("branchId", { valueAsNumber: true })}
                        disabled={branches.loading}
                        >
                        <option value="">Selecciona…</option>
                        {branches.data.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                        </select>
                        {errors.branchId && <p className="text-red-600 text-xs">{errors.branchId.message}</p>}
                    </label>
                    ) : (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-sm">Sucursal</span>
                        {/* Solo mostramos el nombre */}
                        <input
                        className="border rounded px-3 py-2 bg-slate-50"
                        value={branchName}
                        readOnly
                        tabIndex={-1}
                        />
                        {/* Y enviamos el branchId como hidden */}
                        <input
                        type="hidden"
                        {...register("branchId", { valueAsNumber: true })}
                        value={effectiveBranchId ?? ""}   // mejor 'value' que 'defaultValue' para mantenerlo sincronizado
                        readOnly
                        />
                    </label>
                    )}
                </div>

                {/* Footer sticky */}
                <div className="sticky bottom-0 z-10 mt-4 bg-white/95 backdrop-blur border-t px-4 sm:px-6 py-3">
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded border"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                    >
                      {isPending ? "Guardando..." : "Guardar cambios"}
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
