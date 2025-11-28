import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";
import { useDashboard } from "@/features/reportes/hooks/useDashboard";
import { Card } from "@/components/Card";
import { ProductosChart } from "../components/ProductChart";
import { useTopProductos } from "@/features/reportes/hooks/useTopProducts";
import { ProductosPorUsuarioChart } from "@/features/reportes/components/ProductosPorUsuarioChart";
import { Tabs } from "@/components/ui/Tabs";

export default function DashboardPage() {
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");

  const branchesHook = useBranches({
    businessTypeId: isSuper ? undefined : auth.user?.businessType ?? undefined,
  });

  const [branchId, setBranchId] = useState<number | null>(
    isSuper ? null : auth.user?.branchId ?? null
  );

  const [activeTab, setActiveTab] = useState("semana");

  const { data, topWeek, topMonth, loading } = useDashboard(branchId);
  const { consolidado, porUsuario, loading: loadingTop } =
    useTopProductos(branchId, isSuper);

  const isLoading = loading || loadingTop;

  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - (diaSemana - 1));

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);

  const format = (d: Date) =>
    d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short"
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Dashboard</h1>

      {isSuper && (
        <div className="mb-6">
          <label className="block text-sm mb-1">Sucursal</label>
          <select
            className="border rounded px-3 py-2"
            value={branchId ?? ""}
            onChange={(e) =>
              setBranchId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Selecciona…</option>
            {branchesHook.data.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!branchId && (
        <p className="text-gray-500">Selecciona una sucursal para ver el dashboard.</p>
      )}

      {branchId && isLoading && <p>Cargando...</p>}

      {/* ---------- RESUMEN ---------- */}
      {branchId && !isLoading && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card titulo="Productos" valor={data.totalProductos} />
            <Card titulo="Stock crítico" valor={data.productosCriticos} />
            <Card titulo="Ventas hoy" valor={data.ventasHoy} />
            <Card titulo="Ingresos mes" valor={`$${data.ingresosMes}`} />
          </div>

          {/* ---------- TABS ---------- */}
          <div className="mt-10">
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

            {/* ---------- CONTENIDO DE CADA TAB ---------- */}

            {activeTab === "semana" && (
              <>
              <h2 className="text-xl mt-8 font-bold">
                Más vendidos (semana)
                <span className="ml-2 text-gray-500 text-sm font-normal">
                  ({format(inicioSemana)} – {format(finSemana)})
                </span>
              </h2>
                <ProductosChart data={topWeek} />
              </>
            )}

            {activeTab === "mes" && (
              <>
                <h2 className="text-xl mt-4 font-bold">Más vendidos (mes)</h2>
                <ProductosChart data={topMonth} />
              </>
            )}

            {activeTab === "Más vendidos" && (
              <>
                <h2 className="text-xl mt-4 font-bold">Más vendidos</h2>
                <ProductosChart data={consolidado} />
              </>
            )}

            {activeTab === "usuario" && isSuper && (
              <>
                <h2 className="text-xl mt-4 font-bold">Más vendidos por usuario</h2>
                <ProductosPorUsuarioChart data={porUsuario} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

