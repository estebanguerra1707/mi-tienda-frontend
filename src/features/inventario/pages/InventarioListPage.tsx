import { useMemo, useState } from "react";
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

const PAGE_SIZE = 20;

export default function InventarioListPage() {
  return <InventarioContent />;
}

function InventarioContent() {
  const { user, hasRole } = useAuth() as unknown as {
    user?: { businessTypeId?: number; branchId?: number; branchName?: string };
    hasRole?: (r: "ADMIN" | "SUPER_ADMIN") => boolean;
  };

  const isSuper = hasRole?.("SUPER_ADMIN") ?? false;
  const isAdmin = hasRole?.("ADMIN") ?? false;

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
    localSort.key !== k ? (
      <span className="opacity-40">↕︎</span>
    ) : localSort.dir === "asc" ? (
      <>▲</>
    ) : (
      <>▼</>
    );

  // ==== filtros ====
  const [page, setPage] = useState(0);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);

  // SUPER: seleccionar BT y sucursal
  const [btId, setBtId] = useState<number | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);

  const btHook = useBusinessTypes();
  const branchesHook = useBranches({
    isSuper,
    businessTypeId: isSuper ? (btId ?? user?.businessTypeId ?? null) : null,
    oneBranchId: !isSuper ? (user?.branchId ?? null) : null,
  });

  // ==== DATA ====
  const filtro = useMemo(
    () => ({
      branchId: branchId ?? user?.branchId,
      businessTypeId: btId ?? user?.businessTypeId,
      q: debouncedSearch.trim() || undefined,
      onlyCritical,
      page,
      size: PAGE_SIZE,
    }),
    [branchId, btId, debouncedSearch, onlyCritical, page, user]
  );

  const allInv = useInventory(filtro);

  const rows: InventoryItem[] = useMemo(() => {
    const base = allInv.data?.content ?? [];

    if (isSuper)
      return base.filter((r) => !branchId || r.branchId === branchId);

    return base;
  }, [allInv.data, branchId, isSuper]);

  const totalPages = allInv.data?.totalPages ?? 1;

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
        Inventario
      </h1>

      {/* FILTROS UI PRO */}
      <div className="
        grid gap-4 
        sm:grid-cols-2 
        lg:grid-cols-4 
        items-end 
        bg-white 
        p-4 
        rounded-xl 
        shadow-sm 
        border 
        border-gray-200
      ">

        {isSuper && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Tipo de negocio</span>
            <select
              value={btId ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                setBtId(v);
                setBranchId(undefined);
                setPage(0);
              }}
              className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500"
            >
              <option value="">
                {btHook.isLoading ? "Cargando…" : "Todos…"}
              </option>
              {(btHook.data ?? []).map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
          </label>
        )}

        {/* Sucursal */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Sucursal</span>
          {isSuper ? (
            <select
              value={branchId ?? ""}
              onChange={(e) => {
                setBranchId(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
              className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500"
            >
              <option value="">
                {branchesHook.loading ? "Cargando…" : "Todas…"}
              </option>
              {branchesHook.data.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : (
            <input
              readOnly
              className="border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
              value={user?.branchName ?? "Sucursal asignada"}
            />
          )}
        </label>

        {/* Buscar */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Buscar producto</span>
          <input
            className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Nombre o ID"
          />
        </label>

        {/* Solo críticos */}
        <label className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            checked={onlyCritical}
            onChange={(e) => {
              setOnlyCritical(e.target.checked);
              setPage(0);
            }}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-gray-700">Solo críticos</span>
        </label>
      </div>

      {/* Botón agregar */}
      <div className="flex justify-end pt-2">
        {isSuper && <AddInventoryButton onCreated={refetchList} />}
      </div>

      {/* TABLA PRO */}
      <div className="overflow-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-[900px] w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b">
            <tr>
              <th className="px-3 py-3 text-left font-semibold">
                <button onClick={() => toggleSort("productId")} className="flex items-center gap-1">
                  ID Producto <Arrow k="productId" />
                </button>
              </th>

              <th className="px-3 py-3 text-left font-semibold">
                <button onClick={() => toggleSort("productName")} className="flex items-center gap-1">
                  Producto <Arrow k="productName" />
                </button>
              </th>

              <th className="px-3 py-3 text-left font-semibold">
                <button onClick={() => toggleSort("branchName")} className="flex items-center gap-1">
                  Sucursal <Arrow k="branchName" />
                </button>
              </th>

              <th className="px-3 py-3 text-right font-semibold">
                <button onClick={() => toggleSort("stock")} className="flex items-center gap-1">
                  Cantidad <Arrow k="stock" />
                </button>
              </th>

              <th className="px-3 py-3 text-right font-semibold">
                <button onClick={() => toggleSort("minStock")} className="flex items-center gap-1">
                  Mín <Arrow k="minStock" />
                </button>
              </th>

              <th className="px-3 py-3 text-right font-semibold">
                <button onClick={() => toggleSort("maxStock")} className="flex items-center gap-1">
                  Máx <Arrow k="maxStock" />
                </button>
              </th>

              <th className="px-3 py-3 text-center font-semibold">Crítico</th>

              {(isSuper || isAdmin) && (
                <th className="px-3 py-3 text-left font-semibold">
                  Última actualización
                </th>
              )}

              {(isSuper || isAdmin) && (
                <th className="px-3 py-3 text-left font-semibold">
                  Actualizado por
                </th>
              )}

              <th className="px-3 py-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {allInv.isLoading && (
              <tr>
                <td className="p-4" colSpan={9}>Cargando…</td>
              </tr>
            )}

            {!sortedRows.length && !allInv.isLoading && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={9}>
                  Sin registros
                </td>
              </tr>
            )}

            {allInv.isError && (
              <tr>
                <td colSpan={9} className="p-4 text-red-600">
                  Error al cargar el inventario: {(allInv.error as Error)?.message ?? "Error desconocido"}
                </td>
              </tr>
            )}

            {sortedRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">

                <td className="px-3 py-2">{row.productId}</td>

                <td className="px-3 py-2 max-w-[200px] truncate">
                  {row.productName ?? row.productId}
                </td>

                <td className="px-3 py-2">{row.branchName ?? row.branchId}</td>

                <td className="px-3 py-2 text-right tabular-nums">{row.stock}</td>

                <td className="px-3 py-2 text-right tabular-nums">{row.minStock ?? "—"}</td>

                <td className="px-3 py-2 text-right tabular-nums">{row.maxStock ?? "—"}</td>

                <td className="px-3 py-2 text-center">
                  <span
                    className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                      ${row.isStockCritico
                        ? "bg-red-100 text-red-700"
                        : "bg-green-50 text-green-700"}
                    `}
                  >
                    {row.isStockCritico ? "Crítico" : "OK"}
                  </span>
                </td>

                {(isSuper || isAdmin) && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.lastUpdated
                      ? new Date(row.lastUpdated).toLocaleString("es-MX")
                      : "—"}
                  </td>
                )}

                {(isSuper || isAdmin) && (
                  <td className="px-3 py-2">{row.updatedBy ?? "—"}</td>
                )}

                <td className="px-3 py-2 text-center whitespace-nowrap space-x-2">
                  <EditInventarioButton row={row} onUpdated={refetchList} />
                  <MarkCriticalButton id={row.id} current={!!row.isStockCritico} onUpdated={refetchList} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Anterior
        </button>

        <span className="text-sm text-gray-600">
          Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong>
        </span>

        <button
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
