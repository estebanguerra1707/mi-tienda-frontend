import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
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
import { InventarioOwnerType } from "../api";
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

}: Props) {  const { mutateAsync, isPending } = useCreateInventory();

  const auth = useAuth() as {
    user?: { role?: Role; branchId?: number | null; businessType?: number | null };
    hasRole?: (r: Role) => boolean;
    token?: string;
  };
  const isSuper = auth.hasRole ? auth.hasRole("SUPER_ADMIN") : auth.user?.role === "SUPER_ADMIN";

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
const [branchName, setBranchName] = useState<string>("");

const {
  data: branches = [],
  isLoading: branchesLoading,
} = useBranches({
  isSuper,
  businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
  oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
});

  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    isSuper ? undefined : (auth.user?.branchId ?? undefined)
  );
  const [usesOwnerInventory, setUsesOwnerInventory] = useState(false);
const [ownerType, setOwnerType] = useState<InventarioOwnerType>("PROPIO");

  const [derivedBT, setDerivedBT] = useState<number | null>(null);
  const effectiveBranchId = isSuper ? selectedBranchId : auth.user?.branchId ?? undefined;

  
useEffect(() => {
  let alive = true;

  (async () => {
    if (!open) return;

    // Sucursal efectiva (super: seleccionada, no-super: la del usuario)
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

      // MISMO COMPORTAMIENTO QUE COMPRAS
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


const filtro = useMemo(
  () =>
    buildFiltro({
      active: true,
      branchId: effectiveBranchId,
      businessTypeId: isSuper ? (derivedBT ?? undefined) : undefined,
    }),
  [effectiveBranchId, isSuper, derivedBT]
);


  const { data: productsPage, isPending: productsLoading } = useAdvancedProducts(
    filtro,
    0,
    100 
  );
  
const productOptions = useMemo(() => {
  const list = (productsPage?.content ?? []) as ProductLite[];
  return list.map((p) => ({
    id: p.id,
    label: `${p.name}${p.sku ? ` · ${p.sku}` : ""}`,
  }));
}, [productsPage]);

  // ------- Form -------
  const resolver = useMemo(() => makeResolver(schema), []);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver,
    defaultValues: { isStockCritico: false },
  });

  useEffect(() => {
  if (autoOpen && defaultProductId) {
    setOpen(true);
    setValue("productId", defaultProductId, { shouldDirty: false });
  }
}, [autoOpen, defaultProductId, setValue]);

useEffect(() => {
  if (!open) return;
  if (!defaultProductId) return;

  setValue("productId", defaultProductId, { shouldDirty: false });
}, [open, defaultProductId, setValue]);


  useEffect(() => {
    if (!open) return;
    if (!isSuper) {
      setValue("branchId", auth.user?.branchId ?? undefined, { shouldDirty: false });
      setSelectedBranchId(auth.user?.branchId ?? undefined);
    } else {
      setValue("branchId", undefined, { shouldDirty: false });
      setSelectedBranchId(undefined);
    }
  }, [open, isSuper, auth.user?.branchId, setValue]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const onClose = () => {
    setOpen(false);
      setBranchName("");
    setUsesOwnerInventory(false);
    setOwnerType("PROPIO");
     reset();
  };
  
  const onSubmit = async (v: FormValues) => {
    if (usesOwnerInventory && !ownerType) {
      setToast({ type: "error", message: "Debes seleccionar el tipo de dueño" });
      return;
    }
    try {
      const payload: InventoryCreate = {
        productId: Number(v.productId),
        branchId: Number(isSuper ? v.branchId : (auth.user?.branchId ?? 0)),
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
useEffect(() => {
  if (!open || isSuper) return;

  const branchId = auth.user?.branchId;
  if (!branchId) return;

  if (branches.length === 0) return;

  const branch = branches.find((b) => b.id === branchId);
  if (branch) {
    setBranchName(branch.name);
  }
}, [open, isSuper, auth.user?.branchId, branches]);

useEffect(() => {
  if (!open) return;
  if (!defaultProductId) return;
  if (productOptions.length === 0) return;

  setValue("productId", defaultProductId, { shouldDirty: false });
}, [open, defaultProductId, productOptions, setValue]);


  return (
    <>
      <button
        className={
          variant === "link"
            ? "text-xs text-blue-600 hover:underline font-semibold"
            : "px-3 py-2 rounded bg-emerald-600 text-white"
        }
        onClick={() => {
          setOpen(true);
          if (defaultProductId) {
            setValue("productId", defaultProductId, { shouldDirty: false });
          }
        }}
      >
        {variant === "link" ? "Agregar stock" : "Agregar inventario"}
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
          <div className="fixed inset-0 z-[10000]">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw-1rem,34rem)] rounded-xl bg-white shadow-2xl p-4">
              <h2 className="text-lg font-semibold mb-3">Nuevo inventario</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Sucursal */}
                {isSuper ? (
                  <label className="block">
                    <span className="text-sm">Sucursal</span>
                   <select
                        className="border rounded px-3 py-2 w-full"
                        {...register("branchId", { valueAsNumber: true })}
                        onChange={(e) =>
                          setSelectedBranchId(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
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
                    {errors.branchId && <p className="text-xs text-red-600">{String(errors.branchId.message)}</p>}
                  </label>
                ) : (
                  <label className="block">
                    <span className="text-sm">Sucursal</span>
                    <input className="border rounded px-3 py-2 w-full bg-slate-100" value={branchName || "Sucursal asignada"}
                     readOnly />
                    <input type="hidden" {...register("branchId", { valueAsNumber: true })} value={auth.user?.branchId ?? ""} readOnly />
                  </label>
                )}

                {/* Producto dependiente de sucursal */}
                <label className="block">
                  <span className="text-sm">Producto</span>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    {...register("productId", { valueAsNumber: true })}
                    disabled={!effectiveBranchId || productsLoading}
                  >
                    <option value="">{!effectiveBranchId ? "Selecciona una sucursal…" : (productsLoading ? "Cargando…" : "Selecciona…")}</option>
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  {errors.productId && <p className="text-xs text-red-600">{errors.productId.message}</p>}
                </label>
                {usesOwnerInventory && (
                  <div
                    className="
                      flex flex-col gap-2
                      sm:flex-row sm:items-center sm:gap-4
                    "
                  >
                    {/* Label */}
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Tipo de dueño
                    </span>

                    {/* Switch + badge */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="
                          accent-blue-600
                          w-4 h-4
                          cursor-pointer
                        "
                        checked={ownerType === "CONSIGNACION"}
                        onChange={(e) =>
                          setOwnerType(e.target.checked ? "CONSIGNACION" : "PROPIO")
                        }
                      />

                      <span
                        className={`
                          inline-flex items-center justify-center
                          min-w-[96px]
                          px-2.5 py-1
                          rounded-full
                          text-[11px] font-semibold
                          transition-colors
                          ${
                            ownerType === "PROPIO"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        `}
                      >
                        {ownerType}
                      </span>
                    </div>
                  </div>
                )}
                {/* Cantidad / min / max */}
                <label className="block">
                  <span className="text-sm">Cantidad</span>
                  <input type="number" className="border rounded px-3 py-2 w-full" {...register("quantity")} />
                  {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm">Stock mínimo</span>
                    <input type="number" className="border rounded px-3 py-2 w-full" {...register("minStock")} />
                  </label>
                  <label className="block">
                    <span className="text-sm">Stock máximo</span>
                    <input type="number" className="border rounded px-3 py-2 w-full" {...register("maxStock")} />
                  </label>
                </div>

                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" {...register("isStockCritico")} />
                  <span>Marcar como crítico</span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60">
                    {isPending ? "Guardando…" : "Guardar"}
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
