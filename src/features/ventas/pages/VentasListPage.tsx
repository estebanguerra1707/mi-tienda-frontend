"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useVentas,
  useSearchVentasPaginadas,
  type VentaSearchFiltro,
} from "@/hooks/useVentas";
import AddVentaButton from "@/features/ventas/components/AddVentaButton";
import DeleteVentaButton from "@/features/ventas/components/DeleteVentabutton";
import AdvancedFiltersVentas from "@/features/ventas/components/AdvancedFiltersVentas";
import { useAuth } from "@/hooks/useAuth";
import VentaDetalleModal from "@/features/ventas/components/VentaDetalleModal";
import type { VentaItem } from "@/features/ventas/api";
import type { ReactNode } from "react";
import { ServerPagination } from "@/components/pagination/ServerPagination";

// Campos ordenables
type SortKey =
  | "id"
  | "clientName"
  | "saleDate"
  | "paymentMethodName"
  | "amountPaid"
  | "userName";

export default function VentasListPage() {
  const [params, setParams] = useState<{ page: number; size: number }>({
    page: 0,
    size: 10,
  });
  const [filtros, setFiltros] = useState<VentaSearchFiltro>({});
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [selectedVenta, setSelectedVenta] = useState<VentaItem | null>(null);
  const [openDetalle, setOpenDetalle] = useState(false);

  const handleRowClick = (venta: VentaItem) => {
    setSelectedVenta(venta);
    setOpenDetalle(true);
  };

  // Ordenamiento local
  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>(
    {
      key: "saleDate",
      dir: "desc",
    }
  );

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

  const hasFilters = Object.values(filtros).some(
    (v) => v !== undefined && v !== "" && v !== null
  );

  const ventasPaginadas = useSearchVentasPaginadas({
    page: params.page,
    size: params.size,
    ...filtros,
  });

  const ventasNormales = useVentas(params, filtros);
  const ventas = hasFilters ? ventasPaginadas : ventasNormales;

  const onApplyFilters = (next: Record<string, string | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== "")
    );

    const newFiltros: VentaSearchFiltro = {
      clientId: clean.clientId ? Number(clean.clientId) : undefined,
      paymentMethodId: clean.paymentMethodId ?? undefined,
      startDate: clean.startDate,
      endDate: clean.endDate,
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

  const sortedItems = useMemo(() => {
    const items = ventas.data?.content ?? [];
    const mult = localSort.dir === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
      const av = a[localSort.key];
      const bv = b[localSort.key];

      switch (localSort.key) {
        case "amountPaid":
          return (Number(av ?? 0) - Number(bv ?? 0)) * mult;

        case "saleDate":
          return (
            (new Date(String(av ?? "")).getTime() -
              new Date(String(bv ?? "")).getTime()) *
            mult
          );

        case "id":
          return (Number(av ?? 0) - Number(bv ?? 0)) * mult;

        default:
          return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [ventas.data?.content, localSort, collator]);

  const formatMoney = (n?: number | null) => `$${Number(n ?? 0).toFixed(2)}`;

  const formatDate = (iso: string, withTime: boolean) => {
    const d = new Date(iso);
    return withTime
      ? d.toLocaleString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      : d.toLocaleDateString("es-MX");
  };

  // ===== Pagination mapping (igual a Inventario / Compras) =====
  const totalPages = ventas.data?.totalPages ?? 1;
  const pageUI = Number(params.page ?? 0) + 1;

  // reset scroll (window) on page change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pageUI]);

  return (
    <div
      className="
        w-full
        px-4 py-5 sm:px-6
        md:mx-auto md:max-w-7xl md:py-6
        space-y-5
        pb-[calc(72px+env(safe-area-inset-bottom))]
      "
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ventas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consulta ventas, filtra y abre el detalle tocando un registro.
          </p>
        </div>

        <div className="shrink-0">
          {/* Desktop: normal | Mobile: full-width (via wrapper below) */}
          <div className="hidden sm:block shadow-md hover:shadow-lg transition rounded-xl">
            <AddVentaButton onCreated={() => ventas.refetch()} />
          </div>
        </div>
      </div>

      {/* Botón crear en mobile (full width) */}
      <div className="sm:hidden">
        <div className="shadow-md hover:shadow-lg transition rounded-xl w-full">
          <AddVentaButton onCreated={() => ventas.refetch()} />
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
        <AdvancedFiltersVentas onApply={onApplyFilters} showId={true} />
      </div>

      {/* LISTA (mobile) + TABLA (desktop) */}
      <div className="space-y-3">
        {/* Mobile cards */}
        <div className="block md:hidden">
          {ventas.isLoading ? (
            <div className="rounded-xl border bg-white p-4 text-center text-slate-500">
              Cargando…
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 text-center text-slate-500">
              Sin registros
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((v) => (
                <VentaCard
                  key={v.id}
                  v={v}
                  isSuperAdmin={isSuperAdmin}
                  onOpen={() => handleRowClick(v)}
                  onDeleted={() => ventas.refetch()}
                  formatDate={formatDate}
                  formatMoney={formatMoney}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <VentasTable
            isLoading={ventas.isLoading}
            rows={sortedItems}
            isSuperAdmin={isSuperAdmin}
            toggleSort={toggleSort}
            Arrow={Arrow}
            onOpen={handleRowClick}
            onDeleted={() => ventas.refetch()}
            formatDate={formatDate}
            formatMoney={formatMoney}
          />
        </div>
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
            setParams((p) => ({ ...p, page: nextPageUI - 1 })); // UI 1-based -> backend 0-based
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      {/* ===== PAGINACIÓN DESKTOP ===== */}
      <div className="hidden md:flex pt-2 justify-end">
        <ServerPagination
          page={pageUI}
          totalPages={totalPages}
          onChange={(nextPageUI: number) =>
            setParams((p) => ({ ...p, page: nextPageUI - 1 }))
          }
        />
      </div>

      {/* MODAL DETALLE */}
      {openDetalle && selectedVenta && (
        <VentaDetalleModal venta={selectedVenta} onClose={() => setOpenDetalle(false)} />
      )}
    </div>
  );
}

/* ------------------ Mobile Card ------------------ */

function VentaCard(props: {
  v: VentaItem;
  isSuperAdmin: boolean;
  onOpen: () => void;
  onDeleted: () => void;
  formatMoney: (n?: number | null) => string;
  formatDate: (iso: string, withTime: boolean) => string;
}) {
  const { v, isSuperAdmin, onOpen, onDeleted, formatMoney, formatDate } = props;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="
        w-full text-left
        rounded-2xl border border-slate-200 bg-white
        p-4 shadow-sm
        active:scale-[0.99]
        hover:bg-slate-50
        transition
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">#{v.id}</span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
              {v.paymentMethodName}
            </span>
          </div>

          <div className="mt-2 font-semibold text-slate-900 truncate">{v.clientName}</div>

          <div className="mt-1 text-sm text-slate-600">
            {formatDate(v.saleDate, isSuperAdmin)}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm text-slate-500">Monto</div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">
            {formatMoney(v.amountPaid)}
          </div>
        </div>
      </div>

      {/* FOOTER SUPER ADMIN */}
      {isSuperAdmin && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600 truncate">
            <span className="text-slate-500">Vendido por:</span>{" "}
            <span className="font-medium text-slate-800">{v.userName}</span>
          </div>

          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <DeleteVentaButton id={v.id} onDeleted={onDeleted} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------ Desktop Table ------------------ */
function VentasTable(props: {
  isLoading: boolean;
  rows: VentaItem[];
  isSuperAdmin: boolean;
  toggleSort: (k: SortKey) => void;
  Arrow: (p: { k: SortKey }) => ReactNode;
  onOpen: (v: VentaItem) => void;
  onDeleted: () => void;
  formatMoney: (n?: number | null) => string;
  formatDate: (iso: string, withTime: boolean) => string;
}) {
  const {
    isLoading,
    rows,
    isSuperAdmin,
    toggleSort,
    Arrow,
    onOpen,
    onDeleted,
    formatMoney,
    formatDate,
  } = props;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-100 border-b sticky top-0 z-10">
            <tr className="text-gray-700">
              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("id")}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600"
                >
                  ID Venta <Arrow k="id" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("clientName")}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600"
                >
                  Cliente <Arrow k="clientName" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("saleDate")}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600"
                >
                  Fecha <Arrow k="saleDate" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("paymentMethodName")}
                  className="flex items-center gap-1 font-semibold hover:text-blue-600"
                >
                  Método pago <Arrow k="paymentMethodName" />
                </button>
              </th>

              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => toggleSort("amountPaid")}
                  className="flex items-center justify-end gap-1 font-semibold hover:text-blue-600 w-full"
                >
                  Monto pagado <Arrow k="amountPaid" />
                </button>
              </th>

              {isSuperAdmin && (
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleSort("userName")}
                    className="flex items-center gap-1 justify-center font-semibold hover:text-blue-600"
                  >
                    Vendido por <Arrow k="userName" />
                  </button>
                </th>
              )}

              {isSuperAdmin && (
                <th className="px-4 py-3 font-semibold text-center">Acciones</th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Cargando…
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => onOpen(v)}
                  className="border-t hover:bg-blue-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3">{v.id}</td>
                  <td className="px-4 py-3">{v.clientName}</td>

                  <td className="px-4 py-3">{formatDate(v.saleDate, isSuperAdmin)}</td>

                  <td className="px-4 py-3">{v.paymentMethodName}</td>

                  <td className="px-4 py-3 text-right font-semibold text-gray-700">
                    {formatMoney(v.amountPaid)}
                  </td>

                  {isSuperAdmin && <td className="px-4 py-3 text-center">{v.userName}</td>}

                  {isSuperAdmin && (
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteVentaButton id={v.id} onDeleted={onDeleted} />
                    </td>
                  )}
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
