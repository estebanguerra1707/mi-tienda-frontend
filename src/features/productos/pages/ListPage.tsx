import { useMemo, useState, useEffect} from "react";
import { useProductSearchParams } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import AddProductButton from "@/features/productos/components/AddProductButton";
import EditProductButton from "@/features/productos/components/EditProductButton";
import DeleteProductButton from "@/features/productos/components/DeleteProductButton";
import {useAdvancedProducts} from "@/features/productos/useAdvancedProducts";
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

useEffect(() => {
  //Al montar la página, limpia cualquier filtro persistente
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

  const { params, setSearch, setParams } = useProductSearchParams();
  const { user } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";

  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
const toggleSort = (key: SortKey) =>
    setLocalSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  const Arrow = ({ k }: { k: SortKey }) =>
    localSort.key !== k ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? <>▲</> : <>▼</>;


  // ---- Mapea params de la URL -> filtro y paginación/orden ----
  const q = params.get("barcodeName")?.trim() || undefined;

const filtro: ProductoFiltroDTO = useMemo(() => buildFiltro({
        active: true,
        barcodeName: q,                              // 👈 aquí
        min: params.get("min") ? Number(params.get("min")) : undefined,
        max: params.get("max") ? Number(params.get("max")) : undefined,
        categoryId: params.get("categoryId") ? Number(params.get("categoryId")) : undefined,
        available: params.get("available") === "true" ? true : undefined,
        withoutCategory: params.get("withoutCategory") === "true" ? true : undefined,
        branchId: params.get("branchId") ? Number(params.get("branchId")) : undefined,
        businessTypeId: params.get("businessTypeId") ? Number(params.get("businessTypeId")) : undefined,
}), [q, params]);


const pageUI = Number(params.get("page") ?? 1);
const size = params.get("size") ? Number(params.get("size")) || 10 : 10;

const { data, isPending, error, refetch } = useAdvancedProducts(filtro, pageUI - 1, size);


type BackendProduct = Omit<Product, "codigoBarras"> & {
  codigoBarras?: string;
  active?: boolean;
  branchId?: number;
};




const items: (Product & { active?: boolean;  branchId?: number | null  })[] = useMemo(() => {
  const backendItems = (data?.content ?? []) as BackendProduct[];

  return backendItems.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    codigoBarras: p.codigoBarras ?? p.codigoBarras ?? "",
    description: p.description,
    purchasePrice: p.purchasePrice,
    salePrice : p.salePrice,
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

const totalPages = useMemo(
  () => data?.totalPages ?? 1,
  [data]
);

const sortedItems = useMemo(() => {
  const mult = localSort.dir === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const key = localSort.key;
    const av = a[key];
    const bv = b[key];

    // 🔸 Manejo por tipo
    switch (key) {
      case "purchasePrice": {
        const an = Number(av ?? 0);
        const bn = Number(bv ?? 0);
        return (an - bn) * mult;
      }
      case "active": {
        const an = a.active ? 1 : 0;
        const bn = b.active ? 1 : 0;
        return (an - bn) * mult;
      }
      case "creationDate": {
        const ad = av ? new Date(av as string).getTime() : 0;
        const bd = bv ? new Date(bv as string).getTime() : 0;
        return (ad - bd) * mult;
      }
      default: {
        const as = String(av ?? "");
        const bs = String(bv ?? "");
        return collator.compare(as, bs) * mult;
      }
    }
  });
}, [items, localSort, collator]);

  if (isPending) return <p className="p-4">Cargando…</p>;
  if (error) return <p className="p-4 text-red-600">{(error as Error).message}</p>;

 return (
  <div className="mx-auto w-full max-w-7xl p-6 space-y-6">

    {/* ---------- HEADER ---------- */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-800">Productos</h1>

      <div className="flex gap-2 sm:order-2">
        <AddProductButton onCreated={() => refetch()} />
      </div>
    </div>

    {/* ---------- BUSCADOR RÁPIDO ---------- */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center bg-white p-4 rounded-lg shadow-sm border">

      <input
        className="
          border rounded-lg px-3 py-2 w-full
          focus:ring-2 focus:ring-blue-500 focus:outline-none
        "
        placeholder="Busca por nombre o código de barras…"
        defaultValue={params.get("barcodeName") ?? ""}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button
        className="
          border rounded-lg px-4 py-2 w-full sm:w-auto
          bg-blue-600 text-white font-medium
          hover:bg-blue-700 transition
        "
        onClick={() => refetch()}
      >
        Buscar
      </button>

      {!showAdvanced && (
        <button
          type="button"
          className="
            border rounded-lg px-4 py-2 w-full sm:w-auto
            bg-slate-100 hover:bg-slate-200
            transition font-medium
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
        <div className="bg-white p-4 rounded-lg shadow-sm border">
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
              mt-3 px-4 py-2 rounded-lg
              bg-slate-200 hover:bg-slate-300
              transition
            "
            onClick={() => setShowAdvanced(false)}
          >
            Ocultar filtros
          </button>
        </div>
      </>
    )}

    {/* ---------- LISTA MÓVIL (CARDS) ---------- */}
    <ul className="grid gap-3 md:hidden">
      {items.map((p) => (
        <li key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <p className="text-base font-semibold truncate">{p.name}</p>
              <p className="text-xs text-slate-500 mt-1">SKU: {p.sku}</p>
              <p className="text-xs text-slate-500">Código: {p.codigoBarras ?? "-"}</p>
            </div>

            <span className="font-semibold text-sm">
              {p.purchasePrice ? `$${p.purchasePrice.toFixed(2)}` : "-"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3">
            <span><b>Cat:</b> {p.categoryName ?? "-"}</span>
            <span><b>Prov:</b> {p.providerName ?? "-"}</span>

            <span className="col-span-2">
              <b>Alta:</b>{" "}
              {p.creationDate
                ? new Date(p.creationDate).toLocaleDateString("es-MX")
                : "-"}
            </span>

            {isSuper && (
              <span className="col-span-2">
                <b>Tipo:</b> {p.businessTypeName ?? "-"}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>

    {/* ---------- TABLA DESKTOP ---------- */}
    <div className="hidden md:block">
      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-100 border-b">
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
                <th key={key} className="px-3 py-2 font-medium text-slate-700">
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
                  <th className="px-3 py-2">
                    <button onClick={() => toggleSort("businessTypeName")} className="flex items-center gap-1">
                      Negocio <Arrow k="businessTypeName" />
                    </button>
                  </th>

                  <th className="px-3 py-2">
                    <button onClick={() => toggleSort("active")} className="flex items-center gap-1">
                      Activo <Arrow k="active" />
                    </button>
                  </th>
                </>
              )}

              <th className="px-3 py-2 w-40 text-slate-700">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2">{p.sku}</td>
                <td className="px-3 py-2">{p.codigoBarras ?? "-"}</td>
                <td className="px-3 py-2 truncate max-w-[260px]">{p.name}</td>
                <td className="px-3 py-2">{p.purchasePrice ? `$${p.purchasePrice.toFixed(2)}` : "-"}</td>
                <td className="px-3 py-2">{p.categoryName ?? "-"}</td>
                <td className="px-3 py-2">{p.providerName ?? "-"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.creationDate
                    ? new Date(p.creationDate).toLocaleDateString("es-MX")
                    : "-"}
                </td>

                {isSuper && (
                  <>
                    <td className="px-3 py-2">{p.businessTypeName ?? "-"}</td>
                    <td className="px-3 py-2">{p.active ? "Sí" : "No"}</td>
                  </>
                )}

                <td className="px-3 py-2">
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
                    <DeleteProductButton id={p.id} name={p.name} onDeleted={() => refetch()} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* ---------- PAGINACIÓN ---------- */}
    <div className="pt-2">
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
)
}
