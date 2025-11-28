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

const hoy = new Date().toISOString().slice(0, 10);
const hace30 = new Date(Date.now() - 30 * 86400000)
  .toISOString()
  .slice(0, 10);

export default function ReportesPage() {
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");

  const branchesHook = useBranches({
    businessTypeId: isSuper ? undefined : auth.user?.businessType ?? undefined,
  });

  const [branchId, setBranchId] = useState<number | null | undefined>(
    isSuper ? undefined : auth.user?.branchId ?? null
  );
  const [start, setStart] = useState(hace30);
  const [end, setEnd] = useState(hoy);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Datos cargados (solo cuando se presiona Actualizar)
  const [dataLoaded, setDataLoaded] = useState(false);

  const onBuscar = () => {
    setShouldLoad(true);
    setDataLoaded(false);
  };

  // ==== GANANCIAS POR RANGO ====
  const { resumen, diario, loading } = useGanancias({
    startDate: shouldLoad ? start : null,
    endDate: shouldLoad ? end : null,
    branchId: shouldLoad ? branchId ?? null : null,
  });

  // ==== BRUTAS / NETAS ====
  const { brutas, netas, loading: loadingBrutasNetas } = useBrutasNetas({
    startDate: shouldLoad ? start : null,
    endDate: shouldLoad ? end : null,
    branchId: shouldLoad ? branchId ?? null : null,
  });

  // ============================
  // 🔵 GANANCIA POR VENTA (con botón Buscar)
  // ============================
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

  // === VALIDACIONES ===
  const rangoInvalido =
    !start || !end || new Date(start) > new Date(end) || !branchId;

  useEffect(() => {
    if (!loading && shouldLoad) {
      setDataLoaded(true);
      setShouldLoad(false);
    }
  }, [loading, shouldLoad]);

  // === SERIES ===
  const serieDia = transformarGanancias(diario, "day");
  const serieSemana = transformarGanancias(diario, "week");
  const serieMes = transformarGanancias(diario, "month");

  // === SUBTABS Ganancias ===
  const subtabsGanancia = [
    { label: "Por Día", content: <GananciasChart titulo="Ganancia por Día" data={serieDia} /> },
    { label: "Por Semana", content: <GananciasChart titulo="Ganancia por Semana" data={serieSemana} /> },
    { label: "Por Mes", content: <GananciasChart titulo="Ganancia por Mes" data={serieMes} /> },
  ];

  // === TABS PRINCIPALES ===
  const tabs = [
    {
      label: "Ganancias",
      content: (
        <div>
          <IndicadorHoy valor={resumen?.hoy ?? 0} />
          {dataLoaded ? (
            <div className="mt-6">
              <Tabs tabs={subtabsGanancia} />
            </div>
          ) : (
            <p className="mt-4 text-gray-500">
              Presiona <strong>Actualizar</strong> para ver las gráficas.
            </p>
          )}
        </div>
      ),
    },
    {
      label: "Brutas / Netas",
      content: dataLoaded ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-4 shadow">
            <h2 className="font-semibold mb-2">Resumen Ganancias</h2>
            {resumen && <ResumenGananciasChart data={resumen} />}
          </div>

          <div className="border rounded-lg p-4 shadow">
            <h2 className="font-semibold mb-2">Ventas Brutas vs Netas</h2>
            {loadingBrutasNetas ? <p>Cargando...</p> : <BrutasNetasChart brutas={brutas} netas={netas} />}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-gray-500">
          Presiona <strong>Actualizar</strong> para ver las gráficas.
        </p>
      ),
    },

    // ============================
    // 🔵 TAB Ganancia por Venta (BOTÓN BUSCAR)
    // ============================
    {
      label: "Ganancia por Venta",
      content: (
        <div className="p-4 border rounded shadow">
          <h2 className="font-semibold mb-3">Ganancia por Venta</h2>

          <div className="flex gap-3 mb-4 items-end">
            <label className="text-sm">
              ID Venta:
              <input
                type="number"
                className="border rounded px-3 py-1 ml-2"
                value={ventaIdInput}
                onChange={(e) => {
                  setVentaIdInput(e.target.value);
                  setShouldLoadVenta(false);
                }}
                placeholder="Ej: 15"
              />
            </label>

            <button
              onClick={onBuscarVenta}
              className="px-4 py-1.5 bg-blue-600 text-white rounded"
              disabled={!ventaIdNumber}
            >
              Buscar
            </button>
          </div>

          {!shouldLoadVenta ? (
            <p className="text-gray-500">Ingresa un ID y presiona <strong>Buscar</strong>.</p>
          ) : loadingVenta ? (
            <p>Cargando...</p>
          ) : (
            ganancia != null && (
              <GananciaPorVentaChart ventaId={ventaIdNumber} ganancia={ganancia} />
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reportes de Ganancias</h1>

      {/* FILTROS PRINCIPALES */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {isSuper ? (
          <div>
            <label className="block text-sm">Sucursal</label>
            <select
              className="border rounded px-3 py-2"
              value={branchId ?? ""}
              onChange={(e) =>
                setBranchId(e.target.value ? Number(e.target.value) : undefined)
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
            <label className="block text-sm">Sucursal</label>
            <input
              className="border rounded px-3 py-2 bg-slate-100"
              value={
                branchesHook.data.find((b) => b.id === auth.user?.branchId)?.name ??
                "Sucursal asignada"
              }
              readOnly
            />
          </div>
        )}

        <div>
          <label>Desde:</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border p-1 ml-2"
          />
        </div>

        <div>
          <label>Hasta:</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border p-1 ml-2"
          />
        </div>

        <button
          onClick={onBuscar}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={rangoInvalido}
        >
          Actualizar
        </button>
      </div>

      {rangoInvalido && (
        <p className="text-red-600 mb-4">
          Selecciona una sucursal y un rango válido.
        </p>
      )}

      {dataLoaded && <Tabs tabs={tabs} />}
    </div>
  );
}
