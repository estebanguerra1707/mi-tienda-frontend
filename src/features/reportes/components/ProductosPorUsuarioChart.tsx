import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TopProductoDTO } from "@/features/dashboard/components/ProductChart";

/* 🎨 Paleta de colores */
const colores = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#ca8a04",
  "#0ea5e9",
];

interface Props {
  data: TopProductoDTO[];
}

/* Tooltip mejorado para móviles */
type TooltipEntry = {
  name: string;
  value: number;
  dataKey: string;
  color: string;
  payload: {
    productName: string;
    [key: string]: string | number;
  };
};

interface TooltipPropsTyped {
  active?: boolean;
  payload?: TooltipEntry[];
}

const TooltipUsuario = ({ active, payload }: TooltipPropsTyped) => {
  if (!active || !payload || payload.length === 0) return null;

  const producto = payload[0].payload.productName;

  return (
    <div className="bg-white p-3 border rounded-lg shadow-xl text-sm min-w-[180px]">
      <p className="font-semibold text-gray-900 mb-2 border-b pb-1 text-[14px]">
        {producto}
      </p>

      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-1">
          <span
            style={{
              width: 10,
              height: 10,
              background: p.color,
              borderRadius: "50%",
            }}
          />
          <span className="font-medium text-gray-700 text-[13px]">{p.dataKey}:</span>
          <span className="ml-auto text-blue-600 font-semibold text-[13px]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ProductosPorUsuarioChart({ data }: Props) {
  const usuarios = Array.from(new Set(data.map((p) => p.username)));

  const dataset = data.map((item) => {
    const row: Record<string, number | string> = {
      productName: item.productName,
    };

    usuarios.forEach((u) => {
      row[u] = item.username === u ? item.totalQuantity : 0;
    });

    return row;
  });

  return (
    <div className="w-full bg-white rounded-xl shadow-md mt-4 p-4 border overflow-x-auto md:overflow-visible">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        Productos vendidos por usuario
      </h2>

      <div className="w-[600px] md:w-full h-80"> 
        {/* 📱 Para móviles, damos ancho fijo y scroll horizontal */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataset}>
            {/* 📱 Etiquetas giradas para mejor lectura en móvil */}
            <XAxis
              dataKey="productName"
              interval={0}
              height={70}
              tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="end"
                    transform="rotate(-40)"
                    fontSize="10"
                    fill="#4B5563"
                  >
                    {payload.value}
                  </text>
                </g>
              )}
            />

            {/* Eje Y más limpio */}
            <YAxis
              tick={{ fontSize: 12, fill: "#4B5563" }}
            />

            {/* Tooltip moderno */}
            <Tooltip content={<TooltipUsuario />} />

            {/* Gradientes profesionales */}
            <defs>
              {usuarios.map((u, idx) => (
                <linearGradient
                  key={u}
                  id={`grad-${idx}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={colores[idx % colores.length]}
                    stopOpacity={0.95}
                  />
                  <stop
                    offset="100%"
                    stopColor={colores[idx % colores.length]}
                    stopOpacity={0.45}
                  />
                </linearGradient>
              ))}
            </defs>

            {/* Barras con gradient */}
            {usuarios.map((u, idx) => (
              <Bar
                key={u}
                dataKey={u}
                fill={`url(#grad-${idx})`}
                radius={[4, 4, 0, 0]} // esquinas redondeadas
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
