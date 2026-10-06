import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";
import { useDashboard, useDashboardSemana } from "@/features/reportes/hooks/useDashboard";
import { Card } from "@/components/Card";
import {
  ProductosChart,
  type UsuarioVentaResumenDTO,
} from "../components/ProductChart";
import { ProductosPorUsuarioChart } from "@/features/reportes/components/ProductosPorUsuarioChart";
import { Tabs } from "@/components/ui/Tabs";
import { useTopProductos } from "@/features/reportes/hooks/useTopProducts";
import { VentasDiariasChart } from "@/features/reportes/components/VentasDiariasChart";

const toNumber = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(toNumber(value));

export default function DashboardPage() {
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");

  const { data: branches = [], isLoading: branchesLoading } = useBranches({
    isSuper,
    businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
    oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
  });

  const initialBranchId = isSuper ? null : auth.user?.branchId ?? null;
  const [branchId, setBranchId] = useState<number | null>(initialBranchId);

  const [activeTab, setActiveTab] = useState("semana");
  
  // NUEVO ESTADO: Control de semanas hacia atrás
  const [semanasAtras, setSemanasAtras] = useState(0);

const { data: dashboardData, isLoading: dashboardLoading, isError, error } = useDashboard(branchId);  const { data: semanaData } = useDashboardSemana(branchId, semanasAtras);
  const resumen = dashboardData?.data;

  const ventasGrafica = semanaData?.ventasDiariasSemana ?? [];
  const totalProductosSemanaGrafica = semanaData?.productosVendidosSemana ?? 0;
  const ventasHoyPorUsuario =
    (resumen?.ventasHoyPorUsuario ?? []) as UsuarioVentaResumenDTO[];

  const ingresosMesPorUsuario =
    (resumen?.ingresosMesPorUsuario ?? []) as UsuarioVentaResumenDTO[];

  const ventasHoyDetalles = ventasHoyPorUsuario.map((u) => ({
    label: u.username ?? "Usuario sin nombre",
    value: `${u.salesCount ?? 0} ventas`,
    subValue: `Ingreso: ${formatMoney(u.totalIncome)}`,
  }));

  const ingresosMesDetalles = ingresosMesPorUsuario.map((u) => ({
    label: u.username ?? "Usuario sin nombre",
    value: `Total vendido: ${formatMoney(u.totalIncome)} · ${u.salesCount ?? 0} ventas`,
    subValue: `Ganancia: ${formatMoney(u.netProfit)}`,
    subValueClassName: "text-green-600 font-semibold",
  }));

  const topWeek = (dashboardData?.topWeek ?? []).slice(0, 12);
  const topMonth = (dashboardData?.topMonth ?? []).slice(0, 12);

  const needsTop =
    branchId != null &&
    (activeTab === "Más vendidos" || (isSuper && activeTab === "usuario"));

  const { data: topData, isLoading: loadingTop } = useTopProductos(
    branchId,
    isSuper,
    needsTop
  );

  const consolidado = (topData?.consolidado ?? []).slice(0, 12);
  const porUsuario = (topData?.porUsuario ?? []).slice(0, 12);

  const loadingDashboardBase = branchId != null && dashboardLoading;
  const loadingTabTop = needsTop && loadingTop;

  const hasDashboardError = isError || error || (dashboardData === undefined && !loadingDashboardBase);

  // Fechas
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - (diaSemana - 1));
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);

  const format = (d: Date) =>
    d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });

  return (
    <div className="px-4 sm:px-6 py-4 max-w-6xl mx-auto space-y-6">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Resumen general de actividad y ventas.
          </p>
        </div>

        {isSuper && (
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-700 mb-1">
              Sucursal
            </label>
            <select
              disabled={branchesLoading}
              className="border rounded-xl px-3 py-2 shadow-sm bg-white focus:ring-2 focus:ring-blue-600 transition text-sm"
              value={branchId ?? ""}
              onChange={(e) =>
                setBranchId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">
                {branchesLoading ? "Cargando…" : "Selecciona una sucursal…"}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ---------- SIN SELECCIÓN ---------- */}
      {isSuper && !branchId && (
        <div className="text-slate-500 text-center py-10 bg-white rounded-xl shadow border">
          Selecciona una sucursal para ver el dashboard.
        </div>
      )}

      {/* ---------- LOADING BASE ---------- */}
      {branchId && loadingDashboardBase && (
        <p className="text-slate-500 text-center py-6 text-sm sm:text-base">
          Cargando dashboard…
        </p>
      )}

      {/* ---------- ESTADO DE ERROR ---------- */}
      {branchId && !loadingDashboardBase && hasDashboardError && (
        <div className="mt-6 text-red-600 text-center py-10 bg-red-50 rounded-xl shadow border border-red-200">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold">Error de conexión</h3>
          <p className="text-sm mt-1 text-red-500">
            No se pudo cargar la información del dashboard. Verifica que el servidor backend esté activo y funcionando.
          </p>
        </div>
      )}

      {/* ---------- CONTENIDO PRINCIPAL ---------- */}
      {branchId && !loadingDashboardBase && !hasDashboardError && resumen && (
        <>
          {/* ---------- CARDS ---------- */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">
            <Card
              titulo="Ventas hoy"
              valor={resumen?.ventasHoy ?? 0}
              detalleTitulo="Ventas de hoy por usuario"
              detalles={ventasHoyDetalles}
            />
            {/* NUEVAS TARJETAS */}
            <Card 
              titulo="Ingresos hoy" 
              valor={formatMoney(resumen?.ingresosHoy ?? 0)} 
            />
            <Card 
              titulo="Ganancia hoy" 
              valor={formatMoney(resumen?.gananciaHoy ?? 0)} 
            />
            {/* ---------------- */}
            <Card
              titulo="Ingresos mes"
              valor={formatMoney(resumen?.ingresosMes ?? 0)}
              detalleTitulo="Ventas y ganancia del mes por usuario"
              detalles={ingresosMesDetalles}
            />
            <Card titulo="Productos" valor={resumen?.totalProductos ?? 0} />
            <Card titulo="Stock crítico" valor={resumen?.productosCriticos ?? 0} />
          </div>

         {/* ---------- NUEVA GRÁFICA DE VENTAS DIARIAS ---------- */}
          {ventasGrafica.length > 0 && (
            <VentasDiariasChart 
              data={ventasGrafica} 
              semanasAtras={semanasAtras}      
              onCambiarSemana={setSemanasAtras}   
            />
          )}

          {/* ---------- SECCIÓN: TOTAL PRODUCTOS VENDIDOS ---------- */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center mb-4 sm:mb-5">
              <div className="flex-1 h-px bg-slate-200"></div>
              <h2 className="mx-4 text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider text-center">
                Total productos vendidos
              </h2>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">Hoy</p>
                <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1">{resumen?.productosVendidosHoy ?? 0}</p>
              </div>
              
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-[11px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">Semana</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{totalProductosSemanaGrafica}</p>
              </div>
              
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-[11px] sm:text-xs font-bold text-violet-600 uppercase tracking-wider">Mes</p>
                <p className="text-xl sm:text-2xl font-black text-violet-900 mt-1">{resumen?.productosVendidosMes ?? 0}</p>
              </div>
            </div>
          </div>   

          {/* ---------- TABS ---------- */}
          <div className="border-b mt-6 sm:mt-8 pb-1 overflow-x-auto">
            <Tabs
              active={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: "semana", label: "Semana" },
                { id: "mes", label: "Mes" },
                { id: "Más vendidos", label: "Más vendidos" },
                ...(isSuper ? [{ id: "usuario", label: "Por usuario" }] : []),
              ]}
            />
          </div>

          {/* ---------- TAB: SEMANA ---------- */}
          {activeTab === "semana" && (
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 border mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">
                Más vendidos (semana)
                <span className="ml-2 text-slate-500 text-sm font-normal">
                  ({format(inicioSemana)} – {format(finSemana)})
                </span>
              </h2>
              <ProductosChart data={topWeek} />
            </div>
          )}

          {/* ---------- TAB: MES ---------- */}
          {activeTab === "mes" && (
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 border mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">
                Más vendidos (mes)
              </h2>
              <ProductosChart data={topMonth} />
            </div>
          )}

          {/* ---------- TAB: MÁS VENDIDOS (consolidado) ---------- */}
          {activeTab === "Más vendidos" && (
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 border mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">
                Más vendidos (consolidado)
              </h2>
              {loadingTabTop ? (
                <p className="text-slate-500 text-center py-6">Cargando top…</p>
              ) : (
                <ProductosChart data={consolidado} />
              )}
            </div>
          )}

          {/* ---------- TAB: POR USUARIO ---------- */}
          {activeTab === "usuario" && isSuper && (
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 border mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">
                Más vendidos por usuario
              </h2>
              {loadingTabTop ? (
                <p className="text-slate-500 text-center py-6">Cargando por usuario…</p>
              ) : (
                <ProductosPorUsuarioChart data={porUsuario} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}