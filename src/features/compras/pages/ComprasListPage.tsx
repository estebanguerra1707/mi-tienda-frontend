import { useState, useMemo, useRef, useEffect } from "react";
import {
  useCompras,
  useSearchComprasPaginadas,
  type CompraParams,
} from "@/hooks/useCompras";
import { type CompraSearchFiltro, type CompraItem } from "@/features/compras/api";
import AddCompraButton from "@/features/compras/component/AddCompraButton";
import DeleteCompraButton from "@/features/compras/component/DeleteCompraButton";
import AdvancedFiltersCompras from "@/features/compras/component/AdvancedFiltersCompras";
import { useAuth } from "@/hooks/useAuth";
import CompraDetalleModal from "@/features/compras/component/CompraDetalleModal";
import CompraCard from "@/features/compras/component/CompraCard";
import { ServerPagination } from "@/components/pagination/ServerPagination";

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
  const detalleRef = useRef<HTMLDivElement>(null);

  const handleRowClick = (compra: CompraItem) => {
    setSelectedCompra(compra);
    setOpenDetalle(true);
  };

  // ✅ Estado del orden local (por columna)
  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>(
    {
      key: "purchaseDate",
      dir: "desc",
    }
  );

  const toggleSort = (key: SortKey) =>
    setLocalSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  const Arrow = ({ k }: { k: SortKey }) =>
    localSort.key !== k ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? <>▲</> : <>▼</>;

  const hasFilters = useMemo(
    () =>
      !!(
        filtros.supplierId ||
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
  );

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
        clean.active === "true" ? true : clean.active === "false" ? false : undefined,
    };

    setFiltros(newFiltros);
    setParams((p) => ({ ...p, page: 0 }));
  };

  useEffect(() => {
    if (!openDetalle || !selectedCompra) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;

    const id = setTimeout(() => {
      detalleRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => clearTimeout(id);
  }, [openDetalle, selectedCompra]);

  const sortedItems = useMemo(() => {
    const items = compras.data?.content ?? [];
    const mult = localSort.dir === "asc" ? 1 : -1;
    const key = localSort.key;

    return [...items].sort((a, b) => {
      const av = a[key];
      const bv = b[key];

      switch (key) {
        case "amountPaid":
          return (Number(av ?? 0) - Number(bv ?? 0)) * mult;

        case "purchaseDate":
          return (
            (new Date(av as string).getTime() - new Date(bv as string).getTime()) * mult
          );

        case "id":
          return (Number(av) - Number(bv)) * mult;

        default:
          return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [compras.data?.content, localSort, collator]);

  // ===== Pagination mapping (igual a Inventario) =====
  const totalPages = compras.data?.totalPages ?? 1;
  const pageUI = Number(params.page ?? 0) + 1;

  // ✅ Importante: como ya NO hay scroll interno, scrolleamos el window.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pageUI]);

  return (
    <div
      className="
        w-full max-w-full overflow-x-hidden
        px-3 py-5 sm:px-6
        md:mx-auto md:max-w-7xl md:py-6
        space-y-6
        pb-[calc(72px+env(safe-area-inset-bottom))]
      "
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Compras
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consulta compras, filtra y abre el detalle tocando un registro.
          </p>
        </div>

        <div className="flex justify-end">
          <AddCompraButton onCreated={() => compras.refetch()} />
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 border overflow-x-hidden">
        <AdvancedFiltersCompras
          params={
            new URLSearchParams(
              Object.entries(params).map(([key, value]) => [key, String(value)])
            )
          }
          onApply={onApplyFilters}
        />
      </div>

      {/* LISTA MOBILE (SIN scroll interno — para que NO desaparezcan filtros) */}
      <div className="block md:hidden space-y-3">
        {compras.isLoading && (
          <div className="rounded-xl border bg-white p-4 text-center text-gray-500">
            Cargando…
          </div>
        )}

        {!compras.isLoading && !sortedItems.length && (
          <div className="rounded-xl border bg-white p-4 text-center text-gray-500">
            No se encontraron registros.
          </div>
        )}

        {sortedItems.map((c) => (
          <CompraCard
            key={c.id}
            compra={c}
            isSuperAdmin={isSuperAdmin}
            onOpen={() => handleRowClick(c)}
            onDeleted={() => compras.refetch()}
          />
        ))}
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden md:block bg-white rounded-xl shadow border p-0 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr className="text-gray-700">
                <th className="p-3 text-left">
                  <button onClick={() => toggleSort("id")} className="flex items-center gap-1">
                    ID Compra <Arrow k="id" />
                  </button>
                </th>

                <th className="p-3 text-left">
                  <button
                    onClick={() => toggleSort("providerName")}
                    className="flex items-center gap-1"
                  >
                    Proveedor <Arrow k="providerName" />
                  </button>
                </th>

                <th className="p-3 text-left">
                  <button
                    onClick={() => toggleSort("purchaseDate")}
                    className="flex items-center gap-1"
                  >
                    Fecha <Arrow k="purchaseDate" />
                  </button>
                </th>

                <th className="p-3 text-left">
                  <button
                    onClick={() => toggleSort("paymentName")}
                    className="flex items-center gap-1"
                  >
                    Método pago <Arrow k="paymentName" />
                  </button>
                </th>

                <th className="p-3 text-right">
                  <button
                    onClick={() => toggleSort("amountPaid")}
                    className="flex items-center gap-1"
                  >
                    Total pagado <Arrow k="amountPaid" />
                  </button>
                </th>

                {isSuperAdmin && (
                  <th className="p-3 text-center">
                    <button
                      onClick={() => toggleSort("userName")}
                      className="flex items-center gap-1"
                    >
                      Usuario <Arrow k="userName" />
                    </button>
                  </th>
                )}

                {isSuperAdmin && <th className="p-3 text-center">Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {compras.isLoading && (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="p-4 text-center text-gray-500">
                    Cargando…
                  </td>
                </tr>
              )}

              {sortedItems.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-blue-50 cursor-pointer transition"
                  onClick={() => handleRowClick(c)}
                >
                  <td className="p-3">{c.id}</td>
                  <td className="p-3">{c.providerName}</td>

                  <td className="p-3">
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
                      : new Date(c.purchaseDate).toLocaleDateString("es-MX")}
                  </td>

                  <td className="p-3">{c.paymentName}</td>

                  <td className="p-3 text-right font-semibold text-gray-700">
                    ${c.amountPaid.toFixed(2)}
                  </td>

                  {isSuperAdmin && <td className="p-3 text-center">{c.userName}</td>}

                  {isSuperAdmin && (
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <DeleteCompraButton id={c.id} onDeleted={() => compras.refetch()} />
                    </td>
                  )}
                </tr>
              ))}

              {!compras.isLoading && !sortedItems.length && (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="p-6 text-center text-gray-500">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINACIÓN MOBILE (FIJA, igual a Inventario) ===== */}
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
            setParams((p) => ({ ...p, page: nextPageUI - 1 })); // UI 1-based -> backend 0-based
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      {/* ===== PAGINACIÓN DESKTOP (igual a Inventario) ===== */}
      <div className="hidden md:flex pt-2 justify-end">
        <ServerPagination
          page={pageUI}
          totalPages={totalPages}
          onChange={(nextPageUI: number) =>
            setParams((p) => ({ ...p, page: nextPageUI - 1 }))
          }
        />
      </div>

      <div ref={detalleRef}>
        {openDetalle && selectedCompra && (
          <CompraDetalleModal
            compra={selectedCompra}
            onClose={() => setOpenDetalle(false)}
          />
        )}
      </div>
    </div>
  );
}
