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
  salesCount?: number | null;
}

export interface TopProductoDTO {
  productName: string;
  totalQuantity: number | string;
  totalIncome?: number | string | null;
  ultimaVenta?: string | null;
  saleDate?: string | null;
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

const truncate = (s: string, max = 16) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

const TooltipProducto = ({ active, payload }: TooltipExtraProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0].payload;
  const usuarios = p.usuarios ?? [];

  return (
    <div className="bg-white p-3 border rounded-xl shadow-xl text-sm min-w-[260px] max-w-[330px]">
      <p className="font-bold text-gray-900 border-b pb-1 mb-2">
        {p.productName}
      </p>

      <div className="space-y-1 text-gray-700">
        <p>
          <span className="font-semibold">Total vendido:</span>{" "}
          {formatQty(p.totalQuantity)}
        </p>

        {p.totalIncome !== undefined && p.totalIncome !== null && (
          <p>
            <span className="font-semibold">Ingreso total:</span>{" "}
            {formatMoney(p.totalIncome)}
          </p>
        )}

        {p.categoria && (
          <p>
            <span className="font-semibold">Categoría:</span> {p.categoria}
          </p>
        )}

        {p.branchName && (
          <p>
            <span className="font-semibold">Sucursal:</span> {p.branchName}
          </p>
        )}
      </div>

      {usuarios.length > 0 && (
        <div className="mt-3 pt-2 border-t">
          <p className="font-semibold text-gray-900 mb-2">
            Vendido por usuario
          </p>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {usuarios.map((u, idx) => (
              <div key={`${u.userId ?? u.username ?? idx}`} className="text-xs">
                <p className="font-semibold text-gray-800 truncate">
                  {u.username ?? "Usuario sin nombre"}
                </p>

                <p className="text-gray-600">
                  {formatQty(u.totalQuantity)} pzas ·{" "}
                  {formatMoney(u.totalIncome)} · {u.salesCount ?? 0} ventas
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {usuarios.length === 0 && p.username && (
        <div className="mt-3 pt-2 border-t text-xs text-gray-700">
          <p>
            <span className="font-semibold">Vendedor:</span> {p.username}
          </p>
        </div>
      )}
    </div>
  );
};

export function ProductosChart({ data }: Props) {
  const top = data.slice(0, 12);
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
            margin={{
              top: 10,
              right: 12,
              left: 0,
              bottom: shouldRotate ? 55 : 25,
            }}
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

            <Tooltip content={<TooltipProducto />} />

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