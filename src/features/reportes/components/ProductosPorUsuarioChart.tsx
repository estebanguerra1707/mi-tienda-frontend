import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { TopProductoDTO } from "@/features/dashboard/components/ProductChart";

interface Props {
  data: TopProductoDTO[];
}

const colores = [
  "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#ca8a04", "#0ea5e9"
];

/* 🔥 Tipo exacto para el payload del tooltip */
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

/* 🔥 Tipo correcto para las props del tooltip */
interface TooltipPropsTyped {
  active?: boolean;
  payload?: TooltipEntry[];
}

/* 🔥 Tooltip profesional mostrando TODAS las barras correctamente */
const TooltipUsuario = ({ active, payload }: TooltipPropsTyped) => {
  if (!active || !payload || payload.length === 0) return null;

  const producto = payload[0].payload.productName;

  return (
    <div className="bg-white p-3 border rounded shadow-lg text-sm min-w-[180px]">
      {/* Producto */}
      <p className="font-semibold text-gray-900 mb-2 border-b pb-1">
        {producto}
      </p>

      {/* Mostrar todas las barras */}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-1">

          {/* Punto de color */}
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: p.color,
              borderRadius: "50%"
            }}
          />

          {/* Usuario */}
          <span className="font-medium text-gray-700">
            {p.dataKey}:
          </span>

          {/* Valor */}
          <span className="ml-auto text-blue-600 font-semibold">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function ProductosPorUsuarioChart({ data }: Props) {

  const usuarios = Array.from(new Set(data.map((p) => p.username)));

  const dataset = data.map((item) => {
    const row: Record<string, number | string> = {
      productName: item.productName
    };
    usuarios.forEach((u) => {
      row[u] = item.username === u ? item.totalQuantity : 0;
    });
    return row;
  });

  return (
    <div className="w-full h-80 bg-white p-4 border rounded shadow mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dataset}>
          <XAxis dataKey="productName" />
          <YAxis />

          {/* Tooltip tipado correctamente */}
          <Tooltip content={<TooltipUsuario />} />

          {usuarios.map((u, idx) => (
            <Bar
              key={u}
              dataKey={u}
              fill={colores[idx % colores.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
