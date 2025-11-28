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
  localSort.key !== k ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? <>▲</> : <>▼</>;



  // ==== filtros (controlados en UI) ====
  const [page, setPage] = useState(0);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);


  // SUPER: puede elegir BT y Sucursal
  const [btId, setBtId] = useState<number | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);

  // Cargar catálogos
  const btHook = useBusinessTypes();
  const branchesHook = useBranches({ businessTypeId: isSuper ? btId : (user?.businessTypeId ?? undefined) });

  // ==== Data ====
  // SUPER usa la lista paginada; (si aplicas filtros de BT/Sucursal en server, añade params y endpoints)
const filtro = useMemo(() => ({
  branchId: branchId ?? user?.branchId,
  businessTypeId: btId ?? user?.businessTypeId,
  q: debouncedSearch.trim() || undefined,
  onlyCritical,
  page,
  size: PAGE_SIZE,
}), [branchId, btId, debouncedSearch, onlyCritical, page, user]);
  
const allInv = useInventory(filtro);  


const rows: InventoryItem[] = useMemo(() => {
  const base = allInv.data?.content ?? [];

  const filtered = base.filter((r) => {
    if (isSuper) {
      const matchBranch = !branchId || r.branchId === branchId;
      return matchBranch;
    }
    // Los demás roles no filtran nada manualmente
    return true;
  });

  return filtered;
}, [allInv.data, branchId, isSuper]);

const totalPages = allInv.data?.totalPages ?? 1;


  const sortedRows = useMemo(() => {
  const mult = localSort.dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const key = localSort.key;

    switch (key) {
      case "productId": {
        return ((a.productId ?? 0) - (b.productId ?? 0)) * mult;
      }
      case "stock":
      case "minStock":
      case "maxStock": {
        const av = Number(a[key] ?? 0);
        const bv = Number(b[key] ?? 0);
        return (av - bv) * mult;
      }
      case "isStockCritico": {
        const av = a.isStockCritico ? 1 : 0;
        const bv = b.isStockCritico ? 1 : 0;
        return (av - bv) * mult;
      }
      case "lastUpdatedDate": {
        const ad = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const bd = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return (ad - bd) * mult;
      }
      case "productName":
      case "branchName": {
        const as = String(a[key] ?? "");
        const bs = String(b[key] ?? "");
        return collator.compare(as, bs) * mult;
      }
      default:
        return 0;
    }
  });
}, [rows, localSort, collator]);


const refetchList = () => allInv.refetch();

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-xl font-semibold">Inventario</h1>

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-4 items-end">
        {/* SUPER: Tipo de negocio */}
        {isSuper && (
          <label className="flex flex-col gap-1">
            <span className="text-sm">Tipo de negocio</span>
            <select
              value={btId ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                setBtId(v);
                setBranchId(undefined); // reset sucursal cuando cambia BT
                setPage(0);
              }}
              className="border rounded px-3 py-2"
              disabled={btHook.isLoading}
            >
              <option value="">{btHook.isLoading ? "Cargando…" : "Todos…"}</option>
              {(btHook.data ?? []).map(bt => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
          </label>
        )}

        {/* Sucursal */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">Sucursal</span>
          {isSuper ? (
            <select
              value={branchId ?? ""}
              onChange={(e) => { setBranchId(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
              className="border rounded px-3 py-2"
              disabled={branchesHook.loading}
            >
              <option value="">{branchesHook.loading ? "Cargando…" : "Todas…"}</option>
              {branchesHook.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              {!branchesHook.loading && branchesHook.data.length === 0 && <option disabled>(sin sucursales)</option>}
            </select>
          ) : (
            <input className="border rounded px-3 py-2 bg-slate-100" value={user?.branchName ?? "Sucursal asignada"} readOnly />
          )}
        </label>

        {/* Buscar producto */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">Buscar producto</span>
          <input
            className="border rounded px-3 py-2"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Nombre o ID"
          />
        </label>

        {/* Solo críticos */}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyCritical} onChange={(e) => { setOnlyCritical(e.target.checked); setPage(0); }} />
          <span>Solo críticos</span>
        </label>
      </div>

      {/* Tabla */}
       <div className="flex justify-between mb-4">
              <h1 className="text-2xl font-semibold">Crear inventario</h1>
              {isSuper && (
               <AddInventoryButton onCreated={refetchList} />
              )}
        </div>
      <div className="overflow-auto border rounded">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
                <th className="text-left p-2">
                <button onClick={() => toggleSort("productId")} className="flex items-center gap-1">
                    ID Producto <Arrow k="productId" />
                </button>
                </th>
                <th className="text-left p-2">
                <button onClick={() => toggleSort("productName")} className="flex items-center gap-1">
                    Producto <Arrow k="productName" />
                </button>
                </th>
                <th className="text-left p-2">
                <button onClick={() => toggleSort("branchName")} className="flex items-center gap-1">
                    Sucursal <Arrow k="branchName" />
                </button>
                </th>
                <th className="text-right p-2">
                <button onClick={() => toggleSort("stock")} className="flex items-center gap-1">
                    Cantidad <Arrow k="stock" />
                </button>
                </th>
                <th className="text-right p-2">
                <button onClick={() => toggleSort("minStock")} className="flex items-center gap-1">
                    Mín <Arrow k="minStock" />
                </button>
                </th>
                <th className="text-right p-2">
                <button onClick={() => toggleSort("maxStock")} className="flex items-center gap-1">
                    Máx <Arrow k="maxStock" />
                </button>
                </th>
                <th className="text-center p-2">
                <button onClick={() => toggleSort("isStockCritico")} className="flex items-center gap-1 mx-auto">
                    Msj stock crítico activo <Arrow k="isStockCritico" />
                </button>
                </th>
                 {(isSuper || isAdmin) && (
                <th className="text-left p-2">
                     <button onClick={() => toggleSort("lastUpdatedDate")} className="flex items-center gap-1">
                        Última actualización <Arrow k="lastUpdatedDate" />
                    </button>
                </th>
                 )}
                {(isSuper || isAdmin) && (
                    <th>
                        <button onClick={() => toggleSort("lastUpdatedDate")} className="flex items-center gap-1">
                            Actualizado por <Arrow k="lastUpdatedDate" />
                        </button>
                    </th>
                 )}
                <th className="text-center p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {allInv.isLoading && (
                <tr><td className="p-4" colSpan={9}>Cargando…</td></tr>
            )}
            {!sortedRows.length && !allInv.isLoading && (
              <tr><td className="p-4" colSpan={9}>Sin registros</td></tr>
            )}
            {allInv.isError && (
            <tr><td colSpan={9} className="p-4 text-red-600">
                Error al cargar el inventario: {(allInv.error as Error)?.message ?? "Error desconocido"}
            </td></tr>
            )}
            {sortedRows.map((row) => (
                <tr key={row.id} className="border-t">
                <td className="p-2">{row.productId}</td>
                <td className="p-2">{row.productName ?? row.productId}</td>
                <td className="p-2">{row.branchName ?? row.branchId}</td>
                <td className="p-2 text-right tabular-nums">{row.stock}</td>
                <td className="p-2 text-right tabular-nums">{row.minStock ?? "—"}</td>
                <td className="p-2 text-right tabular-nums">{row.maxStock ?? "—"}</td>
                <td className="text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${row.isStockCritico ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>
                    {row.isStockCritico ? "Sí" : "No"}
                    </span>
                </td>
                 {(isSuper || isAdmin) && (
                    <td className="p-2 whitespace-nowrap">
                    {row.lastUpdated
                    ? new Date(row.lastUpdated).toLocaleString("es-MX", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                        })
                    : "—"}
                    </td>
                 )}
                  {(isSuper || isAdmin) && (
                      <td className="p-2 text-right tabular-nums">{row.updatedBy?? "—"}</td>
                 )}
                <td className="whitespace-nowrap">
                    <EditInventarioButton row={row} onUpdated={refetchList} />
                    <MarkCriticalButton id={row.id} current={!!row.isStockCritico} onUpdated={refetchList} />
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-2">
        <button className="px-3 py-1 border rounded" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
          Anterior
        </button>
        <span className="text-sm">Página {page + 1} de {totalPages}</span>
        <button className="px-3 py-1 border rounded" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
