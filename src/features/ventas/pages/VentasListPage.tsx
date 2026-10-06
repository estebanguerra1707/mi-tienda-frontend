"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useSearchVentasPaginadas,
  useGenerarDetalleVentaConsolidada,
  useGenerarVentaConsolidada,
  useDetalleVentaConsolidadaPorTicket,
  type VentaSearchFiltro,
} from "@/hooks/useVentas";

import { toastError } from "@/lib/toast";
// Componentes clave del monitor
import PanelNuevaVenta from "@/features/ventas/components/PanelNuevaVenta";
import TableroKanban from "@/features/ventas/pages/TableroKanban"; // Ajusta la ruta si es necesario

import DeleteVentaButton from "@/features/ventas/components/DeleteVentabutton";
import AdvancedFiltersVentas from "@/features/ventas/components/AdvancedFiltersVentas";
import { useAuth } from "@/hooks/useAuth";
import VentaDetalleModal from "@/features/ventas/components/VentaDetalleModal";
import VentaConsolidadaDetalleModal from "@/features/ventas/components/VentaConsolidadaDetalleModal";
import type { VentaItem, VentaConsolidadaResponse } from "@/features/ventas/api";
import EnviarTicketConsolidadoModal from "@/features/ventas/components/EnviarTicketConsolidadoModal";

import type { ReactNode } from "react";
import { ServerPagination } from "@/components/pagination/ServerPagination";
import { toastSuccess } from "@/lib/toastSuccess";

type SortKey = "id" | "clientName" | "saleDate" | "paymentMethodName" | "paymentStatus" | "totalPaid" | "pendingBalance" | "netProfit" | "userName";

export default function VentasListPage() {
  const [params, setParams] = useState<{ page: number; size: number }>({ page: 0, size: 10 });
  const [filtros, setFiltros] = useState<VentaSearchFiltro>({});
  const { user } = useAuth();

  const role = (user?.role ?? null) as "SUPER_ADMIN" | "ADMIN" | "VENDOR" | null;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR";

  const TIENDITA_VIRTUAL_BRANCH_IDS = [8, 10];
  const email: string | undefined = user?.email ?? user?.username ?? undefined;

  const [selectedVenta, setSelectedVenta] = useState<VentaItem | null>(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [selectedVentaIds, setSelectedVentaIds] = useState<number[]>([]);

  const currentBranchId = user?.branchId == null ? null : Number(user.branchId);
  const isTienditaVirtualByBranch = currentBranchId !== null && TIENDITA_VIRTUAL_BRANCH_IDS.includes(currentBranchId);
  const isTienditaVirtualByEmail = (email ?? "").toLowerCase().includes("tienditavirtual");
  const isTienditaVirtual = isTienditaVirtualByBranch || isTienditaVirtualByEmail;
  const hasVentasSeleccionadas = selectedVentaIds.length > 0;
  const mostrarConsolidadoSemanal = isTienditaVirtual && hasVentasSeleccionadas;
  const puedeSeleccionarVentas = isTienditaVirtual;

  const generarDetalleMutation = useGenerarDetalleVentaConsolidada();
  const generarVentaConsolidadaMutation = useGenerarVentaConsolidada();

  const [detalleConsolidado, setDetalleConsolidado] = useState<VentaConsolidadaResponse | null>(null);
  const [openDetalleConsolidado, setOpenDetalleConsolidado] = useState(false);
  const [openEnviarTicketConsolidado, setOpenEnviarTicketConsolidado] = useState(false);
  const [selectedWeeklyTicketId, setSelectedWeeklyTicketId] = useState<number | string | null>(null);

  // ESTADOS NUEVOS PARA EL MONITOR Y LAYOUT
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHistorial, setShowHistorial] = useState(false);

  const handleRowClick = (venta: VentaItem) => {
    if (venta.rowType === "CONSOLIDADA") {
      if (!venta.weeklyTicketId) {
        toastError("No se encontró el ticket consolidado.");
        return;
      }
      setSelectedVenta(null);
      setOpenDetalle(false);
      setOpenDetalleConsolidado(false);
      setSelectedWeeklyTicketId(venta.weeklyTicketId);
      return;
    }
    setSelectedVenta(venta);
    setOpenDetalle(true);
  };

  const toggleVentaSelection = (ventaId: number) => {
    setSelectedVentaIds((prev) => prev.includes(ventaId) ? prev.filter((id) => id !== ventaId) : [...prev, ventaId]);
  };

  const clearSelectedVentas = () => setSelectedVentaIds([]);

  const handleGenerarDetalle = () => {
    if (selectedVentaIds.length === 0) return toastError("Selecciona al menos una venta");
    if (!filtros.startDate || !filtros.endDate) return toastError("Primero selecciona el rango de fechas");
    generarDetalleMutation.mutate(
      { clienteId: filtros.clientId ?? null, userId: filtros.userId ?? null, startDate: filtros.startDate, endDate: filtros.endDate, ventaIds: selectedVentaIds },
      {
        onSuccess: (detalle) => { setDetalleConsolidado(detalle); setOpenDetalleConsolidado(true); toastSuccess("Detalle consolidado generado"); },
        onError: (error) => toastError(getApiErrorMessage(error, "Error al generar el detalle")),
      }
    );
  };

  const handleGenerarTicketConsolidado = () => {
    if (!detalleConsolidado || !filtros.startDate || !filtros.endDate) return toastError("Faltan datos");
    generarVentaConsolidadaMutation.mutate(
      { clienteId: detalleConsolidado.clienteId ?? filtros.clientId ?? null, userId: detalleConsolidado.userId ?? filtros.userId ?? null, startDate: filtros.startDate, endDate: filtros.endDate, ventaIds: detalleConsolidado.ventaIds },
      {
        onSuccess: (detalleGenerado) => {
          setDetalleConsolidado(detalleGenerado);
          setOpenDetalleConsolidado(false);
          setOpenEnviarTicketConsolidado(true);
          setSelectedVentaIds([]);
          ventas.refetch();
          toastSuccess("Ticket generado");
        },
        onError: (error) => toastError(getApiErrorMessage(error, "Error al generar el ticket")),
      }
    );
  };

  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "saleDate", dir: "desc" });
  const toggleSort = (key: SortKey) => setLocalSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);
  const Arrow = ({ k }: { k: SortKey }) => localSort.key !== k ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? <>▲</> : <>▼</>;

  const ventas = useSearchVentasPaginadas({ page: params.page, size: params.size, ...filtros });
  const detalleConsolidadoPorTicketQuery = useDetalleVentaConsolidadaPorTicket(selectedWeeklyTicketId);

  const onApplyFilters = (next: Record<string, string | undefined>) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== ""));
    const cleanUsername = clean.username && clean.username.trim() !== "" ? clean.username : undefined;
    const newFiltros: VentaSearchFiltro = {
      clientId: clean.clientId ? Number(clean.clientId) : undefined,
      paymentMethodId: clean.paymentMethodId ?? undefined,
      paymentStatus: clean.paymentStatus === "PAGADA" || clean.paymentStatus === "PARCIAL" || clean.paymentStatus === "PENDIENTE" ? clean.paymentStatus : undefined,
      startDate: clean.startDate, endDate: clean.endDate,
      min: clean.min ? Number(clean.min) : undefined, max: clean.max ? Number(clean.max) : undefined,
      day: clean.day ? Number(clean.day) : undefined, month: clean.month ? Number(clean.month) : undefined, year: clean.year ? Number(clean.year) : undefined,
      active: clean.active === "true" ? true : clean.active === "false" ? false : undefined,
      username: isSuperAdmin ? cleanUsername : isVendor ? email : undefined,
    };
    clearSelectedVentas();
    setFiltros(newFiltros);
    setParams((p) => ({ ...p, page: 0 }));
  };

  const sortedItems = useMemo(() => {
    const items = ventas.data?.content ?? [];
    const mult = localSort.dir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = a[localSort.key]; const bv = b[localSort.key];
      switch (localSort.key) {
        case "totalPaid": case "pendingBalance": case "netProfit": case "id": return (Number(av ?? 0) - Number(bv ?? 0)) * mult;
        case "saleDate": return (new Date(String(av ?? "")).getTime() - new Date(String(bv ?? "")).getTime()) * mult;
        case "paymentStatus": {
          const order: Record<string, number> = { PAGADA: 1, PARCIAL: 2, PENDIENTE: 3 };
          return ((order[String(av ?? "PAGADA")] ?? 99) - (order[String(bv ?? "PAGADA")] ?? 99)) * mult;
        }
        default: return collator.compare(String(av ?? ""), String(bv ?? "")) * mult;
      }
    });
  }, [ventas.data?.content, localSort, collator]);

  const formatMoney = (n?: number | null) => `$${Number(n ?? 0).toFixed(2)}`;
  const formatDate = (iso: string, withTime: boolean) => {
    const d = new Date(iso);
    return withTime ? d.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : d.toLocaleDateString("es-MX");
  };

  const totalPages = ventas.data?.totalPages ?? 1;
  const pageUI = Number(params.page ?? 0) + 1;

  useEffect(() => { if (!isVendor || !email) return; setFiltros((prev) => ({ ...prev, username: email })); }, [isVendor, email]);
  useEffect(() => {
    if (!detalleConsolidadoPorTicketQuery.data) return;
    setDetalleConsolidado(detalleConsolidadoPorTicketQuery.data);
    setOpenDetalleConsolidado(true);
    setSelectedWeeklyTicketId(null);
  }, [detalleConsolidadoPorTicketQuery.data]);
  useEffect(() => {
    if (!detalleConsolidadoPorTicketQuery.isError) return;
    toastError("Error al cargar el detalle consolidado.");
    setSelectedWeeklyTicketId(null);
  }, [detalleConsolidadoPorTicketQuery.isError]);
  useEffect(() => { if (!isTienditaVirtual) setSelectedVentaIds([]); }, [isTienditaVirtual]);

  return (
    // Quitamos 'relative' de aquí, solo flex-col normal
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-100 overflow-hidden">
      
      {/* SECCIÓN SUPERIOR: Panel de Venta + Monitor Kanban */}
      {/* Agregamos overflow-hidden y flex-1 puro para que no empuje hacia abajo */}
      <div 
        className={`flex w-full transition-all duration-300 ease-in-out overflow-hidden ${
          showHistorial ? 'h-[45vh] shrink-0' : 'flex-1'
        }`}
      >
        {/* Lado Izquierdo: Nueva Venta */}
        <aside className="w-[35%] min-w-[380px] max-w-[450px] bg-white shadow-xl flex flex-col z-20 border-r h-full">
          <PanelNuevaVenta 
            onCreated={() => { 
              ventas.refetch(); 
              setRefreshKey((k) => k + 1); // Dispara recarga en Kanban
            }} 
          />
        </aside>

        {/* Lado Derecho: Tablero Kanban */}
        <main className="flex-1 flex flex-col overflow-hidden h-full">
            <TableroKanban refreshTrigger={refreshKey} />
        </main>
      </div>

      {/* BOTÓN DIVISOR: Toggle Historial */}
      {/* Eliminamos 'absolute bottom-0', ahora es un bloque normal que se queda naturalmente al fondo */}
      <div className="w-full bg-slate-200/50 p-2 flex justify-center items-center border-t border-slate-300 shadow-sm shrink-0 z-30">
        <button
          onClick={() => setShowHistorial(!showHistorial)}
          className="flex items-center gap-2 px-8 py-2 bg-slate-800 border-2 border-slate-700 rounded-full shadow-lg text-sm font-bold text-white hover:bg-slate-700 transition-all active:scale-95 tracking-wide"
        >
          {showHistorial ? "↑ Ocultar Historial de Ventas" : "↓ Mostrar Historial de Ventas"}
        </button>
      </div>

      {/* SECCIÓN INFERIOR: Historial de Ventas */}
      {showHistorial && (
        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-6 custom-scrollbar pb-24">
          <div className="mx-auto max-w-7xl space-y-5">
            
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Ventas</h2>
                <p className="mt-1 text-sm text-slate-600">Consulta ventas pasadas y filtra registros.</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <AdvancedFiltersVentas onApply={onApplyFilters} showId={true} showWeeklyConsolidation={isTienditaVirtual} onClear={clearSelectedVentas} />
            </div>

            {/* Tabla y Lista */}
            <div className="space-y-3">
              <div className="block lg:hidden">
                {ventas.isLoading ? (
                  <div className="rounded-xl border bg-white p-4 text-center text-slate-500">Cargando…</div>
                ) : sortedItems.length === 0 ? (
                  <div className="rounded-xl border bg-white p-4 text-center text-slate-500">Sin registros</div>
                ) : (
                  <div className="space-y-3">
                    {sortedItems.map((v) => (
                      <VentaCard key={v.rowId ?? v.id} v={v} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} puedeSeleccionarVentas={puedeSeleccionarVentas} selectedVentaIds={selectedVentaIds} onToggleVentaSelection={toggleVentaSelection} onOpen={() => handleRowClick(v)} onDeleted={() => ventas.refetch()} formatDate={formatDate} formatMoney={formatMoney} />
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <VentasTable isLoading={ventas.isLoading} rows={sortedItems} selectedVentaIds={selectedVentaIds} onToggleVentaSelection={toggleVentaSelection} puedeSeleccionarVentas={puedeSeleccionarVentas} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} toggleSort={toggleSort} Arrow={Arrow} onOpen={handleRowClick} onDeleted={() => ventas.refetch()} formatDate={formatDate} formatMoney={formatMoney} />
              </div>
            </div>

            {/* Acciones Consolidadas */}
            {mostrarConsolidadoSemanal && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-600"><span className="font-semibold text-slate-900">{selectedVentaIds.length}</span> venta(s) seleccionada(s)</div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button type="button" onClick={clearSelectedVentas} className="w-full sm:w-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpiar</button>
                  <button type="button" onClick={handleGenerarDetalle} disabled={generarDetalleMutation.isPending} className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{generarDetalleMutation.isPending ? "Generando..." : "Generar detalle"}</button>
                </div>
              </div>
            )}

            {/* Paginación */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-sm px-3 py-2">
              <ServerPagination page={pageUI} totalPages={totalPages} onChange={(nextPageUI: number) => { clearSelectedVentas(); setParams((p) => ({ ...p, page: nextPageUI - 1 })); }} />
            </div>
            <div className="hidden lg:flex pt-2 justify-end">
              <ServerPagination page={pageUI} totalPages={totalPages} onChange={(nextPageUI: number) => { clearSelectedVentas(); setParams((p) => ({ ...p, page: nextPageUI - 1 })); }} />
            </div>

          </div>
        </div>
      )}

      {/* Modales */}
      {openDetalle && selectedVenta && <VentaDetalleModal venta={selectedVenta} onClose={() => setOpenDetalle(false)} onAbonoSuccess={() => { setOpenDetalle(false); setSelectedVenta(null); ventas.refetch(); }} />}
      {openDetalleConsolidado && detalleConsolidado && <VentaConsolidadaDetalleModal detalle={detalleConsolidado} onClose={() => setOpenDetalleConsolidado(false)} onGenerarVenta={handleGenerarTicketConsolidado} isGenerating={generarVentaConsolidadaMutation.isPending} />}
      <EnviarTicketConsolidadoModal open={openEnviarTicketConsolidado} detalle={detalleConsolidado} onClose={() => setOpenEnviarTicketConsolidado(false)} />
    </div>
  );
}

// ----------------------------------------------------------------------
// FUNCIONES AUXILIARES Y SUBCONPONENTES (VentaCard, VentasTable, etc.)
// ----------------------------------------------------------------------

function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as { message?: string; response?: { data?: unknown } };
  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as { message?: unknown; error?: unknown };
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string" && obj.error !== "Bad Request") return obj.error;
  }
  if (typeof err.message === "string" && !err.message.includes("status code")) {
    return err.message;
  }
  return fallback;
}

function getPaymentStatusBadge(status?: string) {
  const value = status ?? "PAGADA";
  if (value === "PENDIENTE") return "bg-red-50 text-red-700 border-red-200";
  if (value === "PARCIAL") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-green-50 text-green-700 border-green-200";
}

/* ------------------ Mobile Card ------------------ */
function VentaCard(props: {
  v: VentaItem;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  puedeSeleccionarVentas: boolean;
  selectedVentaIds: number[];
  onToggleVentaSelection: (ventaId: number) => void;
  onOpen: () => void;
  onDeleted: () => void;
  formatMoney: (n?: number | null) => string;
  formatDate: (iso: string, withTime: boolean) => string;
}) {
  const { v, isSuperAdmin, isAdmin, puedeSeleccionarVentas, selectedVentaIds, onToggleVentaSelection, onOpen, onDeleted, formatMoney, formatDate } = props;
  const isSelected = selectedVentaIds.includes(v.id);
  const statusClass = getPaymentStatusBadge(v.paymentStatus);
  const pendingBalance = Number(v.pendingBalance ?? 0);
  const totalPaid = Number(v.totalPaid ?? 0);
  const showAdminColumns = isSuperAdmin || isAdmin;

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
      className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99] hover:bg-slate-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">#{v.id}</span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
              {v.paymentMethodName}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass}`}>
              {v.paymentStatus}
            </span>
          </div>
          <div className="mt-2 font-semibold text-slate-900 truncate">{v.clientName}</div>
          <div className="mt-1 text-sm text-slate-600">{formatDate(v.saleDate, isSuperAdmin)}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm text-slate-500">Monto</div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">{formatMoney(v.totalAmount)}</div>
        </div>
      </div>
      <div className={`mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm ${showAdminColumns ? "grid-cols-3" : "grid-cols-2"}`}>
        <div>
          <p className="text-xs text-slate-500">Pagado</p>
          <p className="font-semibold text-slate-800 tabular-nums">{formatMoney(totalPaid)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Saldo</p>
          <p className={`font-semibold tabular-nums ${pendingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatMoney(pendingBalance)}
          </p>
        </div>
        {showAdminColumns && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Ganancia</p>
            <p className="font-bold text-emerald-600 tabular-nums">{formatMoney(v.netProfit ?? 0)}</p>
          </div>
        )}
      </div>
      {puedeSeleccionarVentas && (
        <div className="mt-3 flex justify-start" onClick={(e) => e.stopPropagation()}>
          {v.rowType === "CONSOLIDADA" ? (
            <span className="inline-flex rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Venta consolidada
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onToggleVentaSelection(v.id)}
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isSelected ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {isSelected ? "✓ Deseleccionar" : "Seleccionar"}
            </button>
          )}
        </div>
      )}
      {(isSuperAdmin || isAdmin) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600 truncate">
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
  selectedVentaIds: number[];
  onToggleVentaSelection: (ventaId: number) => void;
  puedeSeleccionarVentas: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  toggleSort: (k: SortKey) => void;
  Arrow: (p: { k: SortKey }) => ReactNode;
  onOpen: (v: VentaItem) => void;
  onDeleted: () => void;
  formatMoney: (n?: number | null) => string;
  formatDate: (iso: string, withTime: boolean) => string;
}) {
  const { isLoading, rows, selectedVentaIds, onToggleVentaSelection, puedeSeleccionarVentas, isSuperAdmin, isAdmin, toggleSort, Arrow, onOpen, onDeleted, formatMoney, formatDate } = props;
  const showAdminColumns = isSuperAdmin || isAdmin;
  const desktopColSpan = 7 + (puedeSeleccionarVentas ? 1 : 0) + (showAdminColumns ? 2 : 0) + (isSuperAdmin ? 1 : 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-100 border-b sticky top-0 z-10">
            <tr className="text-gray-700">
              {puedeSeleccionarVentas && <th className="px-4 py-3 text-center font-semibold"></th>}
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
                <button onClick={() => toggleSort("totalPaid")} className="flex items-center justify-end gap-1 font-semibold hover:text-blue-600 w-full">
                  Pagado <Arrow k="totalPaid" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">Saldo</th>
              <th className="px-4 py-3 text-center">
                <button onClick={() => toggleSort("paymentStatus")} className="flex items-center justify-center gap-1 font-semibold hover:text-blue-600 w-full">
                  Estado <Arrow k="paymentStatus" />
                </button>
              </th>
              {(isSuperAdmin || isAdmin) && (
                <th className="px-4 py-3 text-right">
                  <button onClick={() => toggleSort("netProfit")} className="flex items-center justify-end gap-1 font-semibold hover:text-blue-600 w-full">
                    Ganancia <Arrow k="netProfit" />
                  </button>
                </th>
              )}
              {(isSuperAdmin || isAdmin) && (
                <th className="px-4 py-3 text-center">
                  <button onClick={() => toggleSort("userName")} className="flex items-center gap-1 justify-center font-semibold hover:text-blue-600">
                    Vendido por <Arrow k="userName" />
                  </button>
                </th>
              )}
              {isSuperAdmin && <th className="px-4 py-3 font-semibold text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={desktopColSpan} className="p-4 text-center text-gray-500">Cargando…</td>
              </tr>
            )}
            {!isLoading &&
              rows.map((v) => (
                <tr key={v.rowId ?? v.id} onClick={() => onOpen(v)} className="border-t hover:bg-blue-50 transition cursor-pointer">
                  {puedeSeleccionarVentas && (
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {v.rowType === "CONSOLIDADA" ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Consolidada</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedVentaIds.includes(v.id)}
                          onChange={() => onToggleVentaSelection(v.id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 font-semibold">{v.folioDisplay ?? v.id}</td>
                  <td className="px-4 py-3">{v.clientName}</td>
                  <td className="px-4 py-3">{formatDate(v.saleDate, isSuperAdmin)}</td>
                  <td className="px-4 py-3">{v.paymentMethodName}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatMoney(v.totalPaid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${Number(v.pendingBalance ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatMoney(v.pendingBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getPaymentStatusBadge(v.paymentStatus)}`}>
                      {v.paymentStatus}
                    </span>
                  </td>
                  {(isSuperAdmin || isAdmin) && <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatMoney(v.netProfit ?? 0)}</td>}
                  {(isSuperAdmin || isAdmin) && <td className="px-4 py-3 text-center">{v.userName}</td>}
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <DeleteVentaButton id={v.id} onDeleted={onDeleted} />
                    </td>
                  )}
                </tr>
              ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={desktopColSpan} className="p-4 text-center text-slate-500">Sin registros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}