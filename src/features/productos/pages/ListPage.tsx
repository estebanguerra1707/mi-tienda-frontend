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

type SortKey =
  | "sku"
  | "codigoBarras"
  | "name"
  | "purchasePrice"
  | "categoryName"
  | "providerName"
  | "creationDate"
  | "businessTypeName"
  | "active";

export default function ListPage() {
  const { params, setSearch, setParams } = useProductSearchParams();
    const { user } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";

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

    let shouldClean = false;
    const sp = new URLSearchParams(params);

    filtroKeys.forEach((key) => {
      if (sp.has(key)) {
        sp.delete(key);
        shouldClean = true;
      }
    });

    if (shouldClean) {
      setParams(sp);
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // 🔹 Filtro principal
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
        businessTypeId: params.get("businessTypeId")
          ? Number(params.get("businessTypeId"))
          : undefined,
      }),
    [q, params]
  );

  const pageUI = Number(params.get("page") ?? 1);
  const size = params.get("size") ? Number(params.get("size")) || 10 : 10;

  const { data, isPending, error, refetch } = useAdvancedProducts(filtro, pageUI - 1, size);

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

  const totalPages = useMemo(() => data?.totalPages ?? 1, [data]);

  // 🔹 Ordenamiento front-end
  const sortedItems = useMemo(() => {
    const mult = localSort.dir === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
      const key = localSort.key;
      const av = a[key];
      const bv = b[key];

      switch (key) {
        case "purchasePrice":
          return (Number(av ?? 0) - Number(bv ?? 0)) * mult;
        case "active":
          return ((a.active ? 1 : 0) - (b.active ? 1 : 0)) * mult;
        case "creationDate":
          return (
            (new Date(av as string).getTime() -
              new Date(bv as string).getTime()) * mult
          );
        default:
          return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [items, localSort, collator]);

  if (isPending) return <p className="p-4">Cargando…</p>;
  if (error) return <p className="p-4 text-red-600">{(error as Error).message}</p>;

  return (
    <div className="mx-auto w-full max-w-7xl p-6 space-y-8">

      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Productos
        </h1>

        <AddProductButton
          onCreated={() => refetch()}
          className="shadow-md hover:shadow-lg transition rounded-xl"
        />
      </div>

      {/* ---------- BUSCADOR ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto] bg-white p-5 rounded-xl shadow border">

        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
          <input
            className="
              border rounded-xl pl-10 pr-3 py-2 w-full shadow-sm
              focus:ring-2 focus:ring-blue-500 transition
            "
            placeholder="Busca por nombre o código de barras…"
            defaultValue={params.get('barcodeName') ?? ''}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="
            rounded-xl px-5 py-2 bg-blue-600 text-white font-semibold
            hover:bg-blue-700 transition shadow
          "
          onClick={() => refetch()}
        >
          Buscar
        </button>

        {!showAdvanced && (
          <button
            className="
              rounded-xl px-5 py-2 bg-slate-100 hover:bg-slate-200
              transition font-medium shadow
            "
            onClick={() => setShowAdvanced(true)}
          >
            Búsqueda avanzada
          </button>
        )}
      </div>

      {/* ---------- FILTROS AVANZADOS ---------- */}
      {showAdvanced && (
        <>
          <div className="bg-white p-5 rounded-xl shadow border">
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

          <div className="flex justify-end">
            <button
              className="
                px-4 py-2 mt-2 rounded-xl bg-slate-200 hover:bg-slate-300
                transition shadow
              "
              onClick={() => setShowAdvanced(false)}
            >
              Ocultar filtros
            </button>
          </div>
        </>
      )}

      {/* ---------- LISTA MOBILE ---------- */}
      <ul className="grid gap-4 md:hidden">
        {items.map((p) => (
          <li
            key={p.id}
            className="
              rounded-xl border bg-white p-4 shadow-sm hover:shadow-md
              transition
            "
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                <p className="text-xs text-slate-500">Código: {p.codigoBarras ?? "-"}</p>
              </div>
              <span className="font-bold text-blue-700">
                {p.purchasePrice ? `$${p.purchasePrice.toFixed(2)}` : "-"}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* ---------- TABLA DESKTOP ---------- */}
      <div className="hidden md:block rounded-xl border bg-white shadow overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {[
                ["sku", "SKU"],
                ["codigoBarras", "Código de barras"],
                ["name", "Nombre"],
                ["purchasePrice", "Precio compra"],
                ["categoryName", "Categoría"],
                ["providerName", "Proveedor"],
                ["creationDate", "Fecha alta"],
              ].map(([key, label]) => (
                <th key={key} className="px-4 py-3 font-semibold text-slate-700">
                  <button
                    onClick={() => toggleSort(key as SortKey)}
                    className="flex items-center gap-1 hover:text-blue-600 transition"
                  >
                    {label} <Arrow k={key as SortKey} />
                  </button>
                </th>
              ))}

              {isSuper && (
                <>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("businessTypeName")}
                      className="flex items-center gap-1 font-semibold hover:text-blue-600"
                    >
                      Negocio <Arrow k="businessTypeName" />
                    </button>
                  </th>

                  <th className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("active")}
                      className="flex items-center gap-1 font-semibold hover:text-blue-600"
                    >
                      Activo <Arrow k="active" />
                    </button>
                  </th>
                </>
              )}

              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50 transition">
                <td className="px-4 py-3">{p.sku}</td>
                <td className="px-4 py-3">{p.codigoBarras ?? "-"}</td>
                <td className="px-4 py-3 truncate">{p.name}</td>
                <td className="px-4 py-3">
                  {p.purchasePrice ? `$${p.purchasePrice.toFixed(2)}` : "-"}
                </td>
                <td className="px-4 py-3">{p.categoryName ?? "-"}</td>
                <td className="px-4 py-3">{p.providerName ?? "-"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(p.creationDate).toLocaleDateString("es-MX")}
                </td>

                {isSuper && (
                  <>
                    <td className="px-4 py-3">{p.businessTypeName ?? "-"}</td>
                    <td className="px-4 py-3">{p.active ? "Sí" : "No"}</td>
                  </>
                )}

                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <EditProductButton
                      product={p}
                      paramsActuales={{
                        barcodeName: params.get("barcodeName") ?? "",
                        page: pageUI,
                        pageSize: size,
                      }}
                      onUpdated={() => refetch()}
                    />
                    <DeleteProductButton
                      id={p.id}
                      name={p.name}
                      onDeleted={() => refetch()}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- PAGINACIÓN ---------- */}
      <div className="pt-4 flex justify-center">
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
    </div>
  );
}
