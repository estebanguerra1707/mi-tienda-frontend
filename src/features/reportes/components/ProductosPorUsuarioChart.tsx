import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TopProductoDTO,
  UsuarioVentaResumenDTO,
} from "@/features/dashboard/components/ProductChart";

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

type DatasetRow = Record<string, number | string>;

const toNumber = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const truncate = (s: string, max = 18) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

const normalizarDataset = (data: TopProductoDTO[]) => {
  const usuariosSet = new Set<string>();
  const map = new Map<string, DatasetRow>();

  data.forEach((item) => {
    const productName = item.productName;
    const row = map.get(productName) ?? { productName };

    const usuarios: UsuarioVentaResumenDTO[] =
      item.usuarios && item.usuarios.length > 0
        ? item.usuarios
        : item.username
          ? [
              {
                username: item.username,
                totalQuantity: item.totalQuantity,
                totalIncome: item.totalIncome,
                salesCount: 1,
              },
            ]
          : [];

    usuarios.forEach((u) => {
      const username = u.username ?? "Usuario sin nombre";
      usuariosSet.add(username);

      row[username] =
        toNumber(row[username] as number | string | undefined) +
        toNumber(u.totalQuantity);
    });

    map.set(productName, row);
  });

  return {
    usuarios: Array.from(usuariosSet),
    dataset: Array.from(map.values()),
  };
};

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
  const visibles = payload.filter((p) => Number(p.value) > 0);

  return (
    <div className="bg-white p-3 border rounded-lg shadow-xl text-sm min-w-[220px]">
      <p className="font-semibold text-gray-900 mb-2 border-b pb-1 text-[14px]">
        {producto}
      </p>

      {visibles.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-1">
          <span
            style={{
              width: 10,
              height: 10,
              background: p.color,
              borderRadius: "50%",
            }}
          />

          <span className="font-medium text-gray-700 text-[13px] truncate max-w-[140px]">
            {p.dataKey}
          </span>

          <span className="ml-auto text-blue-600 font-semibold text-[13px]">
            {p.value}
          </span>
        </div>
      ))}

      {visibles.length === 0 && (
        <p className="text-gray-500 text-xs">Sin ventas para este usuario.</p>
      )}
    </div>
  );
};

export function ProductosPorUsuarioChart({ data }: Props) {
  const { usuarios, dataset } = normalizarDataset(data);

  return (
    <div className="w-full bg-white rounded-xl shadow-md mt-4 p-4 border overflow-x-auto md:overflow-visible">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        Productos vendidos por usuario
      </h2>

      <div className="w-[650px] md:w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataset}>
            <XAxis
              dataKey="productName"
              interval={0}
              height={70}
              tick={({ x, y, payload }) => {
                const value = String(payload.value ?? "");

                return (
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
                      {truncate(value, 18)}
                    </text>
                  </g>
                );
              }}
            />

            <YAxis tick={{ fontSize: 12, fill: "#4B5563" }} />

            <Tooltip content={<TooltipUsuario />} />

            {usuarios.map((u, idx) => (
              <Bar
                key={u}
                dataKey={u}
                fill={colores[idx % colores.length]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}