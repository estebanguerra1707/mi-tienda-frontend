import { useMemo, useState, useRef, useEffect, type UIEvent as ReactUIEvent  } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTypes, useBranches } from "@/hooks/useCatalogs";
import {
  useInventory,
  type InventoryItem
} from "@/hooks/useInventory";
import AddInventoryButton from "@/features/inventario/components/AddInventoryButton";
import MarkCriticalButton from "@/features/inventario/components/MarkCriticalButton";
import EditInventarioButton from "@/features/inventario/components/EditInventoryButton";
import { useDebounced } from "@/hooks/useDebounced";
import { InventarioOwnerType } from "@/features/inventario/api";
import InventarioCard from "@/features/inventario/components/InventarioCard";
import { ServerPagination } from "@/components/pagination/ServerPagination";


const PAGE_SIZE = 20;

export default function InventarioListPage() {
  return <InventarioContent />;
}

function InventarioContent() {
  const { user, isAdmin, isSuper } = useAuth();

  type SortKey =
    | "productId"
    | "productName"
    | "branchName"
    | "stock"
    | "minStock"
    | "maxStock"
    | "isStockCritico"
    | "lastUpdatedDate";

  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "productName",
    dir: "asc",
  });

  const toggleSort = (key: SortKey) =>
    setLocalSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  const Arrow = ({ k }: { k: SortKey }) =>
    localSort.key !== k ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? <>▲</> : <>▼</>;

  // ===== UI scroll behavior (mobile) =====
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const lastScrollY = useRef(0);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const tickingRef = useRef(false);

    const handleListScroll = (e: ReactUIEvent<HTMLDivElement>) => {

    const el = e.currentTarget;
    if (tickingRef.current) return;

    tickingRef.current = true;
    requestAnimationFrame(() => {
      const current = el.scrollTop;
      const prev = lastScrollY.current;
      const diff = current - prev;

      const TOP_SHOW_PX = 30;
      const THRESHOLD = 10;

      if (current <= TOP_SHOW_PX) {
        setShowMobileHeader(true);
        lastScrollY.current = current;
        tickingRef.current = false;
        return;
      }

      lastScrollY.current = current;
      if (Math.abs(diff) < THRESHOLD) {
        tickingRef.current = false;
        return;
      }

      setShowMobileHeader(diff < 0);
      tickingRef.current = false;
    });
  };

  // ==== filtros ====
  const [page, setPage] = useState(0); // 0-based para backend
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [ownerType, setOwnerType] = useState<InventarioOwnerType | undefined>(undefined);

  // SUPER: seleccionar BT y sucursal
  const [btId, setBtId] = useState<number | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);

  const btHook = useBusinessTypes();

  const { data: branches = [], isLoading: branchesLoading } = useBranches({
    isSuper,
    businessTypeId: isSuper ? (btId ?? user?.businessType ?? null) : null,
    oneBranchId: !isSuper ? (user?.branchId ?? null) : null,
  });

  const usaInventarioPorDuenio = useMemo(() => {
    const activeBranchId = branchId ?? user?.branchId;
    if (!activeBranchId) return false;
    return branches.find((b) => b.id === activeBranchId)?.usaInventarioPorDuenio ?? false;
  }, [branches, branchId, user?.branchId]);

  const userBranchId = user?.branchId;
  const userBusinessTypeId = user?.businessType;

  const filtro = useMemo(
    () => ({
      branchId: branchId !== undefined && branchId !== null ? branchId : userBranchId ?? undefined,
      businessTypeId: btId !== undefined && btId !== null ? btId : userBusinessTypeId ?? undefined,
      ownerType,
      q: debouncedSearch.trim() || undefined,
      onlyCritical,
      page,
      size: PAGE_SIZE,
    }),
    [branchId, btId, ownerType, debouncedSearch, onlyCritical, page, userBranchId, userBusinessTypeId]
  );

  const allInv = useInventory(filtro);

  const totalPages = allInv.data?.totalPages ?? 1;

  const rows: InventoryItem[] = useMemo(() => allInv.data?.content ?? [], [allInv.data]);

  const sortedRows = useMemo(() => {
    const mult = localSort.dir === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const key = localSort.key;

      switch (key) {
        case "productId":
          return ((a.productId ?? 0) - (b.productId ?? 0)) * mult;

        case "stock":
        case "minStock":
        case "maxStock":
          return (Number(a[key] ?? 0) - Number(b[key] ?? 0)) * mult;

        case "isStockCritico":
          return ((a.isStockCritico ? 1 : 0) - (b.isStockCritico ? 1 : 0)) * mult;

        case "lastUpdatedDate": {
          const ad = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const bd = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return (ad - bd) * mult;
        }

        case "productName":
        case "branchName":
          return collator.compare(String(a[key] ?? ""), String(b[key] ?? "")) * mult;

        default:
          return 0;
      }
    });
  }, [rows, localSort, collator]);

  const refetchList = () => allInv.refetch();

  // ===== UI pagination mapping =====
  const pageUI = page + 1;

  // reset scroll on page change (mobile)
  useEffect(() => {
    setShowMobileHeader(true);
    lastScrollY.current = 0;
    listScrollRef.current?.scrollTo({ top: 0 });
  }, [pageUI]);

  // reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, onlyCritical, ownerType, btId, branchId]);

  const isEmpty = !allInv.isLoading && sortedRows.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* ===== MOBILE HEADER FIJO ===== */}
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
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 truncate">Inventario</h1>
              <p className="text-xs text-slate-500">Control de existencias por sucursal</p>
            </div>

            {(isSuper || isAdmin) && <AddInventoryButton onCreated={refetchList} />}
          </div>

          {/* Filters (mobile) */}
          <div className="grid grid-cols-2 gap-3">
            {isSuper && (
              <select
                value={btId ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  setBtId(v);
                  setBranchId(undefined);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm shadow-sm"
              >
                <option value="">{btHook.isLoading ? "Cargando…" : "Negocio: Todos"}</option>
                {(btHook.data ?? []).map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.name}
                  </option>
                ))}
              </select>
            )}

            {isSuper ? (
              <select
                value={branchId ?? ""}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm shadow-sm"
              >
                <option value="">{branchesLoading ? "Cargando…" : "Sucursal: Todas"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                readOnly
                className="h-11 rounded-2xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700"
                value={branches.find((b) => b.id === user?.branchId)?.name ?? "Sucursal asignada"}
              />
            )}

            <input
              className="col-span-2 h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ID…"
            />

            <select
              value={ownerType ?? ""}
              onChange={(e) => setOwnerType(e.target.value ? (e.target.value as InventarioOwnerType) : undefined)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
            >
              <option value="">Inventario: Todos</option>
              <option value="PROPIO">Propio</option>
              <option value="CONSIGNACION">Consignación</option>
            </select>

            <label className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlyCritical}
                onChange={(e) => setOnlyCritical(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="font-medium text-slate-700">Solo críticos</span>
            </label>

            {/* Sort mobile */}
            <select
              className="col-span-2 h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm shadow-sm"
              value={localSort.key}
              onChange={(e) => setLocalSort((s) => ({ ...s, key: e.target.value as SortKey }))}
            >
              <option value="productName">Orden: Producto</option>
              <option value="productId">Orden: ID producto</option>
              <option value="branchName">Orden: Sucursal</option>
              <option value="stock">Orden: Cantidad</option>
              <option value="minStock">Orden: Min</option>
              <option value="maxStock">Orden: Max</option>
              <option value="isStockCritico">Orden: Crítico</option>
              <option value="lastUpdatedDate">Orden: Última actualización</option>
            </select>

            <button
              className="col-span-2 h-11 rounded-2xl bg-slate-100 text-slate-700 font-semibold shadow-sm hover:bg-slate-200 transition"
              onClick={() => setLocalSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))}
            >
              Dirección: {localSort.dir === "asc" ? "Asc ▲" : "Desc ▼"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP TITLE ===== */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario</h1>
          <p className="text-sm text-slate-600">Control de existencias, mínimos y máximos</p>
        </div>

        {(isSuper || isAdmin) && <AddInventoryButton onCreated={refetchList} />}
      </div>

      {/* ===== DESKTOP FILTERS (tu grid original) ===== */}
      <div
        className="
          hidden md:grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-4
          items-end
          bg-white
          p-4
          rounded-xl
          shadow-sm
          border
          border-gray-200
        "
      >
        {isSuper && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Tipo de negocio</span>
            <select
              value={btId ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                setBtId(v);
                setBranchId(undefined);
              }}
              className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500"
            >
              <option value="">{btHook.isLoading ? "Cargando…" : "Todos…"}</option>
              {(btHook.data ?? []).map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Sucursal</span>
          {isSuper ? (
            <select
              value={branchId ?? ""}
              onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : undefined)}
              className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500"
            >
              <option value="">{branchesLoading ? "Cargando…" : "Todas…"}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              readOnly
              className="border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
              value={branches.find((b) => b.id === user?.branchId)?.name ?? "Sucursal asignada"}
            />
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Buscar producto</span>
          <input
            className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o ID"
          />
        </label>

        <label className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            checked={onlyCritical}
            onChange={(e) => setOnlyCritical(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-gray-700">Solo críticos</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Tipo de inventario</span>
          <select
            value={ownerType ?? ""}
            onChange={(e) => setOwnerType(e.target.value ? (e.target.value as InventarioOwnerType) : undefined)}
            className="border rounded-lg px-3 py-2 bg-white shadow-sm"
          >
            <option value="">Todos</option>
            <option value="PROPIO">Propio</option>
            <option value="CONSIGNACION">Consignación</option>
          </select>
        </label>
      </div>

      {/* ===== MOBILE LIST (scrollable) ===== */}
      <div
        ref={listScrollRef}
        onScroll={handleListScroll}
        className="
          md:hidden
          pt-[240px]
          pb-[calc(72px+env(safe-area-inset-bottom))]
          overflow-y-auto
          overflow-x-hidden
          w-full max-w-full
          h-[calc(100dvh-64px)]
          overscroll-contain
          touch-pan-y
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {allInv.isLoading && (
          <div className="rounded-2xl border bg-white p-4 text-center text-gray-500 shadow-sm">Cargando…</div>
        )}

        {isEmpty && (
          <div className="rounded-2xl border bg-white p-6 text-center text-gray-500 shadow-sm">Sin registros</div>
        )}

        {!allInv.isLoading && !isEmpty && (
          <div className="space-y-3">
            {sortedRows.map((row) => (
              <InventarioCard
                key={`${row.productId}-${row.branchId}-${row.ownerType}`}
                row={row}
                usaInventarioPorDuenio={usaInventarioPorDuenio}
                canEdit={isSuper || isAdmin}
                onUpdated={refetchList}
              />
            ))}
          </div>
        )}
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
         onChange={(nextPageUI: number) => {
            setPage(nextPageUI - 1); // UI 1-based -> backend 0-based
            listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      {/* ===== DESKTOP TABLE ===== */}
      <div className="hidden md:block rounded-xl border bg-white shadow overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-[1000px] w-full text-sm text-gray-700">
            <thead className="bg-slate-100 border-b sticky top-0 z-10">
              <tr className="text-gray-700">
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort("productId")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
                    ID Producto <Arrow k="productId" />
                  </button>
                </th>

                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort("productName")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
                    Producto <Arrow k="productName" />
                  </button>
                </th>

                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort("branchName")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
                    Sucursal <Arrow k="branchName" />
                  </button>
                </th>

                {usaInventarioPorDuenio && <th className="px-4 py-3 text-left font-semibold">Tipo de dueño</th>}

                <th className="px-4 py-3 text-right">
                  <button onClick={() => toggleSort("stock")} className="flex items-center justify-end gap-1 font-semibold hover:text-blue-600 w-full">
                    Cantidad <Arrow k="stock" />
                  </button>
                </th>

                <th className="px-4 py-3 text-right">
                  <button onClick={() => toggleSort("minStock")} className="flex items-center justify-end gap-1 font-semibold hover:text-blue-600 w-full">
                    Min <Arrow k="minStock" />
                  </button>
                </th>

                <th className="px-4 py-3 text-right">
                  <button onClick={() => toggleSort("maxStock")} className="flex items-center justify-end gap-1 font-semibold hover:text-blue-600 w-full">
                    Máx <Arrow k="maxStock" />
                  </button>
                </th>

                <th className="px-4 py-3 text-center font-semibold">Crítico</th>

                {(isSuper || isAdmin) && <th className="px-4 py-3">Última actualización</th>}
                {(isSuper || isAdmin) && <th className="px-4 py-3">Actualizado por</th>}

                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {allInv.isLoading && (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-gray-500">
                    Cargando…
                  </td>
                </tr>
              )}

              {!sortedRows.length && !allInv.isLoading && (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-gray-500">
                    Sin registros
                  </td>
                </tr>
              )}

              {sortedRows.map((row) => (
                <tr key={`${row.productId}-${row.branchId}-${row.ownerType}`} className="hover:bg-blue-50 transition cursor-pointer">
                  <td className="px-4 py-3">{row.productId}</td>

                  <td className="px-4 py-3 max-w-[220px] truncate font-medium">{row.productName}</td>

                  <td className="px-4 py-3">{row.branchName}</td>

                  {usaInventarioPorDuenio && (
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.ownerType === "PROPIO" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {row.ownerType === "PROPIO" ? "Propio" : "Consignación"}
                      </span>
                    </td>
                  )}

                  <td className="px-4 py-3 text-right tabular-nums">{row.stock}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.minStock ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.maxStock ?? "—"}</td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        row.isStockCritico ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700"
                      }`}
                    >
                      {row.isStockCritico ? "Crítico" : "OK"}
                    </span>
                  </td>

                  {(isSuper || isAdmin) && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString("es-MX") : "—"}
                    </td>
                  )}

                  {(isSuper || isAdmin) && <td className="px-4 py-3">{row.updatedBy ?? "—"}</td>}

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      <EditInventarioButton row={row} onUpdated={refetchList} />
                      <MarkCriticalButton id={row.id} current={!!row.isStockCritico} onUpdated={refetchList} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINACIÓN DESKTOP ===== */}
      <div className="hidden md:flex pt-2 justify-end">
        <ServerPagination
          page={pageUI}
          totalPages={totalPages}
          onChange={(nextPageUI: number) => setPage(nextPageUI - 1)}
        />
      </div>
    </div>
  );
}
