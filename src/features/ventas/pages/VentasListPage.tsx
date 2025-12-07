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

// 🔹 Campos ordenables
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

  // ✅ Detectar filtros activos
  const hasFilters = Object.values(filtros).some(
    (v) => v !== undefined && v !== "" && v !== null
  );

  // ✅ Hooks de datos
  const ventasPaginadas = useSearchVentasPaginadas({
    page: Number(params.page ?? 0),
    size: Number(params.size ?? 10),
    ...filtros,
  });

  const ventasNormales = useVentas(params, filtros);
  const ventas = hasFilters ? ventasPaginadas : ventasNormales;

  // ✅ Aplicar filtros desde el panel
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

  // ✅ Ordenamiento local
  const sortedItems = useMemo(() => {
    const items = ventas.data?.content ?? [];
    const mult = localSort.dir === "asc" ? 1 : -1;
    const key = localSort.key;

    return [...items].sort((a, b) => {
      const av = a[key];
      const bv = b[key];

      switch (key) {
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

  // ✅ Render
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Ventas</h1>
        <AddVentaButton onCreated={() => ventas.refetch()} />
      </div>

      {/* Filtros */}
<   AdvancedFiltersVentas onApply={onApplyFilters} showId={true} />

      {/* Tabla */}
      <div className="overflow-auto border rounded">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("id")} className="flex items-center gap-1">
                  ID Venta <Arrow k="id" />
                </button>
              </th>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("clientName")} className="flex items-center gap-1">
                  Cliente <Arrow k="clientName" />
                </button>
              </th>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("saleDate")} className="flex items-center gap-1">
                  Fecha <Arrow k="saleDate" />
                </button>
              </th>
              <th className="p-2 text-left">
                <button onClick={() => toggleSort("paymentMethodName")} className="flex items-center gap-1">
                  Método pago <Arrow k="paymentMethodName" />
                </button>
              </th>
              <th className="p-2 text-right">
                <button onClick={() => toggleSort("amountPaid")} className="flex items-center gap-1 justify-end w-full">
                  Monto pagado <Arrow k="amountPaid" />
                </button>
              </th>
              {isSuperAdmin && (
                <th className="p-2 text-center">
                  <button onClick={() => toggleSort("userName")} className="flex items-center gap-1 justify-center w-full">
                    Vendido por <Arrow k="userName" />
                  </button>
                </th>
              )}
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ventas.isLoading && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Cargando…
                </td>
              </tr>
            )}

            {sortedItems.map((v) => (
              <tr
                    key={v.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(v)}
                >
                <td className="p-2">{v.id}</td>
                <td className="p-2">{v.clientName}</td>
                <td className="p-2">
                  {isSuperAdmin
                    ? new Date(v.saleDate).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })
                    : new Date(v.saleDate).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                </td>
                <td className="p-2 text-left">{v.paymentMethodName}</td>
                <td className="p-2 text-right">
                    <div className="font-semibold">
                      Total: ${(v.totalAmount ?? v.amountPaid ?? 0).toFixed(2)}
                    </div>

                    {/* Mostrar texto en palabras */}
                    {v.amountInWords && (
                      <div className="text-[10px] text-gray-500 italic">
                        {v.amountInWords}
                      </div>
                    )}

                    {/* Si fue EFECTIVO → mostrar monto entregado y cambio */}
                    {v.paymentMethodName === "EFECTIVO" && (
                      <div className="mt-1 text-xs text-gray-700">
                        <div>Monto entregado: ${(v.amountPaid ?? 0).toFixed(2)}</div>
                        <div>Cambio: ${(v.changeAmount ?? 0).toFixed(2)}</div>
                      </div>
                    )}

                    {/* Si NO fue EFECTIVO → solo mostrar el monto pagado */}
                    {v.paymentMethodName !== "EFECTIVO" && (
                      <div className="text-right">
                        ${(v.amountPaid ?? 0).toFixed(2)}
                      </div>
                  )}
                </td>
                {isSuperAdmin && (
                  <td className="p-2 text-center">{v.userName}</td>
                )}
                <td
                  className="p-2 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DeleteVentaButton id={v.id} onDeleted={() => ventas.refetch()} />
                </td>
              </tr>
            ))}

            {!ventas.isLoading && !sortedItems.length && (
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
        <Button
          variant="outline"
          disabled={Number(params.page ?? 0) === 0}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Math.max(0, Number(p.page ?? 0) - 1),
            }))
          }
        >
          Anterior
        </Button>

        <span>Página {Number(params.page ?? 0) + 1}</span>

        <Button
          variant="outline"
          disabled={ventas.data?.last}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Number(p.page ?? 0) + 1,
            }))
          }
        >
          Siguiente
        </Button>
      </div>
      {openDetalle && selectedVenta && (
        <VentaDetalleModal
          venta={selectedVenta}
          onClose={() => setOpenDetalle(false)}
        />
      )}
    </div>
  );
}
