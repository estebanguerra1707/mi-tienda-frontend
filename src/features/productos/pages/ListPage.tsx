import { useMemo, useState, useEffect, useRef, type ComponentProps, type UIEvent } from "react";
import { useProductSearchParams } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import AddProductButton from "@/features/productos/components/AddProductButton";
import DeleteProductButton from "@/features/productos/components/DeleteProductButton";
import { useAdvancedProducts } from "@/features/productos/useAdvancedProducts";
import { buildFiltro, type ProductoFiltroDTO } from "@/features/productos/productos.api";
import AdvancedFilters from "@/features/productos/components/AdvancedFilters";
import { ServerPagination } from "@/components/pagination/ServerPagination";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";
import { BackendProductDTO } from "@/features/productos/productos.api";
import { useBranches } from "@/hooks/useCatalogs";
import EditProductButton from "@/features/productos/components/EditProductButton";

type EditableProduct = ComponentProps<typeof EditProductButton>["product"];


type SortKey =
  | "sku"
  | "codigoBarras"
  | "name"
  | "stock"
  | "purchasePrice"
  | "categoryName"
  | "salePrice"
  | "creationDate"
  | "businessTypeName"
  | "active"
  | "inventarioOwnerType";

export default function ListPage() {
  const { params, setSearch, setParams } = useProductSearchParams();
  const { user } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const { data: branches = [], isLoading: branchesLoading } = useBranches({
    isSuper,
  });
const cleanedRef = useRef(false);
const [productToEdit, setProductToEdit] = useState<EditableProduct | null>(null);
const [editOpen, setEditOpen] = useState(false);
const canEditDelete = isSuper || isAdmin;

const openEdit = (p: EditableProduct) => {
  if (!canEditDelete) return;
  setProductToEdit(p);
  setEditOpen(true);
};


useEffect(() => {
  if (cleanedRef.current) return;
  cleanedRef.current = true;

  const filtroKeys = [
    "min",
    "max",
    "categoryId",
    "available",
    "withoutCategory",
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
    key: "creationDate",
    dir: "desc",
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

  const min = params.get("min");
  const max = params.get("max");
  const categoryId = params.get("categoryId");
  const available = params.get("available");
  const withoutCategory = params.get("withoutCategory");
  const businessTypeId = params.get("businessTypeId");
  const [showMobileHeader, setShowMobileHeader] = useState(true);
const lastScrollY = useRef(0);

const branchIdParam = params.get("branchId");
const selectedFromParams = branchIdParam ? Number(branchIdParam) : null;
const listScrollRef = useRef<HTMLDivElement | null>(null);


const effectiveBranchId = isSuper ? selectedFromParams : user?.branchId ?? null;

const canFetchProducts = !isSuper || !!effectiveBranchId;

const filtro: ProductoFiltroDTO = useMemo(() => {
  return buildFiltro({
    active: true,
    barcodeName: q,
    min: min ? Number(min) : undefined,
    max: max ? Number(max) : undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    available: available === "true" ? true : undefined,
    withoutCategory: withoutCategory === "true" ? true : undefined,
    branchId: effectiveBranchId ?? undefined,
    businessTypeId: businessTypeId ? Number(businessTypeId) : undefined,
  });
}, [
  q,
  min,
  max,
  categoryId,
  available,
  withoutCategory,
  effectiveBranchId,
  businessTypeId,
]);


  const pageUI = Number(params.get("page") ?? 1);

  
  const size = params.get("size") ? Number(params.get("size")) || 10 : 10;

useEffect(() => {
  setShowMobileHeader(true);
  lastScrollY.current = 0;
  listScrollRef.current?.scrollTo({ top: 0 });
}, [pageUI]);
useEffect(() => {
  lastScrollY.current = listScrollRef.current?.scrollTop ?? 0;
}, []);

  const safeFiltro =
  filtro ??
  buildFiltro({
    active: true,
  });

  const { data, isPending, error, refetch } =
  useAdvancedProducts(
    safeFiltro,
    pageUI - 1,
    size,
    {
      enabled: canFetchProducts,
    }
  );

  useEffect(() => {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout>;

    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        const code = buffer.trim();
        buffer = "";
        if (code.length > 2) {
          setSearch(code);
        }
        return;
      }

      if (ev.key.length === 1) buffer += ev.key;

      clearTimeout(timeout);
      timeout = setTimeout(() => (buffer = ""), 120);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setSearch]);




const sortedItems = useMemo(() => {
  const content = (data?.content ?? []) as BackendProductDTO[];

  const unique = Array.from(
    new Map(
      content.map((p) => {
        const barcode = (p.codigoBarras ?? "")
          .trim()
          .replace(/\s+/g, "");

        const owner: "PROPIO" | "CONSIGNACION" =
          p.inventarioOwnerType === "CONSIGNACION"
            ? "CONSIGNACION"
            : "PROPIO";
        const key = `${barcode}-${owner}-${p.branchId ?? "global"}`;

        return [
          key,
          {
            id: p.id,
            name: p.name,
            sku: p.sku,
            codigoBarras: barcode,
            description: p.description,
            purchasePrice: Number(p.purchasePrice),
            salePrice: Number(p.salePrice),
            categoryId: p.categoryId,
            categoryName: p.categoryName,
            providerId: p.providerId,
            providerName: p.providerName,
            businessTypeId: p.businessTypeId,
            businessTypeName: p.businessTypeName,
            creationDate: p.creationDate,
            branchId: p.branchId ?? null,
            active: Boolean(p.active),
            stock: Number(p.stock ?? 0),
            usaInventarioPorDuenio: Boolean(p.usaInventarioPorDuenio),
            inventarioOwnerType: owner,
          },
        ] as const;
      })
    ).values()
  );


  const dir = localSort.dir === "asc" ? 1 : -1;

  return [...unique].sort((a, b) => {
    const av = a[localSort.key];
    const bv = b[localSort.key];

    if (av == null && bv == null) return 0;
    if (av == null) return -1 * dir;
    if (bv == null) return 1 * dir;

    switch (localSort.key) {
      case "stock":
        return (Number(av) - Number(bv)) * dir;
      case "purchasePrice":
      case "salePrice":
        return (Number(av) - Number(bv)) * dir;
      case "creationDate":
        return (
          new Date(av as string).getTime() -
          new Date(bv as string).getTime()
        ) * dir;
      default:
        return collator.compare(String(av), String(bv)) * dir;
    }
  });
}, [data?.content, localSort, collator]);


const canShowProductsUI = !isSuper || !!effectiveBranchId;
const tickingRef = useRef(false);

const handleListScroll = (e: UIEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  if (tickingRef.current) return;

  tickingRef.current = true;

  requestAnimationFrame(() => {
    const current = el.scrollTop;
    const prev = lastScrollY.current;
    const diff = current - prev;

    const TOP_SHOW_PX = 40;
    const THRESHOLD = 10; // súbelo si quieres menos sensibilidad

    // Cerca del top: siempre visible
    if (current <= TOP_SHOW_PX) {
      setShowMobileHeader(true);
      lastScrollY.current = current;
      tickingRef.current = false;
      return;
    }

    // Siempre actualiza prev para que no se "atasque"
    lastScrollY.current = current;

    // Si el movimiento es pequeño, no cambies el estado
    if (Math.abs(diff) < THRESHOLD) {
      tickingRef.current = false;
      return;
    }

    // Bajando => ocultar | Subiendo => mostrar
    setShowMobileHeader(diff < 0);

    tickingRef.current = false;
  });
};

  const totalPages = data?.totalPages ?? 1;
  const [showScanner, setShowScanner] = useState(false);
  const isEmpty =
    !isPending &&
    canShowProductsUI &&
    sortedItems.length === 0;

  if (isPending && canFetchProducts) {
    return <p className="p-4">Cargando…</p>;
  }
  if (error) return <p className="p-4 text-red-600">{(error as Error).message}</p>;
  function StockBadge({ stock }: { stock: number }) {
  if (stock > 5) {
    return <span className="text-green-700 font-semibold">{stock}</span>;
  }

  if (stock > 0) {
    return <span className="text-yellow-600 font-semibold">{stock}</span>;
  }


  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
      Sin inventario
    </span>
  );
}
  function stockTextClass(stock: number) {
  return stock === 0
    ? "text-red-600 font-bold"
    : stock <= 5
    ? "text-yellow-600 font-semibold"
    : "text-green-700 font-medium";
}



  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {isSuper && (
        <div className="bg-white border rounded-xl p-4">
          <label className="block text-sm font-medium mb-1">
            Selecciona sucursal
          </label>

          <select
            className="w-full h-10 border rounded-lg px-3"
            value={selectedBranchId ?? ""}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              setSelectedBranchId(value);
              const sp = new URLSearchParams(params);
              if (value) sp.set("branchId", String(value));
              else sp.delete("branchId");
              sp.set("page", "1");
              setParams(sp);
            }}
            disabled={branchesLoading}
          >
            <option value="">
              {branchesLoading
                ? "Cargando sucursales..."
                : "— Selecciona una sucursal —"}
            </option>

            {branches.map((b: { id: number; name: string }) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {isSuper && !effectiveBranchId && (
            <div className="mt-4 text-slate-500 text-center py-6 bg-white rounded-xl shadow border">
              Selecciona una sucursal para ver los productos.
            </div>
          )}
        </div>
      )}

      {canShowProductsUI && (
           <>
      {/* ===== MOBILE HEADER FIJO (PRO) ===== */}
      <div
        className={`
          md:hidden
          fixed top-[64px] left-0 right-0 z-40
          
          bg-white border-b shadow-sm
          
          transition-transform duration-300 ease-out
          
          ${showMobileHeader ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="px-3 pt-3 pb-3 space-y-3">

          {/* título + agregar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Productos</h1>
              <p className="text-xs text-slate-500">
                Busca por nombre o código
              </p>
            </div>

            <AddProductButton onCreated={() => refetch()} />
          </div>

          {/* ===== SEARCH + ACTIONS (mobile/tablet PRO) ===== */}
  <div className="space-y-3">

  {/* SEARCH */}
      <div className="relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 text-lg">
              🔍
            </span>

            <input
              inputMode="search"
              className="
                w-full
                h-12
                
                rounded-2xl
                bg-slate-50
                
                pl-12 pr-4
                
                text-sm sm:text-base
                
                border border-slate-200
                
                shadow-sm
                focus:ring-2 focus:ring-blue-500
                focus:bg-white
                
                transition
              "
              placeholder="Buscar producto o código…"
              defaultValue={params.get("barcodeName") ?? ""}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ACTIONS */}
          <div className="
            grid
            grid-cols-2
            gap-3
            
            sm:grid-cols-3
          ">

            {/* ESCANEAR */}
            <button
              className="
                h-12
                
                rounded-2xl
                
                bg-green-600
                text-white
                
                font-semibold
                
                shadow-sm hover:shadow-md
                hover:bg-green-700
                
                active:scale-[0.98]
                transition
                
                flex items-center justify-center gap-2
              "
              onClick={() => setShowScanner(true)}
            >
              <span className="text-lg">📷</span>
              <span>Escanear</span>
            </button>

            {/* BUSCAR */}
            <button
              className="
                h-12
                
                rounded-2xl
                
                bg-blue-600
                text-white
                
                font-semibold
                
                shadow-sm hover:shadow-md
                hover:bg-blue-700
                
                active:scale-[0.98]
                transition
                
                flex items-center justify-center gap-2
              "
              onClick={() => {
                const sp = new URLSearchParams(params);
                sp.set("page", "1");
                setParams(sp);
              }}
            >
              <span className="text-lg">🔎</span>
              <span>Buscar</span>
            </button>

            {/* FILTROS (tablet) */}
            <button
              className="
                hidden sm:flex
                
                h-12
                
                rounded-2xl
                
                bg-slate-100
                text-slate-700
                
                font-semibold
                
                shadow-sm hover:shadow-md
                hover:bg-slate-200
                
                transition
                
                items-center justify-center gap-2
              "
              onClick={() => setShowAdvanced(true)}
            >
              ⚙️ Filtros
            </button>

          </div>
        </div>

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
            onClick={() => {
              const sp = new URLSearchParams(params);
              sp.set("page", "1");
              setParams(sp);
            }}
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
            onClose={() => setShowAdvanced(false)}
          />
        </div>
      )}
      {/* ===== Lista MOBILE (cards compactas) ===== */}     
      <div
          ref={listScrollRef}
          onScroll={handleListScroll}
          className="
            md:hidden
            pt-[160px]
            pb-[calc(72px+env(safe-area-inset-bottom))]
            overflow-y-auto
            h-[calc(100dvh-64px)]
            overscroll-contain
            touch-pan-y

            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >  
        <ul className="grid grid-cols-1 gap-3 w-full max-w-full">
        {sortedItems.map((p) => (
       <li
            key={`mobile-${p.id}-${p.branchId ?? 0}-${p.inventarioOwnerType ?? "PROPIO"}`}
            onClick={() => openEdit(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openEdit(p);
            }}
            className="rounded-2xl border bg-white p-4 shadow-sm active:scale-[0.995] transition cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base text-slate-900 truncate">{p.name}</p>
                  <div className="mt-1 space-y-0.5">
                   <p className="text-xs flex min-w-0 gap-1 text-slate-500">
                    Código barras: <span className="text-slate-700">{p.codigoBarras || "-"}</span>
                  </p>
                  <p className="text-xs text-slate-500 flex min-w-0 gap-1">SKU: <span className="text-slate-700">{p.sku || "-"}</span></p>
                  {p.categoryName && (
                    <p className="text-xs text-slate-500">
                      Categoría: <span className="text-slate-700">{p.categoryName}</span>
                    </p>
                  )}
                   <p className="text-[11px] flex items-center gap-1  min-w-0">
                    Existencia:
                    <span className={stockTextClass(p.stock)}>
                    <StockBadge stock={p.stock} />
                     </span>

                    {p.stock === 0 && (
                      <span className="ml-1 text-[10px] text-red-500 font-medium">
                        (sin existencia)
                      </span>
                    )}
                  </p>
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

            {canEditDelete && (
              <div
                className="w-full"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <DeleteProductButton
                  id={p.id}
                  name={p.name}
                  onDeleted={() => refetch()}
                />
              </div>
            )}
          </li>
        ))}
       </ul>
      </div>
      {/* ===== PAGINACIÓN MOBILE (FIJA) ===== */}
      <div
        className="
          md:hidden
          fixed bottom-0 left-0 right-0 z-40
          bg-white border-t shadow-sm
          px-3 py-2
        "
      >
        <ServerPagination
          page={pageUI}
          totalPages={totalPages}
          onChange={(nextPage) => {
            const sp = new URLSearchParams(params);
            sp.set("page", String(nextPage));
            setParams(sp);
            listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
      
      {isEmpty && (
        <div className="bg-white border rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-lg font-semibold text-slate-900">
            No se encontraron productos disponibles
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            No hay productos que coincidan con los filtros seleccionados
            {effectiveBranchId && " para esta sucursal"}.
          </p>
        </div>
      )}
      {/* ===== Tabla DESKTOP ===== */}
      {!isEmpty && (
      <div className="hidden md:block rounded-2xl border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50 border-b sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                  Nombre <Arrow k="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("codigoBarras")} className="flex items-center gap-1">
                  Código <Arrow k="codigoBarras" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("sku")} className="flex items-center gap-1">
                  SKU <Arrow k="sku" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("stock")} className="flex items-center gap-1">
                  Existencia <Arrow k="stock" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("purchasePrice")} className="flex items-center gap-1">
                  Compra <Arrow k="purchasePrice" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("salePrice")} className="flex items-center gap-1">
                  Venta <Arrow k="salePrice" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("categoryName")} className="flex items-center gap-1">
                  Categoría <Arrow k="categoryName" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("creationDate")} className="flex items-center gap-1">
                  Alta <Arrow k="creationDate" />
                </button>
              </th>

              {isSuper && (
                <>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("businessTypeName")} className="flex items-center gap-1">
                      Negocio <Arrow k="businessTypeName" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("active")} className="flex items-center gap-1">
                      Activo <Arrow k="active" />
                    </button>
                  </th>
                </>
              )}

              {(isSuper || isAdmin) && (
                <th className="px-4 py-3 text-left">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((p) => (
              <tr
                  key={`desktop-${p.id}-${p.branchId ?? 0}-${p.inventarioOwnerType ?? "PROPIO"}`}
                  onClick={() => openEdit(p)}
                  className="border-t hover:bg-slate-50 transition cursor-pointer"
                >
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>                
                <td className="px-4 py-3">{p.codigoBarras ?? "-"}</td>
                <td className="px-4 py-3">{p.sku}</td>
                <td className="px-4 py-3">
                {p.stock === 0 ? (
                  <div
                    className="
                      flex flex-col items-start gap-1
                      sm:flex-row sm:items-center sm:gap-2
                    "
                  >
                    <span
                      className={`
                        text-[8px] sm:text-xs
                        inline-flex items-center justify-center
                        min-w-[28px] h-6 px-2 rounded-full
                        bg-red-100
                        ${stockTextClass(p.stock)}
                      `}
                    >
                      {p.stock}
                    </span>

                    {/* Leyenda visual */}
                    <span
                      className="
                        inline-flex items-center gap-1
                        text-xs font-medium
                        text-red-600
                        bg-red-50
                        px-2 py-1
                        rounded-md
                        border border-red-100
                        whitespace-nowrap
                      "
                    >
                       Compra más producto
                    </span>
                  </div>
                ) : (
                  <span className={stockTextClass(p.stock)}>
                    <StockBadge stock={p.stock} />
                  </span>
                )}
              </td>
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

                {canEditDelete && (
                  <td className="px-4 py-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteProductButton
                        id={p.id}
                        name={p.name}
                        onDeleted={() => refetch()}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
     )}
     

      {/* ===== Paginación DESKTOP ===== */}
      <div className="hidden md:flex pt-2 justify-end">
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
           </>
          )}
      {productToEdit && (
          <EditProductButton
            product={productToEdit}
            paramsActuales={{
              barcodeName: params.get("barcodeName") ?? "",
              page: pageUI,
              pageSize: size,
            }}
            open={editOpen}
            hideTrigger
            onOpenChange={(v: boolean) => {
              setEditOpen(v);
              if (!v) setProductToEdit(null);
            }}
            onUpdated={() => {
              refetch();
              setEditOpen(false);
              setProductToEdit(null);
            }}
          />
        )}
    </div>
    
  );
}
