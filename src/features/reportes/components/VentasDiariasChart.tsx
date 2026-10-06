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
  gastos: number; // NUEVO CAMPO
  chilaquilesVendidos?: number;
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

export function VentasDiariasChart({ data, semanasAtras, onCambiarSemana }: VentasDiariasChartProps) {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) return null;

  const totalIngresos = data.reduce((sum, item) => sum + (Number(item.ingresos) || 0), 0);
  const totalGanancia = data.reduce((sum, item) => sum + (Number(item.ganancia) || 0), 0);
  const totalGastos = data.reduce((sum, item) => sum + (Number(item.gastos) || 0), 0); // NUEVO
  const totalChilaquiles = data.reduce((sum, item) => sum + (Number(item.chilaquilesVendidos) || 0), 0);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload; 
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-sm">
          <p className="font-bold text-slate-800 mb-2 border-b pb-1">{label}</p>
          <p className="text-blue-600 font-semibold mb-1">
            Ingresos: {formatMoney(item.ingresos)}
          </p>
          <p className="text-emerald-600 font-semibold mb-1">
            Ganancia Neta: {formatMoney(item.ganancia)}
          </p>
          <p className="text-red-500 font-semibold mb-1">
            Gastos: {formatMoney(item.gastos)}
          </p>
          <p className="text-pink-500 font-semibold">
            Vendidos: {item.chilaquilesVendidos || 0} pz
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-5 mt-2 border-t border-slate-100">
        
        {/* Leyenda Ingresos */}
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

        {/* Leyenda Ganancia */}
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

        {/* Leyenda Gastos (NUEVO) */}
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

        {/* Leyenda Cantidad Vendida */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="w-3 h-3 rounded shadow-sm bg-pink-500" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              Total Vendidos
            </span>
            <span className="text-xs sm:text-sm font-black leading-tight mt-1 text-pink-500">
              {totalChilaquiles} pz
            </span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="w-full mt-6 bg-white p-4 sm:p-5 border rounded-xl shadow overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">
          Ingresos, Gastos y Ganancias {semanasAtras === 0 ? "de la Semana" : `(Hace ${semanasAtras} semana${semanasAtras > 1 ? 's' : ''})`}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            type ="button"
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
              ${semanasAtras === 0 
                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            Siguiente <span>&rarr;</span>
          </button>
        </div>
      </div>

      <div className="w-full h-[320px] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300">
        <div style={{ minWidth: isMobile ? 500 : '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={4}
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
                maxBarSize={30} 
              />
              <Bar 
                dataKey="gastos" 
                name="Gastos" 
                fill="#EF4444" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={30} 
              />
              <Bar 
                dataKey="ganancia" 
                name="Ganancia Neta" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={30} 
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