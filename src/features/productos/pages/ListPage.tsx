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
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-6 space-y-4">
      {/* Header + acción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <div className="flex gap-2 sm:order-2">
          <AddProductButton onCreated={() => refetch()} />
        </div>
      </div>

      {/* Buscador rapido */}
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Busca por nombre o código de barras"
          defaultValue={params.get("barcodeName") ?? ""}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="border rounded px-3 py-2 w-full sm:w-auto" onClick={() => refetch()}>
          Buscar
        </button>

        {/* 🔹 Este botón ahora solo abre el panel */}
        {!showAdvanced && (
          <button
            type="button"
            className="border rounded px-3 py-2 w-full sm:w-auto"
            onClick={() => setShowAdvanced(true)}
          >
            Búsqueda avanzada
          </button>
        )}
      </div>

      {/* Panel de filtros avanzados */}
      {showAdvanced && (
         <AdvancedFilters
          params={params}
          onApply={(next) => {
            const sp = new URLSearchParams(params);
          sp.delete("");
          Object.entries(next).forEach(([k, v]) => {
            if (v == null || v === "") sp.delete(k);
            else sp.set(k, v);
          });
          setParams(sp); 
          }}        />
      )}
      {showAdvanced && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            className="border rounded px-3 py-2 w-full sm:w-auto"
            onClick={() => setShowAdvanced(false)}
          >
            Ocultar filtros
          </button>
        </div>
      )}


      {/* ====== Móvil: cards ====== */}
      <ul className="grid gap-3 md:hidden">
        {items.map((p) => (
          <li key={p.id} className="rounded-lg border bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">SKU: {p.sku}</p>
                <p className="mt-0.5 text-xs text-slate-500">Código: {p.codigoBarras ?? "-"}</p>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {p.purchasePrice != null ? `$${p.purchasePrice.toFixed(2)}` : "-"}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <span><b>Cat.</b> {p.categoryName ?? "-"}</span>
              <span><b>Prov.</b> {p.providerName ?? "-"}</span>
              <span className="col-span-2">
                <b>Alta:</b>{" "}
               {p.creationDate
              ? (isSuper
                  ? new Date(p.creationDate).toLocaleString("es-MX", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                    })
                  : new Date(p.creationDate).toLocaleDateString("es-MX", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    }))
              : "-"}
              </span>
              {isSuper && (
                <span className="col-span-2">
                  <b>Tipo de negocio:</b> {p.businessTypeName ?? "-"}
                </span>
              )}
            </div>
          </li>
        ))}

        {items.length === 0 && (
          <li className="rounded-lg border bg-white p-6 text-center text-slate-500">
            Sin resultados
          </li>
        )}
      </ul>

      {/* ====== Desktop: tabla ====== */}
      <div className="relative hidden md:block">
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-[900px] w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
               <tr className="[&>th]:text-left [&>th]:px-3 [&>th]:py-2">
                <th>
                  <button onClick={() => toggleSort("sku")} className="flex items-center gap-1">
                    SKU <Arrow k="sku" />
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("codigoBarras")} className="flex items-center gap-1">
                    Código de barras <Arrow k="codigoBarras" />
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                    Nombre <Arrow k="name" />
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("purchasePrice")} className="flex items-center gap-1">
                    Precio compra <Arrow k="purchasePrice" />
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("categoryName")} className="flex items-center gap-1">
                    Categoría <Arrow k="categoryName" />
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("providerName")} className="flex items-center gap-1">
                    Nombre Proveedor <Arrow k="providerName" />
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("creationDate")} className="flex items-center gap-1">
                    Fecha de alta <Arrow k="creationDate" />
                  </button>
                </th>
                {isSuper && (
                  <th>
                    <button onClick={() => toggleSort("businessTypeName")} className="flex items-center gap-1">
                      Tipo de negocio <Arrow k="businessTypeName" />
                    </button>
                  </th>
                )}
                {isSuper && (
                  <th>
                    <button onClick={() => toggleSort("active")} className="flex items-center gap-1">
                      Activo <Arrow k="active" />
                    </button>
                  </th>
                )}
                <th className="w-40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((p) => (
                <tr key={p.id} className="border-t [&>td]:px-3 [&>td]:py-2 hover:bg-slate-50">
                  <td className="whitespace-nowrap">{p.sku}</td>
                  <td className="whitespace-nowrap">{p.codigoBarras ?? "-"}</td>
                  <td className="max-w-[260px] truncate">{p.name}</td>
                  <td className="whitespace-nowrap">
                    {p.purchasePrice != null ? `$${p.purchasePrice.toFixed(2)}` : "-"}
                  </td>
                  <td className="truncate">{p.categoryName ?? "-"}</td>
                  <td className="truncate">{p.providerName ?? "-"}</td>
                  <td className="whitespace-nowrap">
                    {p.creationDate
                      ? (
                          isSuper
                            ? new Date(p.creationDate).toLocaleString("es-MX", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              })
                            : new Date(p.creationDate).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                        )
                      : "-"}
                  </td>
                  {isSuper && <td className="truncate">{p.businessTypeName ?? "-"}</td>}
                  {isSuper && <td className="truncate">{p.active ? "Sí" : "No"}</td>}
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
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

              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={isSuper ? 9 : 8} className="px-3 py-6 text-center text-slate-500">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm">
             Página {(data?.number ?? 0) + 1} / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
