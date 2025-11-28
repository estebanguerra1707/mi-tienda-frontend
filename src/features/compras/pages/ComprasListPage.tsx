import { useState, useMemo } from "react";
import {
  useCompras,
  useSearchComprasPaginadas,
  type CompraParams,
} from "@/hooks/useCompras";
import { type CompraSearchFiltro } from "@/features/compras/api";
import AddCompraButton from "@/features/compras/component/AddCompraButton";
import DeleteCompraButton from "@/features/compras/component/DeleteCompraButton";
import AdvancedFiltersCompras from "@/features/compras/component/AdvancedFiltersCompras";
import { useAuth } from "@/hooks/useAuth";
import CompraDetalleModal from "@/features/compras/component/CompraDetalleModal";
import type { CompraItem } from "@/features/compras/api";


// 🔹 Campos que se pueden ordenar
type SortKey =
  | "id"
  | "providerName"
  | "purchaseDate"
  | "paymentName"
  | "amountPaid"
  | "userName";


export default function ComprasListPage() {
  const [params, setParams] = useState<CompraParams>({ page: 0, size: 10 });
  const [filtros, setFiltros] = useState<CompraSearchFiltro>({});
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedCompra, setSelectedCompra] = useState<CompraItem | null>(null);
  const [openDetalle, setOpenDetalle] = useState(false);


const handleRowClick = (compra: CompraItem) => {
  setSelectedCompra(compra);
  setOpenDetalle(true);
};

  // ✅ Estado del orden local (por columna)
  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "id",
    dir: "asc",
  });

  
  const toggleSort = (key: SortKey) =>
    setLocalSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  // ✅ Flecha visual
  const Arrow = ({ k }: { k: SortKey }) =>
    localSort.key !== k ? (
      <span className="opacity-40">↕︎</span>
    ) : localSort.dir === "asc" ? (
      <>▲</>
    ) : (
      <>▼</>
    );

  // ✅ Detectamos si hay filtros activos
    const hasFilters = useMemo(
    () =>
      !!(
        filtros.supplierId ||         // id o nombre según tu backend
        filtros.start ||
        filtros.end ||
        filtros.min != null ||
        filtros.max != null ||
        filtros.day != null ||
        filtros.month != null ||
        filtros.year != null ||
        filtros.active != null
      ),
    [filtros]
  )

  // ✅ Hooks de compras
  const comprasPaginadas = useSearchComprasPaginadas({
    page: Number(params.page ?? 0),
    size: Number(params.size ?? 10),
    ...filtros,
  });


 const comprasNormales = useCompras(params, filtros);

  const compras = hasFilters ? comprasPaginadas : comprasNormales;

const onApplyFilters = (next: Record<string, string | undefined>) => {
  const clean = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v !== undefined && v !== "")
  );

  const newFiltros: CompraSearchFiltro = {
    supplierId: clean.supplier ? Number(clean.supplier) : undefined,
    start: clean.start,
    end: clean.end,
    min: clean.min ? Number(clean.min) : undefined,
    max: clean.max ? Number(clean.max) : undefined,
    day: clean.day ? Number(clean.day) : undefined,
    month: clean.month ? Number(clean.month) : undefined,
    year: clean.year ? Number(clean.year) : undefined,
    active:
      clean.active === "true"
        ? true
        : clean.active === "false"
        ? false
        : undefined,
  };

  setFiltros(newFiltros);
  setParams((p) => ({ ...p, page: 0 }));
};


  // ✅ Ordenamiento local (cliente)
  const sortedItems = useMemo(() => {
 const items = compras.data?.content ?? [];
    const mult = localSort.dir === "asc" ? 1 : -1;
    const key = localSort.key;

    return [...items].sort((a, b) => {
      const av = a[key];
      const bv = b[key];

      switch (key) {
        case "amountPaid":
          return ((Number(av ?? 0) - Number(bv ?? 0)) * mult);
        case "purchaseDate":
          return (
            (new Date(av as string).getTime() -
              new Date(bv as string).getTime()) * mult
          );
        case "id":
            return (Number(av) - Number(bv)) * mult;
        default:
          return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [compras.data?.content, localSort, collator]);

  // ✅ Render
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Compras</h1>
        <AddCompraButton onCreated={() => compras.refetch()} />
      </div>

      {/* Filtros avanzados */}
      <AdvancedFiltersCompras
        params={
          new URLSearchParams(
            Object.entries(params).map(([key, value]) => [key, String(value)])
          )
        }
        onApply={onApplyFilters}
      />

      {/* Tabla */}
      <div className="overflow-auto border rounded">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("id")} className="flex items-center gap-1">
                  ID Compra <Arrow k="id" />
                </button>
              </th>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("providerName")} className="flex items-center gap-1">
                  Proveedor <Arrow k="providerName" />
                </button>
              </th>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("purchaseDate")} className="flex items-center gap-1">
                  Fecha <Arrow k="purchaseDate" />
                </button>
              </th>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("paymentName")} className="flex items-center gap-1">
                  Método pago <Arrow k="paymentName" />
                </button>
              </th>
              <th className="p-2 text-right">
                <button onClick={() => toggleSort("amountPaid")} className="flex items-center gap-1">
                  Monto pagado <Arrow k="amountPaid" />
                </button>
              </th>
              {isSuperAdmin && (
                <th className="p-2 text-center">
                  <button onClick={() => toggleSort("userName")} className="flex items-center gap-1">
                    Comprado por <Arrow k="userName" />
                  </button>
                </th>
              )}
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {compras.isLoading && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Cargando…
                </td>
              </tr>
            )}

            {sortedItems.map((c) => (
              <tr
                key={c.id}
                className="border-t hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRowClick(c)}
              >
                <td className="p-2">{c.id}</td>
                <td className="p-2">{c.providerName}</td>
                <td className="p-2">
                  {isSuperAdmin
                    ? new Date(c.purchaseDate).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })
                    : new Date(c.purchaseDate).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                </td>
                <td className="p-2">{c.paymentName}</td>
                <td className="p-2 text-right">${c.amountPaid.toFixed(2)}</td>
                {isSuperAdmin && (
                  <td className="p-2 text-center">{c.userName}</td>
                )}
                <td
                  className="p-2 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DeleteCompraButton
                    id={c.id}
                    onDeleted={() => compras.refetch()}
                  />
                </td>
              </tr>
            ))}

            {!compras.isLoading && !sortedItems.length && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="p-4 text-center">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-end gap-2">
        <button
          disabled={Number(params.page ?? 0) === 0}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Math.max(0, Number(p.page ?? 0) - 1),
            }))
          }
          className="border px-3 py-1 rounded disabled:opacity-50"
        >
          Anterior
        </button>

        <span>Página {Number(params.page ?? 0) + 1}</span>

        <button
          disabled={compras.data?.last}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Number(p.page ?? 0) + 1,
            }))
          }
          className="border px-3 py-1 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      {openDetalle && selectedCompra && (
      <CompraDetalleModal
        compra={selectedCompra}
        onClose={() => setOpenDetalle(false)}
      />
    )}
    </div>
  );
}
