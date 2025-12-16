import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from "recharts";

export interface TopProductoDTO {
  productName: string;
  totalQuantity: number;
  saleDate: string;
  username: string;
  branchName: string;
}

interface Props {
  data: TopProductoDTO[];
}

type TooltipExtraProps = TooltipProps<number, string> & {
  payload?: {
    payload: TopProductoDTO;
  }[];
};

const tooltipSimple = ({ active, payload }: TooltipExtraProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0].payload;

  return (
    <div className="bg-white p-3 border rounded-xl shadow-lg text-sm max-w-[200px]">
      <p className="font-semibold text-gray-900">{p.productName}</p>
      <p className="text-gray-700">Cantidad vendida: {p.totalQuantity}</p>
    </div>
  );
};

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F472B6",
  "#6366F1",
  "#22C55E",
];

export function ProductosChart({ data }: Props) {
  return (
    <div
      className="
        w-full 
        mt-4 
        bg-white 
        p-4 
        border 
        rounded-xl 
        shadow 
        overflow-x-auto 
        scrollbar-thin
        scrollbar-thumb-gray-300
        scrollbar-track-gray-100
      "
    >
      {/* Título responsivo */}
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        Productos más vendidos
      </h2>

      {/* Contenedor del gráfico optimizado para móvil */}
      <div className="w-full h-[260px] sm:h-[300px] min-w-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            syncId="chart-consolidado"
            barCategoryGap="25%"
            barGap={5}
          >
        <XAxis
          dataKey="productName"
          interval={0}
          height={65}
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text
                x={0}
                y={0}
                dy={16}
                textAnchor="end"
                transform="rotate(-35)"
                fontSize="10"
                fill="#4B5563"
              >
                {payload.value}
              </text>
            </g>
          )}
        />

            <YAxis
              tick={{ fontSize: 12, fill: "#4B5563" }}
              width={40}
            />

            <Tooltip content={tooltipSimple} />

            <Bar dataKey="totalQuantity" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
