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
import { InventarioOwnerType } from "@/features/inventario/api";
import InventarioCard from "@/features/inventario/components/InventarioCard";


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
  const [ownerType, setOwnerType] = useState<InventarioOwnerType | undefined>(undefined);


  // SUPER: seleccionar BT y sucursal
  const [btId, setBtId] = useState<number | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);

  const btHook = useBusinessTypes();

const {
  data: branches = [],
  isLoading: branchesLoading,
} = useBranches({
  isSuper,
  businessTypeId: isSuper ? (btId ?? user?.businessType ?? null) : null,
  oneBranchId: !isSuper ? (user?.branchId ?? null) : null,
});

const usaInventarioPorDuenio = useMemo(() => {
  const activeBranchId = branchId ?? user?.branchId;
  if (!activeBranchId) return false;

  return (
    branches.find(b => b.id === activeBranchId)?.usaInventarioPorDuenio ?? false
  );
}, [branches, branchId, user?.branchId]);

const userBranchId = user?.branchId;
const userBusinessTypeId = user?.businessType;

const filtro = useMemo(
  () => ({
    branchId:
      branchId !== undefined && branchId !== null
        ? branchId
        : userBranchId ?? undefined,

    businessTypeId:
      btId !== undefined && btId !== null
        ? btId
        : userBusinessTypeId ?? undefined,

    ownerType,
    q: debouncedSearch.trim() || undefined,
    onlyCritical,
    page,
    size: PAGE_SIZE,
  }),
  [
    branchId,
    btId,
    ownerType,
    debouncedSearch,
    onlyCritical,
    page,
    userBranchId,
    userBusinessTypeId,
  ]
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
                {branchesLoading ? "Cargando…" : "Todas…"}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : (
            <input
              readOnly
              className="border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
              value={
                branches.find(b => b.id === user?.branchId)?.name
                  ?? "Sucursal asignada"
              }
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
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Tipo de inventario</span>
          <select
            value={ownerType ?? ""}
            onChange={(e) => {
              setOwnerType(
                e.target.value ? (e.target.value as InventarioOwnerType) : undefined
              );
              setPage(0);
            }}
            className="border rounded-lg px-3 py-2 bg-white shadow-sm"
          >
            <option value="">Todos</option>
            <option value="PROPIO">Propio</option>
            <option value="CONSIGNACION">Consignación</option>
          </select>
        </label>
      </div>

      {/* Botón agregar */}
     <div className="flex justify-end pt-2">
        {(isSuper || isAdmin) && (
          <AddInventoryButton onCreated={refetchList} />
        )}
      </div>
            {/* MOBILE CARDS */}
      <div className="block md:hidden space-y-3">
        {allInv.isLoading && (
          <div className="rounded-xl border bg-white p-4 text-center text-gray-500">
            Cargando…
          </div>
        )}

        {!allInv.isLoading && !sortedRows.length && (
          <div className="rounded-xl border bg-white p-4 text-center text-gray-500">
            Sin registros
          </div>
        )}

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
      {/* TABLA PRO */}
     
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
                {usaInventarioPorDuenio && (
                <th className="px-4 py-3 text-left flex items-center gap-1 font-semibold hover:text-blue-600">
                    tipo de dueño
                </th>
                )}
                
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

                {(isSuper || isAdmin) && (
                  <th className="px-4 py-3">Última actualización</th>
                )}

                {(isSuper || isAdmin) && (
                  <th className="px-4 py-3">Actualizado por</th>
                )}

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
                <tr
                  key={`${row.productId}-${row.branchId}-${row.ownerType}`}
                  className="hover:bg-blue-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3">{row.productId}</td>

                  <td className="px-4 py-3 max-w-[220px] truncate font-medium">
                    {row.productName}
                  </td>
                
                  <td className="px-4 py-3">{row.branchName}</td>
                  {usaInventarioPorDuenio && (

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold
                          ${row.ownerType === "PROPIO"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"}
                        `}
                      >
                        {row.ownerType === "PROPIO" ? "Propio" : "Consignación"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.stock}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.minStock ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.maxStock ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.lastUpdated
                        ? new Date(row.lastUpdated).toLocaleString("es-MX")
                        : "—"}
                    </td>
                  )}

                  {(isSuper || isAdmin) && (
                    <td className="px-4 py-3">{row.updatedBy ?? "—"}</td>
                  )}

                  <td className="px-4 py-3 text-center space-x-2">
                    <EditInventarioButton row={row} onUpdated={refetchList} />
                    <MarkCriticalButton id={row.id} current={!!row.isStockCritico} onUpdated={refetchList} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Paginación */}
     <div className="pt-4 flex justify-center sm:justify-end items-center gap-4">
        <button
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 shadow-sm"
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ← Anterior
        </button>

        <span className="text-sm text-gray-600">
          Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong>
        </span>

        <button
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 shadow-sm"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
