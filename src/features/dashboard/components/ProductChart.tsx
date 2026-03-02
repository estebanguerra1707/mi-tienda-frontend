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
    <div className="bg-white p-3 border rounded-xl shadow-lg text-sm max-w-[220px]">
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

const truncate = (s: string, max = 16) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

export function ProductosChart({ data }: Props) {
  // ✅ evita charts pesados y labels interminables
  const top = data.slice(0, 12);

  // ✅ si hay pocos productos, no rotamos (se ve más limpio)
  const shouldRotate = top.length > 4;

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
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        Productos más vendidos
      </h2>

      <div className="w-full h-[260px] sm:h-[300px] min-w-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            syncId="chart-consolidado"
            barCategoryGap="25%"
            barGap={5}
            // ✅ más espacio para el texto del eje X (evita recorte)
            margin={{ top: 10, right: 12, left: 0, bottom: shouldRotate ? 55 : 25 }}
          >
            <XAxis
              dataKey="productName"
              interval={0}
              height={shouldRotate ? 85 : 55}
              tickMargin={10}
              tick={({ x, y, payload }) => {
                const value = String(payload.value ?? "");
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={16}
                      textAnchor={shouldRotate ? "end" : "middle"}
                      transform={shouldRotate ? "rotate(-35)" : undefined}
                      fontSize={10}
                      fill="#4B5563"
                    >
                      {truncate(value, 16)}
                    </text>
                  </g>
                );
              }}
            />

            <YAxis tick={{ fontSize: 12, fill: "#4B5563" }} width={40} />

            <Tooltip content={tooltipSimple} />

            <Bar
              dataKey="totalQuantity"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            >
              {top.map((_, index) => (
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
