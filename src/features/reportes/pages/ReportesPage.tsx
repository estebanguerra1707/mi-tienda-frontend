"use client";

import { useState, useMemo } from "react";
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

// Fechas default
const hoy = new Date().toISOString().slice(0, 10);
const hace30 = new Date(Date.now() - 30 * 86400000)
  .toISOString()
  .slice(0, 10);

export default function ReportesPage() {
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");
  

  const {
  data: branches = [],
  isLoading: branchesLoading,
  }= useBranches({
    isSuper,
    businessTypeId: isSuper ? undefined : auth.user?.businessType ?? null,
    oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
  });

  const [branchId, setBranchId] = useState<number | null | undefined>(
    isSuper ? undefined : auth.user?.branchId ?? null
  );
  const [start, setStart] = useState(hace30);
  const [end, setEnd] = useState(hoy);

  const canLoad =
  !!branchId &&
  !!start &&
  !!end &&
  new Date(start) <= new Date(end);



  const { resumen, diario } = useGanancias({
    startDate: canLoad ? start : null,
    endDate: canLoad ? end : null,
    branchId: canLoad ? branchId ?? null : null,
  });

  const { brutas, netas, loading: loadingBrutasNetas } = useBrutasNetas({
    startDate: canLoad ? start : null,
    endDate: canLoad ? end : null,
    branchId: canLoad ? branchId ?? null : null,
  });
  

  const [ventaIdInput, setVentaIdInput] = useState("");
  const ventaIdNumber = ventaIdInput ? Number(ventaIdInput) : null;

  const canLoadVenta = !!ventaIdNumber && !!branchId;

  const { ganancia, loading: loadingVenta } = useGananciaPorVenta(
    canLoadVenta ? ventaIdNumber : null,
    canLoadVenta ? branchId : null
  );


  const rangoInvalido =
    !start || !end || new Date(start) > new Date(end) || !branchId;


  const serieDia = transformarGanancias(diario, "day");
  const serieSemana = transformarGanancias(diario, "week");
  const serieMes = transformarGanancias(diario, "month");

  const subtabsGanancia = [
    { label: "Por Día", content: <GananciasChart titulo="Ganancia por Día" data={serieDia} /> },
    { label: "Por Semana", content: <GananciasChart titulo="Ganancia por Semana" data={serieSemana} /> },
    { label: "Por Mes", content: <GananciasChart titulo="Ganancia por Mes" data={serieMes} /> },
  ];

const branchName = useMemo(() => {
  if (isSuper) return "";

  if (!auth.user?.branchId) return "";

  const branch = branches.find(
    (b) => b.id === auth.user?.branchId
  );

  return branch?.name ?? "";
}, [isSuper, auth.user?.branchId, branches]);
  const tabs = [
    {
      label: "Ganancias",
      content: (
        <div className="space-y-6">
          <IndicadorHoy valor={resumen?.hoy ?? 0} />

          {canLoad ? (
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border">
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
      content: canLoad ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border">
            <h2 className="text-lg font-semibold mb-4">Resumen de Ganancias</h2>
            {resumen && <ResumenGananciasChart data={resumen} />}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border">
            <h2 className="text-lg font-semibold mb-4">Brutas vs Netas</h2>
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

    {
      label: "Ganancia por Venta",
      content: (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border space-y-6">
          <h2 className="text-lg font-semibold">Ganancia por Venta</h2>

          <div className="grid grid-cols-1 sm:flex sm:items-end gap-4">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700">ID Venta</label>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 shadow-sm w-full"
                value={ventaIdInput}
                onChange={(e) => {
                  setVentaIdInput(e.target.value);
                }}
                placeholder="Ej: 15"
              />
            </div>
            <button
                type="button"
                disabled={!ventaIdNumber}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition w-full sm:w-auto"
              >
                Buscar
              </button>
          </div>

          {!canLoadVenta ? (
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes de Ganancias</h1>
        <p className="text-gray-500">
          Analiza ganancias, ventas brutas, netas y desglose por venta.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border space-y-6">
        <h2 className="text-lg font-semibold">Filtros del Reporte</h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Sucursal</label>

            {isSuper ? (
              <select
                disabled={branchesLoading}
                className="border rounded-lg px-3 py-2 shadow-sm"
                value={branchId ?? ""}
                onChange={(e) =>
                  setBranchId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">
                  {branchesLoading ? "Cargando sucursales…" : "Selecciona…"}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="border rounded-lg px-3 py-2 bg-gray-100 shadow-sm"
               value={branchName || "Sucursal asignada"}
                readOnly
              />
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Desde</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border rounded-lg px-3 py-2 shadow-sm"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Hasta</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border rounded-lg px-3 py-2 shadow-sm"
            />
          </div>

          <button
            className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-300 transition w-full sm:w-auto"
            disabled={rangoInvalido}
          >
            Buscar reporte
          </button>
        </div>

        {rangoInvalido && (
          <p className="text-red-600 mt-2">Selecciona una sucursal y un rango válido.</p>
        )}
      </div>

      {canLoad && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border">
          <Tabs tabs={tabs} />
        </div>
      )}
    </div>
  );
}
