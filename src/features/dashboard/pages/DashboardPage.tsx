import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";
import { useDashboard } from "@/features/reportes/hooks/useDashboard";
import { Card } from "@/components/Card";
import { ProductosChart } from "../components/ProductChart";
import { ProductosPorUsuarioChart } from "@/features/reportes/components/ProductosPorUsuarioChart";
import { Tabs } from "@/components/ui/Tabs";
import { useTopProductos } from "@/features/reportes/hooks/useTopProducts";

export default function DashboardPage() {
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");

  const branchesHook = useBranches({
    isSuper,
    businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
    oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
  });

  const [branchId, setBranchId] = useState<number | null>(
    isSuper ? null : auth.user?.branchId ?? null
  );

  const [activeTab, setActiveTab] = useState("semana");

  const { data, topWeek, topMonth, loading } = useDashboard(branchId);
  const { consolidado, porUsuario, loading: loadingTop } =
    useTopProductos(branchId, isSuper);

  const isLoading = loading || loadingTop;

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
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Resumen general de actividad y ventas.</p>
        </div>

        {isSuper && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-1">Sucursal</label>
            <select
              className="border rounded-xl px-3 py-2 shadow-sm bg-white focus:ring-2 focus:ring-blue-600 transition"
              value={branchId ?? ""}
              onChange={(e) =>
                setBranchId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Selecciona una sucursal…</option>
              {branchesHook.data.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ---------- SIN SELECCIÓN ---------- */}
      {!branchId && (
        <div className="text-slate-500 text-center py-12 bg-white rounded-xl shadow border">
          Selecciona una sucursal para ver el dashboard.
        </div>
      )}

      {/* ---------- LOADING ---------- */}
      {branchId && isLoading && (
        <p className="text-slate-500 text-center py-6">Cargando datos…</p>
      )}

      {/* ---------- CONTENIDO PRINCIPAL ---------- */}
      {branchId && !isLoading && data && (
        <>
          {/* ---------- CARDS ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
            <Card titulo="Productos" valor={data.totalProductos} />
            <Card titulo="Stock crítico" valor={data.productosCriticos} />
            <Card titulo="Ventas hoy" valor={data.ventasHoy} />
            <Card titulo="Ingresos mes" valor={`$${data.ingresosMes}`} />
          </div>

          {/* ---------- TABS ---------- */}
          <div className="border-b mt-8">
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

          {/* ---------- CONTENIDO DE CADA TAB ---------- */}

          {activeTab === "semana" && (
            <div className="bg-white rounded-xl shadow p-6 border mt-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Más vendidos (semana)
                <span className="ml-2 text-slate-500 text-base font-normal">
                  ({format(inicioSemana)} – {format(finSemana)})
                </span>
              </h2>
              <ProductosChart data={topWeek} />
            </div>
          )}

          {activeTab === "mes" && (
            <div className="bg-white rounded-xl shadow p-6 border mt-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Más vendidos (mes)
              </h2>
              <ProductosChart data={topMonth} />
            </div>
          )}

          {activeTab === "Más vendidos" && (
            <div className="bg-white rounded-xl shadow p-6 border mt-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Más vendidos (consolidado)
              </h2>
              <ProductosChart data={consolidado} />
            </div>
          )}

          {activeTab === "usuario" && isSuper && (
            <div className="bg-white rounded-xl shadow p-6 border mt-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Más vendidos por usuario
              </h2>
              <ProductosPorUsuarioChart data={porUsuario} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
