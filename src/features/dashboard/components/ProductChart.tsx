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

export interface UsuarioVentaResumenDTO {
  userId?: number | null;
  username?: string | null;
  totalQuantity?: number | string | null;
  totalIncome?: number | string | null;
  netProfit?: number | string | null;
  salesCount?: number | null;
}

export interface TopProductoDTO {
  productName: string;
  totalQuantity: number | string;
  totalIncome?: number | string | null;
  ultimaVenta?: string | null;
  saleDate?: string | null;
  netProfit?: number | string | null;
  categoria?: string | null;
  tipoNegocio?: string | null;
  username?: string | null;
  branchName?: string | null;
  usuarios?: UsuarioVentaResumenDTO[] | null;
}

interface Props {
  data: TopProductoDTO[];
}

type TooltipExtraProps = TooltipProps<number, string> & {
  payload?: {
    payload: TopProductoDTO;
  }[];
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

const toNumber = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(toNumber(value));

const formatQty = (value: number | string | null | undefined) => {
  const n = toNumber(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
};

const truncate = (s: string, max = 14) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

const TooltipProducto = ({ active, payload }: TooltipExtraProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0].payload;
  const usuarios = p.usuarios ?? [];

  return (
    <div
      className="
        w-[min(94vw,300px)]
        max-h-[260px]
        overflow-y-auto
        rounded-xl
        border
        bg-white
        p-3
        shadow-xl
        text-[11px]
        leading-tight
      "
    >
      <p className="font-bold text-slate-900 text-sm border-b pb-2 mb-2 break-words">
        {p.productName}
      </p>

      <div className="flex flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap pb-2 border-b">
        <span className="font-semibold text-slate-700">
          Pzas:{" "}
          <span className="font-bold text-slate-900">
            {formatQty(p.totalQuantity)}
          </span>
        </span>

        <span className="font-semibold text-slate-700">
          Bruto:{" "}
          <span className="font-bold text-blue-700">
            {formatMoney(p.totalIncome)}
          </span>
        </span>

        <span className="font-semibold text-slate-700">
          Ganancia:{" "}
          <span className="font-bold text-green-600">
            {formatMoney(p.netProfit)}
          </span>
        </span>
      </div>

      {usuarios.length > 0 && (
        <div className="mt-2 space-y-2">
          {usuarios.map((u, idx) => (
            <div
              key={`${u.userId ?? u.username ?? idx}`}
              className="border-b last:border-b-0 pb-2 last:pb-0"
            >
              <p className="font-semibold text-slate-800 break-words mb-1">
                {u.username ?? "Usuario sin nombre"}
              </p>

              <div className="flex flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap text-[11px]">
                <span className="text-slate-600">
                  Pzas:{" "}
                  <span className="font-bold text-slate-900">
                    {formatQty(u.totalQuantity)}
                  </span>
                </span>

                <span className="text-slate-600">
                  Ventas:{" "}
                  <span className="font-bold text-slate-900">
                    {u.salesCount ?? 0}
                  </span>
                </span>

                <span className="text-slate-600">
                  Bruto:{" "}
                  <span className="font-bold text-blue-700">
                    {formatMoney(u.totalIncome)}
                  </span>
                </span>

                <span className="text-slate-600">
                  Ganancia:{" "}
                  <span className="font-bold text-green-600">
                    {formatMoney(u.netProfit)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export function ProductosChart({ data }: Props) {
  const top = data.slice(0, 12);
  const shouldRotate = top.length > 4;

  const chartMinWidth = Math.max(360, top.length * 95);
  const chartHeight = top.length > 8 ? 340 : 300;

  if (!top.length) {
    return (
      <div className="w-full mt-4 bg-white p-4 sm:p-5 border rounded-xl shadow">
        <h2 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">
          Productos más vendidos
        </h2>

        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
          No hay productos vendidos para mostrar.
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        w-full
        mt-4
        bg-white
        p-3
        sm:p-4
        md:p-5
        border
        rounded-xl
        shadow
        overflow-visible
      "
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
          Productos más vendidos
        </h2>

        <p className="text-xs sm:text-sm text-gray-500">
          Top {top.length} productos
        </p>
      </div>

      <div
        className="
          w-full
          overflow-x-auto
          overflow-y-hidden
          pb-2
          scrollbar-thin
          scrollbar-thumb-gray-300
          scrollbar-track-gray-100
        "
      >
        <div
          style={{
            minWidth: chartMinWidth,
            height: chartHeight,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top}
              syncId="chart-consolidado"
              barCategoryGap={top.length <= 3 ? "45%" : "25%"}
              barGap={5}
              margin={{
                top: 10,
                right: 12,
                left: -8,
                bottom: shouldRotate ? 70 : 35,
              }}
            >
              <XAxis
                dataKey="productName"
                interval={0}
                height={shouldRotate ? 95 : 55}
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
                        fontSize={11}
                        fill="#4B5563"
                      >
                        {truncate(value, shouldRotate ? 14 : 18)}
                      </text>
                    </g>
                  );
                }}
              />

              <YAxis
                tick={{ fontSize: 12, fill: "#4B5563" }}
                width={36}
                allowDecimals={false}
              />

             <Tooltip
                content={<TooltipProducto />}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{
                  outline: "none",
                  zIndex: 9999,
                  pointerEvents: "none",
                }}
              />

              <Bar
                dataKey="totalQuantity"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
                maxBarSize={90}
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

      <p className="mt-2 text-[11px] sm:text-xs text-gray-400">
        En celular puedes deslizar la gráfica horizontalmente.
      </p>
    </div>
  );
}