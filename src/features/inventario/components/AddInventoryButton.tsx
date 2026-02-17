import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useForm, type Resolver } from "react-hook-form";
import { z, type ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/hooks/useAuth";
import { useBranches, fetchBranchInfo } from "@/hooks/useCatalogs";
import { getErrorMessage } from "../getErrorMessage";
import { useCreateInventory } from "../useMutations";
import type { InventoryCreate } from "../api";

import { useAdvancedProducts } from "@/features/productos/useAdvancedProducts";
import { buildFiltro } from "@/features/productos/productos.api";
import type { Product } from "@/features/productos/api";
import { type InventarioOwnerType } from "../api";
import { PackagePlus } from "lucide-react";
import { useDisableNumberWheel } from "@/hooks/useDisableNumberWheel";


type ProductLite = Pick<Product, "id" | "name" | "sku">;

type Role = "ADMIN" | "VENDOR" | "SUPER_ADMIN";

const schema = z.object({
  productId: z.coerce.number().int().min(1, "Producto requerido"),
  branchId: z.coerce.number().int().optional(),
  quantity: z.coerce.number().int().min(0, "Cantidad inválida"),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
  isStockCritico: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const makeResolver = <T extends object>(s: ZodSchema<T>): Resolver<T> =>
  (zodResolver as (s: ZodSchema<T>) => Resolver<T>)(s);

type Props = {
  onCreated?: () => void;
  defaultProductId?: number;
  autoOpen?: boolean;
  variant?: "primary" | "link";
};

export default function AddInventoryButton({
  onCreated,
  defaultProductId,
  autoOpen = false,
  variant = "primary",
}: Props) {
  useDisableNumberWheel();
  const { mutateAsync, isPending } = useCreateInventory();

  const auth = useAuth() as {
    user?: { role?: Role; branchId?: number | null; businessType?: number | null };
    hasRole?: (r: Role) => boolean;
    token?: string;
  };

  const isSuper =
    auth.hasRole ? auth.hasRole("SUPER_ADMIN") : auth.user?.role === "SUPER_ADMIN";

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [branchName, setBranchName] = useState<string>("");

  const { data: branches = [], isLoading: branchesLoading } = useBranches({
    isSuper,
    businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
    oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
  });

  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    isSuper ? undefined : auth.user?.branchId ?? undefined
  );

  const [usesOwnerInventory, setUsesOwnerInventory] = useState(false);
  const [ownerType, setOwnerType] = useState<InventarioOwnerType>("PROPIO");

  const [derivedBT, setDerivedBT] = useState<number | null>(null);

  const effectiveBranchId = isSuper ? selectedBranchId : auth.user?.branchId ?? undefined;

  // ----- form -----
  const resolver = useMemo(() => makeResolver(schema), []);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: { isStockCritico: false },
  });

  const watchedBranchId = watch("branchId");

  const openModal = useCallback(() => {
    setOpen(true);
    if (defaultProductId) {
      setValue("productId", defaultProductId, { shouldDirty: false });
    }
  }, [defaultProductId, setValue]);

  const onClose = useCallback(() => {
    setOpen(false);
    setBranchName("");
    setUsesOwnerInventory(false);
    setOwnerType("PROPIO");
    setDerivedBT(null);
    reset();
  }, [reset]);

  // autoOpen
  useEffect(() => {
    if (autoOpen && defaultProductId) {
      setOpen(true);
      setValue("productId", defaultProductId, { shouldDirty: false });
    }
  }, [autoOpen, defaultProductId, setValue]);

  // bind defaults when open
  useEffect(() => {
    if (!open) return;

    if (!isSuper) {
      const bid = auth.user?.branchId ?? undefined;
      setValue("branchId", bid, { shouldDirty: false });
      setSelectedBranchId(bid);
    } else {
      setValue("branchId", undefined, { shouldDirty: false });
      setSelectedBranchId(undefined);
    }
  }, [open, isSuper, auth.user?.branchId, setValue]);

  // keep selectedBranchId synced to RHF for super
  useEffect(() => {
    if (!open) return;
    if (!isSuper) return;
    const b = watchedBranchId ? Number(watchedBranchId) : undefined;
    setSelectedBranchId(b);
  }, [open, isSuper, watchedBranchId]);

  // toast timeout
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // branch info (derivedBT + usaInventarioPorDuenio)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!open) return;

      if (!effectiveBranchId) {
        if (!alive) return;
        setDerivedBT(null);
        setUsesOwnerInventory(false);
        setOwnerType("PROPIO");
        return;
      }

      try {
        const info = await fetchBranchInfo(Number(effectiveBranchId), auth.token ?? "");
        if (!alive) return;

        setDerivedBT(info.businessTypeId ?? null);
        const enabled = Boolean(info.usaInventarioPorDuenio);
        setUsesOwnerInventory(enabled);

        setOwnerType("PROPIO");
      } catch {
        if (!alive) return;
        setDerivedBT(null);
        setUsesOwnerInventory(false);
        setOwnerType("PROPIO");
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, auth.token, effectiveBranchId]);

  // branch name for non-super
  useEffect(() => {
    if (!open || isSuper) return;

    const branchId = auth.user?.branchId;
    if (!branchId) return;
    if (branches.length === 0) return;

    const branch = branches.find((b) => b.id === branchId);
    if (branch) setBranchName(branch.name);
  }, [open, isSuper, auth.user?.branchId, branches]);

  // products
  const filtro = useMemo(
    () =>
      buildFiltro({
        active: true,
        branchId: effectiveBranchId,
        businessTypeId: isSuper ? derivedBT ?? undefined : undefined,
      }),
    [effectiveBranchId, isSuper, derivedBT]
  );

  const { data: productsPage, isPending: productsLoading } = useAdvancedProducts(filtro, 0, 100);

  const productOptions = useMemo(() => {
    const list = (productsPage?.content ?? []) as ProductLite[];
    return list.map((p) => ({
      id: p.id,
      label: `${p.name}${p.sku ? ` · ${p.sku}` : ""}`,
    }));
  }, [productsPage]);

  // ensure default product id once options exist
  useEffect(() => {
    if (!open) return;
    if (!defaultProductId) return;
    if (productOptions.length === 0) return;

    setValue("productId", defaultProductId, { shouldDirty: false });
  }, [open, defaultProductId, productOptions, setValue]);

  const onSubmit = async (v: FormValues) => {
    if (usesOwnerInventory && !ownerType) {
      setToast({ type: "error", message: "Debes seleccionar el tipo de dueño" });
      return;
    }

    try {
      const payload: InventoryCreate = {
        productId: Number(v.productId),
        branchId: Number(isSuper ? v.branchId : auth.user?.branchId ?? 0),
        quantity: Number(v.quantity),
        minStock: v.minStock != null ? Number(v.minStock) : undefined,
        maxStock: v.maxStock != null ? Number(v.maxStock) : undefined,
        isStockCritico: !!v.isStockCritico,
        ownerType: usesOwnerInventory ? (ownerType ?? "PROPIO") : "PROPIO",
      };

      await mutateAsync(payload);

      setToast({ type: "success", message: "Inventario creado." });
      onClose();
      onCreated?.();
    } catch (e) {
      setToast({ type: "error", message: getErrorMessage(e) });
    }
  };

  const triggerClass =
    variant === "link"
      ? "text-xs text-blue-600 hover:underline font-semibold"
      : `
        inline-flex items-center justify-center gap-2
        h-11 px-4 rounded-2xl
        bg-emerald-600 text-white font-semibold
        shadow-sm hover:shadow-md hover:bg-emerald-700
        active:scale-[0.99] transition
      `;

  const modal = open ? (
    <div className="fixed inset-0 z-[10000]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Center on desktop, bottom-sheet on mobile */}
      <div
        className="
          fixed inset-x-0 bottom-0
          md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2
          md:-translate-x-1/2 md:-translate-y-1/2
          w-full md:w-[min(92vw,40rem)]
          bg-white
          rounded-t-3xl md:rounded-2xl
          shadow-2xl
          overflow-hidden
        "
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo inventario"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Nuevo inventario</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Asigna existencias, mínimos y máximos.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                h-10 px-4 rounded-2xl
                bg-slate-100 text-slate-800 font-semibold
                hover:bg-slate-200 transition
              "
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="max-h-[75dvh] md:max-h-[78vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-4">
            {/* Sucursal */}
            {isSuper ? (
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Sucursal</span>

                <select
                  className="
                    w-full h-12 rounded-2xl
                    border border-slate-200 bg-white
                    px-3 text-sm shadow-sm
                    focus:ring-2 focus:ring-blue-500
                  "
                  {...register("branchId", { valueAsNumber: true })}
                  disabled={branchesLoading}
                >
                  <option value="">
                    {branchesLoading ? "Cargando…" : "Selecciona…"}
                  </option>

                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {errors.branchId && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.branchId.message)}</p>
                )}
              </label>
            ) : (
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Sucursal</span>

                <input
                  className="
                    w-full h-12 rounded-2xl
                    border border-slate-200 bg-slate-100
                    px-3 text-sm text-slate-700
                  "
                  value={branchName || "Sucursal asignada"}
                  readOnly
                />

                <input
                  type="hidden"
                  {...register("branchId", { valueAsNumber: true })}
                  value={auth.user?.branchId ?? ""}
                  readOnly
                />
              </label>
            )}

            {/* Producto */}
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Producto</span>

              <select
                className="
                  w-full h-12 rounded-2xl
                  border border-slate-200 bg-white
                  px-3 text-sm shadow-sm
                  focus:ring-2 focus:ring-blue-500
                  disabled:bg-slate-100
                "
                {...register("productId", { valueAsNumber: true })}
                disabled={!effectiveBranchId || productsLoading}
              >
                <option value="">
                  {!effectiveBranchId
                    ? "Selecciona una sucursal…"
                    : productsLoading
                    ? "Cargando…"
                    : "Selecciona…"}
                </option>

                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              {errors.productId && (
                <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>
              )}
            </label>

            {/* Owner inventory toggle */}
            {usesOwnerInventory && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Tipo de dueño</p>
                    <p className="text-xs text-slate-600">
                      Define si el inventario es propio o consignación.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`
                      h-10 px-4 rounded-2xl font-semibold shadow-sm transition
                      ${ownerType === "PROPIO"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"}
                    `}
                    onClick={() =>
                      setOwnerType((prev) => (prev === "PROPIO" ? "CONSIGNACION" : "PROPIO"))
                    }
                  >
                    {ownerType === "PROPIO" ? "PROPIO" : "CONSIGNACIÓN"}
                  </button>
                </div>
              </div>
            )}

            {/* Cantidad */}
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Cantidad</span>

              <input
                type="number"
                data-no-wheel="true"
                className="
                  w-full h-12 rounded-2xl
                  border border-slate-200 bg-white
                  px-3 text-sm shadow-sm
                  focus:ring-2 focus:ring-blue-500
                "
                {...register("quantity")}
              />

              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>
              )}
            </label>

            {/* Min/Max responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Stock mínimo</span>
                <input
                  type="number"
                  data-no-wheel="true"
                  className="
                    w-full h-12 rounded-2xl
                    border border-slate-200 bg-white
                    px-3 text-sm shadow-sm
                    focus:ring-2 focus:ring-blue-500
                  "
                  {...register("minStock")}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Stock máximo</span>
                <input
                  type="number"
                  data-no-wheel="true"
                  className="
                    w-full h-12 rounded-2xl
                    border border-slate-200 bg-white
                    px-3 text-sm shadow-sm
                    focus:ring-2 focus:ring-blue-500
                  "
                  {...register("maxStock")}
                />
              </label>
            </div>

            {/* Crítico */}
            <label
              className="
                flex items-center justify-between gap-3
                rounded-2xl border border-slate-200 bg-white
                px-4 py-3 shadow-sm
              "
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Marcar como crítico</p>
                <p className="text-xs text-slate-600">Se mostrará como alerta en el dashboard.</p>
              </div>

              <input
                type="checkbox"
                className="h-5 w-5 accent-red-600"
                {...register("isStockCritico")}
              />
            </label>

            {/* Footer actions (mobile sticky) */}
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    h-12 rounded-2xl
                    border border-slate-200 bg-white
                    font-semibold text-slate-800
                    hover:bg-slate-50 transition
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="
                    h-12 rounded-2xl
                    bg-emerald-600 text-white font-semibold
                    shadow-sm hover:bg-emerald-700 hover:shadow-md
                    disabled:opacity-60 disabled:hover:shadow-sm
                    transition
                  "
                >
                  {isPending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>

            <div className="h-[max(12px,env(safe-area-inset-bottom))]" />
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
     <button className={triggerClass} onClick={openModal}>
        <PackagePlus className="h-4 w-4" />
        <span>{variant === "link" ? "Agregar stock" : "Agregar"}</span>
      </button>

      {toast &&
        createPortal(
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[11000] px-3 w-full max-w-md">
            <div
              className={`w-full px-4 py-3 rounded-2xl text-white shadow-lg text-sm font-semibold text-center ${
                toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              {toast.message}
            </div>
          </div>,
          document.body
        )}

      {open && createPortal(modal, document.body)}
    </>
  );
}
