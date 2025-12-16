"use client";

import { useState, useMemo } from "react";
import {
  useVentas,
  useSearchVentasPaginadas,
  type VentaSearchFiltro,
} from "@/hooks/useVentas";
import AddVentaButton from "@/features/ventas/components/AddVentaButton";
import DeleteVentaButton from "@/features/ventas/components/DeleteVentabutton";
import AdvancedFiltersVentas from "@/features/ventas/components/AdvancedFiltersVentas";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import VentaDetalleModal from "@/features/ventas/components/VentaDetalleModal";
import type { VentaItem } from "@/features/ventas/api";

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
            (new Date(av as string).getTime() -
              new Date(bv as string).getTime()) * mult
          );
        case "id":
          return (Number(av) - Number(bv)) * mult;
        default:
          return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [ventas.data?.content, localSort, collator]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Ventas
        </h1>

       <div className="shadow-md hover:shadow-lg transition rounded-xl inline-block">
        <AddVentaButton onCreated={() => ventas.refetch()} />
      </div>
      </div>

      {/* FILTROS VISUALES */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <AdvancedFiltersVentas onApply={onApplyFilters} showId={true} />
      </div>

      {/* TABLA */}
      <div className="rounded-xl border bg-white shadow overflow-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">
                <button onClick={() => toggleSort("id")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
                  ID Venta <Arrow k="id" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button onClick={() => toggleSort("clientName")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
                  Cliente <Arrow k="clientName" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button onClick={() => toggleSort("saleDate")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
                  Fecha <Arrow k="saleDate" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button onClick={() => toggleSort("paymentMethodName")} className="flex items-center gap-1 font-semibold hover:text-blue-600">
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

              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ventas.isLoading && (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  Cargando…
                </td>
              </tr>
            )}

            {sortedItems.map((v) => (
              <tr
                key={v.id}
                onClick={() => handleRowClick(v)}
                className="border-t hover:bg-slate-50 transition cursor-pointer"
              >
                <td className="px-4 py-3">{v.id}</td>
                <td className="px-4 py-3">{v.clientName}</td>
                <td className="px-4 py-3">
                  {isSuperAdmin
                    ? new Date(v.saleDate).toLocaleString("es-MX")
                    : new Date(v.saleDate).toLocaleDateString("es-MX")}
                </td>

                <td className="px-4 py-3">{v.paymentMethodName}</td>

                <td className="px-4 py-3 text-right font-semibold">
                  ${(v.amountPaid ?? 0).toFixed(2)}
                </td>

                {isSuperAdmin && (
                  <td className="px-4 py-3 text-center">{v.userName}</td>
                )}

                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DeleteVentaButton
                    id={v.id}
                    onDeleted={() => ventas.refetch()}
                  />
                </td>
              </tr>
            ))}

            {!ventas.isLoading && sortedItems.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={params.page === 0}
          onClick={() =>
            setParams((p) => ({ ...p, page: Math.max(0, p.page - 1) }))
          }
        >
          Anterior
        </Button>

        <span className="px-2 py-2 text-sm text-slate-600">
          Página {params.page + 1}
        </span>

        <Button
          variant="outline"
          disabled={ventas.data?.last}
          onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
        >
          Siguiente
        </Button>
      </div>

      {/* MODAL DETALLE */}
      {openDetalle && selectedVenta && (
        <VentaDetalleModal
          venta={selectedVenta}
          onClose={() => setOpenDetalle(false)}
        />
      )}
    </div>
  );
}
