import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

export interface VentaDiariaDTO {
  dia: string;
  ingresos: number;
  ganancia: number;
  gastos: number;
  chilaquilesVendidos?: number;
  costoChilaquiles?: number;
  costoPanes?: number;
  costoOtros?: number;
  piezasChilaquiles?: number;
  piezasPanes?: number;
  piezasOtros?: number;
}

interface VentasDiariasChartProps {
  data: VentaDiariaDTO[];
  semanasAtras: number;
  onCambiarSemana: (nuevaSemana: number) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: VentaDiariaDTO }>;
  label?: string;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
};

export function VentasDiariasChart({
  data,
  semanasAtras,
  onCambiarSemana,
}: VentasDiariasChartProps) {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) return null;

  const totalIngresos = data.reduce((sum, item) => sum + (Number(item.ingresos) || 0), 0);
  const totalGanancia = data.reduce((sum, item) => sum + (Number(item.ganancia) || 0), 0);
  const totalGastos = data.reduce((sum, item) => sum + (Number(item.gastos) || 0), 0);
  const totalVendidos = data.reduce((sum, item) => sum + (Number(item.chilaquilesVendidos) || 0), 0);

  const totalCostoChilaquiles = data.reduce((sum, item) => sum + (Number(item.costoChilaquiles) || 0), 0);
  const totalCostoPanes = data.reduce((sum, item) => sum + (Number(item.costoPanes) || 0), 0);
  const totalCostoOtros = data.reduce((sum, item) => sum + (Number(item.costoOtros) || 0), 0);

  const totalPzChilaquiles = data.reduce((sum, item) => sum + (Number(item.piezasChilaquiles) || 0), 0);
  const totalPzPanes = data.reduce((sum, item) => sum + (Number(item.piezasPanes) || 0), 0);
  const totalPzOtros = data.reduce((sum, item) => sum + (Number(item.piezasOtros) || 0), 0);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const cChilaquiles = Number(item.costoChilaquiles) || 0;
      const cPanes = Number(item.costoPanes) || 0;
      const cOtros = Number(item.costoOtros) || 0;

      const pzChilaquiles = Number(item.piezasChilaquiles) || 0;
      const pzPanes = Number(item.piezasPanes) || 0;
      const pzOtros = Number(item.piezasOtros) || 0;

      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-sm space-y-1">
          <p className="font-bold text-slate-800 mb-2 border-b pb-1">{label}</p>
          <p className="text-blue-600 font-semibold">
            Ingresos: {formatMoney(item.ingresos)}
          </p>
          <p className="text-emerald-600 font-semibold">
            Ganancia Neta: {formatMoney(item.ganancia)}
          </p>
          <div className="border-t border-slate-100 my-1 pt-1 space-y-1">
            <p className="text-amber-600 font-semibold">
              Costo Chilaquiles: {formatMoney(cChilaquiles)} ({pzChilaquiles} pz)
            </p>
            <p className="text-orange-600 font-semibold">
              Costo Panes: {formatMoney(cPanes)} ({pzPanes} pz)
            </p>
            <p className="text-purple-600 font-semibold">
              Costo Café/Extras: {formatMoney(cOtros)} ({pzOtros} pz)
            </p>
          </div>
          <p className="text-red-500 font-semibold border-t border-slate-100 pt-1">
            Gastos Operativos: {formatMoney(item.gastos)}
          </p>
          <p className="text-pink-500 font-semibold">
            Total Vendidos: {item.chilaquilesVendidos || 0} pz
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 pt-5 mt-2 border-t border-slate-100">
        {/* Total Ingresos */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="w-3 h-3 rounded shadow-sm bg-blue-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              Total Ingresos
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-blue-600">
              {formatMoney(totalIngresos)}
            </span>
          </div>
        </div>

        {/* Total Ganancia */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="w-3 h-3 rounded shadow-sm bg-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              Total Ganancia
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-emerald-600">
              {formatMoney(totalGanancia)}
            </span>
          </div>
        </div>

        {/* Costo Chilaquiles */}
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <div className="w-3 h-3 rounded shadow-sm bg-amber-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 uppercase tracking-wider leading-none">
              Costo Chilaquiles ({totalPzChilaquiles} pz)
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-amber-600">
              {formatMoney(totalCostoChilaquiles)}
            </span>
          </div>
        </div>

        {/* Costo Panes */}
        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
          <div className="w-3 h-3 rounded shadow-sm bg-orange-600" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-orange-800 uppercase tracking-wider leading-none">
              Costo Panes ({totalPzPanes} pz)
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-orange-600">
              {formatMoney(totalCostoPanes)}
            </span>
          </div>
        </div>

        {/* Costo Café / Extras */}
        <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
          <div className="w-3 h-3 rounded shadow-sm bg-purple-600" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-purple-800 uppercase tracking-wider leading-none">
              Costo Extras/Café ({totalPzOtros} pz)
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-purple-600">
              {formatMoney(totalCostoOtros)}
            </span>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="w-3 h-3 rounded shadow-sm bg-red-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              Total Gastos
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-red-500">
              {formatMoney(totalGastos)}
            </span>
          </div>
        </div>

        {/* Total Vendidos */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="w-3 h-3 rounded shadow-sm bg-pink-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              Total Vendidos
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-pink-500">
              {totalVendidos} pz
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-6 bg-white p-4 sm:p-5 border rounded-xl shadow overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Ingresos, Costos, Gastos y Ganancias{" "}
            {semanasAtras === 0
              ? "de la Semana"
              : `(Hace ${semanasAtras} semana${semanasAtras > 1 ? "s" : ""})`}
          </h2>
          <p className="text-xs text-slate-500">
            Comparativa diaria de ventas y costo de elaboración.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCambiarSemana(semanasAtras + 1)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 flex items-center gap-1"
          >
            <span>&larr;</span> Anterior
          </button>

          <button
            type="button"
            onClick={() => onCambiarSemana(semanasAtras - 1)}
            disabled={semanasAtras === 0}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border flex items-center gap-1
              ${
                semanasAtras === 0
                  ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
          >
            Siguiente <span>&rarr;</span>
          </button>
        </div>
      </div>

      <div className="w-full h-[350px] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300">
        <div style={{ minWidth: isMobile ? 600 : "100%", height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val) => `$${val}`}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F3F4F6" }} />

              <Legend content={renderCustomLegend} verticalAlign="bottom" />

              <Bar
                dataKey="ingresos"
                name="Ingresos"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="costoChilaquiles"
                name="Costo Chilaquiles"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="costoPanes"
                name="Costo Panes"
                fill="#EA580C"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="costoOtros"
                name="Costo Extras/Café"
                fill="#9333EA"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="gastos"
                name="Gastos"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="ganancia"
                name="Ganancia Neta"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {isMobile && (
        <p className="mt-2 text-[11px] text-gray-400 text-center">
          Desliza la gráfica horizontalmente para ver más días.
        </p>
      )}
    </div>
  );
}