import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";

import { useGanancias } from "../hooks/useGanacias";
import { useBrutasNetas } from "../hooks/useBrutasNetas";
import { useGananciaPorVenta } from "../hooks/useGanaciaPorVenta";

import { transformarGanancias } from "../utils/gananciasTransform";

import { GananciasChart } from "../components/GanaciasChart";
import { IndicadorHoy } from "../components/IndicadorHoy";
import { Tabs } from "../components/Tabs";
import { ResumenGananciasChart } from "../components/ResumenGanaciasChart";
import { BrutasNetasChart } from "../components/BrutasNetasChart";
import { GananciaPorVentaChart } from "../components/GananciaPorVentaChart";

// Fechas por defecto
const hoy = new Date().toISOString().slice(0, 10);
const hace30 = new Date(Date.now() - 30 * 86400000)
  .toISOString()
  .slice(0, 10);

export default function ReportesPage() {
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");

const branchesHook = useBranches({
  isSuper,
  businessTypeId: isSuper
    ? undefined
    : (auth.user?.businessType ?? null),
  oneBranchId: !isSuper
    ? (auth.user?.branchId ?? null)
    : null,
});

  const [branchId, setBranchId] = useState<number | null | undefined>(
    isSuper ? undefined : auth.user?.branchId ?? null
  );

  const [start, setStart] = useState(hace30);
  const [end, setEnd] = useState(hoy);
  const [shouldLoad, setShouldLoad] = useState(false);

  const [dataLoaded, setDataLoaded] = useState(false);

  const onBuscar = () => {
    setShouldLoad(true);
    setDataLoaded(false);
  };

  // GANANCIAS (por rango)
  const { resumen, diario, loading } = useGanancias({
    startDate: shouldLoad ? start : null,
    endDate: shouldLoad ? end : null,
    branchId: shouldLoad ? branchId ?? null : null,
  });

  // BRUTAS / NETAS
  const { brutas, netas, loading: loadingBrutasNetas } = useBrutasNetas({
    startDate: shouldLoad ? start : null,
    endDate: shouldLoad ? end : null,
    branchId: shouldLoad ? branchId ?? null : null,
  });

  // GANANCIA POR VENTA
  const [ventaIdInput, setVentaIdInput] = useState("");
  const ventaIdNumber = ventaIdInput ? Number(ventaIdInput) : null;
  const [shouldLoadVenta, setShouldLoadVenta] = useState(false);

  const { ganancia, loading: loadingVenta } = useGananciaPorVenta(
    shouldLoadVenta ? ventaIdNumber : null,
    branchId ?? null
  );

  const onBuscarVenta = () => {
    if (ventaIdNumber) {
      setShouldLoadVenta(true);
    }
  };

  const rangoInvalido =
    !start || !end || new Date(start) > new Date(end) || !branchId;

  useEffect(() => {
    if (!loading && shouldLoad) {
      setDataLoaded(true);
      setShouldLoad(false);
    }
  }, [loading, shouldLoad]);

  // Series transformadas
  const serieDia = transformarGanancias(diario, "day");
  const serieSemana = transformarGanancias(diario, "week");
  const serieMes = transformarGanancias(diario, "month");

  // SUBTABS
  const subtabsGanancia = [
    {
      label: "Por Día",
      content: (
        <GananciasChart titulo="Ganancia por Día" data={serieDia} />
      ),
    },
    {
      label: "Por Semana",
      content: (
        <GananciasChart titulo="Ganancia por Semana" data={serieSemana} />
      ),
    },
    {
      label: "Por Mes",
      content: <GananciasChart titulo="Ganancia por Mes" data={serieMes} />,
    },
  ];

  // TABS PRINCIPALES
  const tabs = [
    {
      label: "Ganancias",
      content: (
        <div className="space-y-6">
          <IndicadorHoy valor={resumen?.hoy ?? 0} />

          {dataLoaded ? (
            <div className="bg-white rounded-xl shadow p-6 border">
              <Tabs tabs={subtabsGanancia} />
            </div>
          ) : (
            <p className="text-gray-500 mt-4">
              Presiona <strong>Buscar reporte</strong> para ver las gráficas.
            </p>
          )}
        </div>
      ),
    },

    {
      label: "Brutas / Netas",
      content: dataLoaded ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow p-6 border">
            <h2 className="text-lg font-semibold mb-4">
              Resumen de Ganancias
            </h2>
            {resumen && <ResumenGananciasChart data={resumen} />}
          </div>

          <div className="bg-white rounded-xl shadow p-6 border">
            <h2 className="text-lg font-semibold mb-4">
              Ventas Brutas vs Netas
            </h2>
            {loadingBrutasNetas ? (
              <p>Cargando...</p>
            ) : (
              <BrutasNetasChart brutas={brutas} netas={netas} />
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mt-4">
          Presiona <strong>Buscar reporte</strong> para ver las gráficas.
        </p>
      ),
    },

    // GANANCIA POR VENTA
    {
      label: "Ganancia por Venta",
      content: (
        <div className="bg-white rounded-xl shadow p-6 border">
          <h2 className="text-lg font-semibold mb-4">Ganancia por Venta</h2>

          <div className="flex gap-4 mb-6 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                ID Venta
              </label>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 shadow-sm"
                value={ventaIdInput}
                onChange={(e) => {
                  setVentaIdInput(e.target.value);
                  setShouldLoadVenta(false);
                }}
                placeholder="Ej: 15"
              />
            </div>

            <button
              onClick={onBuscarVenta}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              disabled={!ventaIdNumber}
            >
              Buscar
            </button>
          </div>

          {!shouldLoadVenta ? (
            <p className="text-gray-500">
              Ingresa un ID y presiona <strong>Buscar</strong>.
            </p>
          ) : loadingVenta ? (
            <p>Cargando...</p>
          ) : (
            ganancia != null && (
              <GananciaPorVentaChart
                ventaId={ventaIdNumber}
                ganancia={ganancia}
              />
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Reportes de Ganancias
        </h1>
        <p className="text-gray-500">
          Analiza ganancias, ventas brutas, netas y desglose por venta.
        </p>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow p-6 border mb-8">
        <h2 className="text-lg font-semibold mb-4">Filtros del Reporte</h2>

        <div className="flex flex-wrap gap-6 items-end">
          {/* Sucursal */}
          {isSuper ? (
            <div>
              <label className="block text-sm font-medium mb-1">
                Sucursal
              </label>
              <select
                className="border rounded-lg px-3 py-2 shadow-sm"
                value={branchId ?? ""}
                onChange={(e) =>
                  setBranchId(
                    e.target.value ? Number(e.target.value) : undefined
                  )
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
          ) : (
            <div>
              <label className="block text-sm font-medium">Sucursal</label>
              <input
                className="border rounded-lg px-3 py-2 bg-gray-100 shadow-sm"
                value={
                  branchesHook.data.find(
                    (b) => b.id === auth.user?.branchId
                  )?.name ?? "Sucursal asignada"
                }
                readOnly
              />
            </div>
          )}

          {/* Fechas */}
          <div>
            <label className="block text-sm font-medium">Desde</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border rounded-lg px-3 py-2 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Hasta</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border rounded-lg px-3 py-2 shadow-sm"
            />
          </div>

          {/* BOTÓN */}
          <button
            onClick={onBuscar}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-300 transition"
            disabled={rangoInvalido}
          >
            Buscar reporte
          </button>
        </div>

        {rangoInvalido && (
          <p className="text-red-600 mt-4">
            Selecciona una sucursal y un rango válido.
          </p>
        )}
      </div>

      {/* TABS PRINCIPALES */}
      {dataLoaded && (
        <div className="bg-white rounded-xl shadow p-6 border">
          <Tabs tabs={tabs} />
        </div>
      )}
    </div>
  );
}
