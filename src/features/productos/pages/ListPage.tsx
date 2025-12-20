import { useMemo, useState, useEffect } from "react";
import { useProductSearchParams } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import AddProductButton from "@/features/productos/components/AddProductButton";
import EditProductButton from "@/features/productos/components/EditProductButton";
import DeleteProductButton from "@/features/productos/components/DeleteProductButton";
import { useAdvancedProducts } from "@/features/productos/useAdvancedProducts";
import { buildFiltro, type ProductoFiltroDTO } from "@/features/productos/productos.api";
import type { Product } from "@/features/productos/api";
import AdvancedFilters from "@/features/productos/components/AdvancedFilters";
import { ServerPagination } from "@/components/pagination/ServerPagination";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";

// Ordenamiento
type SortKey =
  | "sku"
  | "codigoBarras"
  | "name"
  | "purchasePrice"
  | "categoryName"
  | "salePrice"
  | "creationDate"
  | "businessTypeName"
  | "active";

export default function ListPage() {
  const { params, setSearch, setParams } = useProductSearchParams();
  const { user } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";

  // Limpieza inicial de filtros
  useEffect(() => {
    const filtroKeys = [
      "min",
      "max",
      "categoryId",
      "available",
      "withoutCategory",
      "branchId",
      "businessTypeId",
      "barcodeName",
      "page",
      "sort",
    ];
    const sp = new URLSearchParams(params);
    let changed = false;

    filtroKeys.forEach((k) => {
      if (sp.has(k)) {
        sp.delete(k);
        changed = true;
      }
    });

    if (changed) setParams(sp);
  }, []); // eslint-disable-line

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const toggleSort = (key: SortKey) =>
    setLocalSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  const Arrow = ({ k }: { k: SortKey }) =>
    localSort.key !== k ? (
      <span className="opacity-40">↕︎</span>
    ) : localSort.dir === "asc" ? (
      <>▲</>
    ) : (
      <>▼</>
    );

  const q = params.get("barcodeName")?.trim() || undefined;

  const filtro: ProductoFiltroDTO = useMemo(
    () =>
      buildFiltro({
        active: true,
        barcodeName: q,
        min: params.get("min") ? Number(params.get("min")) : undefined,
        max: params.get("max") ? Number(params.get("max")) : undefined,
        categoryId: params.get("categoryId") ? Number(params.get("categoryId")) : undefined,
        available: params.get("available") === "true" ? true : undefined,
        withoutCategory: params.get("withoutCategory") === "true" ? true : undefined,
        branchId: params.get("branchId") ? Number(params.get("branchId")) : undefined,
        businessTypeId: params.get("businessTypeId") ? Number(params.get("businessTypeId")) : undefined,
      }),
    [q, params]
  );

  const pageUI = Number(params.get("page") ?? 1);
  const size = params.get("size") ? Number(params.get("size")) || 10 : 10;

  const { data, isPending, error, refetch } = useAdvancedProducts(filtro, pageUI - 1, size);

  // Scanner por teclado
  useEffect(() => {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout>;

    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        const code = buffer.trim();
        buffer = "";
        if (code.length > 2) {
          setSearch(code);
          refetch();
        }
        return;
      }

      if (ev.key.length === 1) buffer += ev.key;

      clearTimeout(timeout);
      timeout = setTimeout(() => (buffer = ""), 120);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setSearch, refetch]);

  type BackendProduct = Omit<Product, "codigoBarras"> & {
    codigoBarras?: string;
    active?: boolean;
    branchId?: number;
  };

  const items = useMemo(() => {
    const backendItems = (data?.content ?? []) as BackendProduct[];
    return backendItems.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      codigoBarras: p.codigoBarras ?? "",
      description: p.description,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      providerId: p.providerId,
      providerName: p.providerName,
      businessTypeId: p.businessTypeId,
      businessTypeName: p.businessTypeName,
      creationDate: p.creationDate,
      branchId: p.branchId ?? null,
      active: p.active ?? true,
    }));
  }, [data]);

  const sortedItems = useMemo(() => {
    const mult = localSort.dir === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
      const av = a[localSort.key];
      const bv = b[localSort.key];

      switch (localSort.key) {
        case "purchasePrice":
          return (Number(av ?? 0) - Number(bv ?? 0)) * mult;
        case "active":
          return ((a.active ? 1 : 0) - (b.active ? 1 : 0)) * mult;
        case "creationDate":
          return (new Date(av as string).getTime() - new Date(bv as string).getTime()) * mult;
        default:
          return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [items, localSort, collator]);

  const totalPages = data?.totalPages ?? 1;
  const [showScanner, setShowScanner] = useState(false);

  if (isPending) return <p className="p-4">Cargando…</p>;
  if (error) return <p className="p-4 text-red-600">{(error as Error).message}</p>;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ===== Sticky “top bar” (móvil) ===== */}
      <div className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b -mx-3 px-3 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">Productos</h1>
            <p className="text-xs text-slate-500 leading-tight">
              Busca por nombre o código de barras
            </p>
          </div>
          <div className="shrink-0">
            <AddProductButton onCreated={() => refetch()} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-12 gap-2">
          <div className="col-span-12">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
              <input
                inputMode="search"
                className="w-full h-11 rounded-2xl border bg-white pl-10 pr-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Nombre o código…"
                defaultValue={params.get("barcodeName") ?? ""}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button
            className="col-span-6 h-11 rounded-2xl bg-green-600 text-white font-semibold active:scale-[0.99] transition shadow-sm"
            onClick={() => setShowScanner(true)}
          >
            📷 Escanear
          </button>

          <button
            className="col-span-6 h-11 rounded-2xl bg-blue-600 text-white font-semibold active:scale-[0.99] transition shadow-sm"
            onClick={() => refetch()}
          >
            Buscar
          </button>

          {!showAdvanced ? (
            <button
              className="col-span-12 h-11 rounded-2xl bg-slate-100 text-slate-900 font-semibold active:scale-[0.99] transition"
              onClick={() => setShowAdvanced(true)}
            >
              Filtros avanzados
            </button>
          ) : (
            <button
              className="col-span-12 h-11 rounded-2xl bg-slate-200 text-slate-900 font-semibold active:scale-[0.99] transition"
              onClick={() => setShowAdvanced(false)}
            >
              Ocultar filtros
            </button>
          )}
        </div>
      </div>

      {/* ===== Header (desktop/tablet) ===== */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Productos</h1>
          <p className="text-sm text-slate-600">Busca por nombre, SKU o código de barras</p>
        </div>
        <AddProductButton onCreated={() => refetch()} />
      </div>

      {/* ===== Buscador (desktop/tablet) ===== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border p-4">
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12 lg:col-span-6">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
              <input
                inputMode="search"
                className="w-full h-11 rounded-2xl border bg-white pl-10 pr-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Busca por nombre o código…"
                defaultValue={params.get("barcodeName") ?? ""}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button
            className="col-span-12 sm:col-span-4 lg:col-span-2 h-11 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-sm"
            onClick={() => setShowScanner(true)}
          >
            📷 Escanear
          </button>

          <button
            className="col-span-12 sm:col-span-4 lg:col-span-2 h-11 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
            onClick={() => refetch()}
          >
            Buscar
          </button>

          {!showAdvanced && (
            <button
              className="col-span-12 sm:col-span-4 lg:col-span-2 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 transition font-semibold"
              onClick={() => setShowAdvanced(true)}
            >
              Filtros
            </button>
          )}
        </div>
      </div>

      {/* ===== Filtros avanzados ===== */}
      {showAdvanced && (
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <AdvancedFilters
            params={params}
            onApply={(next) => {
              const sp = new URLSearchParams(params);
              Object.entries(next).forEach(([k, v]) => {
                if (!v) sp.delete(k);
                else sp.set(k, v);
              });
              setParams(sp);
            }}
          />
        </div>
      )}

      {/* ===== Lista MOBILE (cards compactas) ===== */}
      <ul className="grid gap-3 md:hidden">
        {sortedItems.map((p) => (
          <li key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm active:scale-[0.995] transition">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-base text-slate-900 truncate">{p.name}</p>

                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-slate-500">SKU: <span className="text-slate-700">{p.sku || "-"}</span></p>
                  <p className="text-xs text-slate-500">
                    Código: <span className="text-slate-700">{p.codigoBarras || "-"}</span>
                  </p>
                  {p.categoryName && (
                    <p className="text-xs text-slate-500">
                      Categoría: <span className="text-slate-700">{p.categoryName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500">Venta</p>
                <p className="font-bold text-blue-700 text-lg leading-none">
                  {p.salePrice != null ? `$${p.salePrice.toFixed(2)}` : "-"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Compra: {p.purchasePrice != null ? `$${p.purchasePrice.toFixed(2)}` : "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="w-full">
                <EditProductButton
                  product={p}
                  paramsActuales={{
                    barcodeName: params.get("barcodeName") ?? "",
                    page: pageUI,
                    pageSize: size,
                  }}
                  onUpdated={() => refetch()}
                />
              </div>

              <div className="w-full">
                <DeleteProductButton id={p.id} name={p.name} onDeleted={() => refetch()} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* ===== Tabla DESKTOP ===== */}
      <div className="hidden md:block rounded-2xl border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50 border-b sticky top-0 z-10">
            <tr>
              {[
                ["sku", "SKU"],
                ["codigoBarras", "Código"],
                ["name", "Nombre"],
                ["purchasePrice", "Compra"],
                ["salePrice", "Venta"],
                ["categoryName", "Categoría"],
                ["creationDate", "Alta"],
              ].map(([k, label]) => (
                <th key={k} className="px-4 py-3 font-semibold text-slate-700 text-left">
                  <button
                    onClick={() => toggleSort(k as SortKey)}
                    className="flex items-center gap-1 hover:text-blue-600 transition"
                  >
                    {label} <Arrow k={k as SortKey} />
                  </button>
                </th>
              ))}

              {isSuper && (
                <>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-left">Negocio</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-left">Activo</th>
                </>
              )}
              {(isSuper || isAdmin) && (
                <th className="px-4 py-3 font-semibold text-slate-700 text-left">Acciones</th>
                  )}
                  </tr>
          </thead>

          <tbody>
            {sortedItems.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50 transition">
                <td className="px-4 py-3">{p.sku}</td>
                <td className="px-4 py-3">{p.codigoBarras ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3">{p.purchasePrice != null ? `$${p.purchasePrice.toFixed(2)}` : "-"}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">
                  {p.salePrice != null ? `$${p.salePrice.toFixed(2)}` : "-"}
                </td>
                <td className="px-4 py-3">{p.categoryName}</td>
                <td className="px-4 py-3">{new Date(p.creationDate).toLocaleDateString("es-MX")}</td>

                {isSuper && (
                  <>
                    <td className="px-4 py-3">{p.businessTypeName}</td>
                    <td className="px-4 py-3">{p.active ? "Sí" : "No"}</td>
                  </>
                )}

                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <EditProductButton
                      product={p}
                      paramsActuales={{
                        barcodeName: params.get("barcodeName") ?? "",
                        page: pageUI,
                        pageSize: size,
                      }}
                      onUpdated={() => refetch()}
                    />
                    <DeleteProductButton id={p.id} name={p.name} onDeleted={() => refetch()} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Paginación ===== */}
      <div className="pt-2 flex justify-center md:justify-end">
        <ServerPagination
          page={pageUI}
          totalPages={totalPages}
          onChange={(nextPage) => {
            const sp = new URLSearchParams(params);
            sp.set("page", String(nextPage));
            setParams(sp);
          }}
        />
      </div>

      {/* ===== SCANNER OVERLAY (safe-area, botones grandes) ===== */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b">
              <h2 className="text-lg font-semibold">Escanear código</h2>
              <p className="text-xs text-slate-500">Alinea el código dentro de la cámara</p>
            </div>

            <div className="p-4">
              <BarcodeCameraScanner
                onResult={(code) => {
                  setShowScanner(false);
                  setSearch(code);
                  refetch();
                }}
                onError={(e) => console.error("Error escáner:", e)}
              />

              <button
                onClick={() => setShowScanner(false)}
                className="mt-4 w-full h-11 rounded-2xl bg-red-600 text-white font-semibold active:scale-[0.99] transition"
              >
                Cerrar
              </button>
            </div>

            {/* “safe area” bottom extra padding para iPhone */}
            <div className="h-[max(12px,env(safe-area-inset-bottom))]" />
          </div>
        </div>
      )}
    </div>
  );
}
