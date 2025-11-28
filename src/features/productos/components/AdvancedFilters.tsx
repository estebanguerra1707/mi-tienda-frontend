import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, useBranches, fetchBranchInfo, useBusinessTypes  } from "@/hooks/useCatalogs";


type AdvancedFiltersProps = {
  params: URLSearchParams;
  onApply: (next: Record<string, string | undefined>) => void;
  loadingBranches?: boolean;
};

export default function AdvancedFilters({
  params,
  onApply,
}: AdvancedFiltersProps) {
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") ?? "");
  const [available, setAvailable] = useState(params.get("available") === "true");
  const [withoutCategory, setWithoutCategory] = useState(
    params.get("withoutCategory") === "true"
  );
  const [branchId, setBranchId] = useState(params.get("branchId") ?? "");
  const [businessTypeId, setBusinessTypeId] = useState(
    params.get("businessTypeId") ?? ""
  );


const { user, hasRole, token } = useAuth() as unknown as {
  user?: { 
    role?: string;
    businessTypeId?: number;
    branchId?: number;
    branchName?: string;
  };
  hasRole?: (r: string) => boolean;
  token: string;
};


const isSuper = hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN";
const isAdmin = hasRole?.("ADMIN") ?? false;
const isVendor = hasRole?.("VENDOR") ?? false;
const disableCats = isSuper && !branchId;


const btHook = useBusinessTypes(); // asume hook disponible
const businessTypes = btHook.data ?? [];
const loadingBusinessTypes = btHook.isLoading;


const [derivedBT, setDerivedBT] = useState<number | null>(null);


useEffect(() => {
  if (!isSuper || !branchId) { setDerivedBT(null); return; }
  let alive = true;
  (async () => {
    try {
      const info = await fetchBranchInfo(Number(branchId), token);
      if (alive) setDerivedBT(info.businessTypeId);
    } catch {
      if (alive) setDerivedBT(null);
    }
  })();
  return () => { alive = false; };
}, [isSuper, branchId, token]);


const categoriesHook = useCategories({
  businessTypeId: isSuper
    ? (derivedBT ?? (businessTypeId ? Number(businessTypeId) : undefined))
    : (isAdmin ? user?.businessTypeId : undefined),
  // branchId: para VENDOR no lo pases (el hook usa su sucursal de sesión).
  //           para ADMIN que elige sucursal en este panel, sí pásalo:
  branchId: (!isSuper && !isVendor && branchId) ? Number(branchId) : undefined,
});

const branchesHook = useBranches({
  businessTypeId: isSuper
    ? (businessTypeId ? Number(businessTypeId) : undefined)
    : (user?.businessTypeId ?? undefined),
});


useEffect(() => {
  if (isSuper) setCategoryId("");
}, [isSuper, branchId]);

  // si cambian params externamente (navegación) sincroniza
  useEffect(() => {
    setMin(params.get("min") ?? "");
    setMax(params.get("max") ?? "");
    setCategoryId(params.get("categoryId") ?? "");
    setAvailable(params.get("available") === "true");
    setWithoutCategory(params.get("withoutCategory") === "true");
    setBranchId(params.get("branchId") ?? "");
    setBusinessTypeId(params.get("businessTypeId") ?? "");
  }, [params]);

  const apply = () => {
    onApply({
      min: min || undefined,
      max: max || undefined,
      categoryId: categoryId || undefined,
      available: available ? "true" : undefined,
      withoutCategory: withoutCategory ? "true" : undefined,
      branchId: branchId || undefined,
      businessTypeId:
        isSuper
            ? businessTypeId || undefined
            : isAdmin
            ? user?.businessTypeId?.toString()
            : undefined,      page: "1",
        });
  };

  const clear = () => {
    onApply({
        min: undefined,
        max: undefined,
        categoryId: undefined,
        available: undefined,
        withoutCategory: undefined,
        branchId: undefined,
        businessTypeId: undefined,
        sort: undefined,
    page: "1",
    });
    setBusinessTypeId("");
  };


  useEffect(() => {
  if (isSuper) setCategoryId("");
}, [isSuper, branchId]);

  // Clase de inputs para igualar AddProduct (px-3 py-2 + borde redondeado)
  const inputCls = "border rounded px-3 py-2";
  const selectCls = `${inputCls} disabled:bg-slate-100`;

  return (
    <div className="rounded border p-3 grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Precio mín.</span>
        <input
          value={min}
          onChange={(e) => setMin(e.target.value)}
          inputMode="decimal"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Precio máx.</span>
        <input
          value={max}
          onChange={(e) => setMax(e.target.value)}
          inputMode="decimal"
          className={inputCls}
        />
      </label>
        {/* Sucursal */}
        {isVendor ? (
        <label className="flex flex-col gap-1">
            <span className="text-sm">Sucursal</span>
            <input
            type="text"
            readOnly
            value={user?.branchName ?? "Sucursal asignada"}
            className="border rounded px-3 py-2 bg-slate-100 cursor-not-allowed"
            />
        </label>
        ) : (
        <label className="flex flex-col gap-1">
            <span className="text-sm">Sucursal</span>
           <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="border rounded px-3 py-2 disabled:bg-slate-100"
                disabled={branchesHook.loading}
                >
                <option value="">{branchesHook.loading ? "Cargando…" : "Todas…"}</option>
                {branchesHook.data.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
                {!branchesHook.loading && branchesHook.data.length === 0 && (
                    <option disabled>(sin sucursales)</option>
                )}
            </select>
        </label>
)}

      {/* Categoría */}
        <label className="flex flex-col gap-1">
        <span className="text-sm">Categoría</span>
        <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="border rounded px-3 py-2 disabled:bg-slate-100"
        disabled={disableCats || categoriesHook.loading}
        >
        <option value="">
            {disableCats ? "Selecciona sucursal…" : categoriesHook.loading ? "Cargando…" : "Todas…"}
        </option>
        {categoriesHook.data.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        {!categoriesHook.loading && categoriesHook.data.length === 0 && (
            <option disabled>(sin categorías)</option>
        )}
        </select>
        </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
        />
        <span>Solo con stock</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={withoutCategory}
          onChange={(e) => setWithoutCategory(e.target.checked)}
        />
        <span>Sin categoría</span>
      </label>

      {/* Tipo de negocio */}
        {isSuper && (
        <label className="flex flex-col gap-1">
            <span className="text-sm">Tipo de negocio</span>
            <select
            value={businessTypeId}
            onChange={(e) => {
                setBusinessTypeId(e.target.value);
                // Resetear sucursal y categoría al cambiar tipo de negocio
                setBranchId("");
                setCategoryId("");
            }}
            className={selectCls}
            disabled={loadingBusinessTypes}
            >
            <option value="">
                {loadingBusinessTypes ? "Cargando…" : "Todos…"}
            </option>
            {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>
                {bt.name}
                </option>
            ))}
            {!loadingBusinessTypes && businessTypes.length === 0 && (
                <option disabled>(sin tipos)</option>
            )}
            </select>
        </label>
        )}
     
      <div className="sm:col-span-3 flex gap-2 justify-end">
        <button type="button" onClick={clear} className="px-3 py-2 border rounded">
          Limpiar
        </button>
        <button
          type="button"
          onClick={apply}
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
