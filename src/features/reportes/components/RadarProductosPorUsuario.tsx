import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TopProductoDTO } from "@/features/dashboard/components/ProductChart";

interface Props {
  data: TopProductoDTO[];
}

export function RadarProductosPorUsuario({ data }: Props) {
  const usuarios = Array.from(new Set(data.map((d) => d.username)));

  // Convertir data por producto → usuarios
  const dataset = data.map((p) => {
    const row: Record<string, string | number> = {
      productName: p.productName,
    };

    usuarios.forEach((u) => {
      row[u] = p.username === u ? p.totalQuantity : 0;
    });

    return row;
  });

  const colores = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#7c3aed",
    "#ca8a04",
    "#0ea5e9",
  ];

  return (
    <div className="w-full h-[460px] bg-white p-4 border rounded shadow mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataset}>
          <PolarGrid />
          <PolarAngleAxis dataKey="productName" />
          <Tooltip />

          {usuarios.map((u, idx) => (
            <Radar
              key={u}
              name={u}
              dataKey={u}
              stroke={colores[idx % colores.length]}
              fill={colores[idx % colores.length]}
              fillOpacity={0.6}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
