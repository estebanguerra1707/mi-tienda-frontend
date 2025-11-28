import { ResponsiveContainer, Treemap } from "recharts";
import { TopProductoDTO } from "@/features/dashboard/components/ProductChart";

interface Props {
  data: TopProductoDTO[];
}

/** Props que realmente usamos del nodo del Treemap */
type TreemapNodeProps = {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number; // viene de dataKey ("size")
  fill: string;  // color del nodo
};

/** Nodo personalizado del Treemap (heatmap de productos) */
const CustomTreemapNode = ({
  depth,
  x,
  y,
  width,
  height,
  name,
  value,
  fill,
}: TreemapNodeProps) => {
  // Solo renderizar nodos finales (no el root)
  if (depth !== 1) return null;

  const textX = x + width / 2;
  const textY = y + height / 2;

  return (
    <g>
      {/* Rectángulo */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#ffffff"
      />

      {/* Texto centrado */}
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={12}
        fontWeight="bold"
      >
        {name} ({value})
      </text>
    </g>
  );
};

export function HeatmapProductos({ data }: Props) {
  if (!data || data.length === 0) return <p>No hay datos.</p>;

  // Agrupar por producto
  const productosMap: Record<string, number> = {};
  data.forEach((p) => {
    productosMap[p.productName] =
      (productosMap[p.productName] ?? 0) + p.totalQuantity;
  });

  // Formato que usa Treemap
  const heatmapData = Object.entries(productosMap).map(([name, total]) => ({
    name,
    size: total,    // lo usará dataKey="size"
    fill: "#3b82f6" // pasa como prop "fill" al nodo
  }));

  return (
    <div className="w-full h-[400px] bg-white p-4 border rounded shadow mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={heatmapData}
          dataKey="size"
          nameKey="name"
          stroke="#ffffff"
          fill="#3b82f6"
          // 👇 aquí está la clave: función que recibe nodeProps
          content={(nodeProps: unknown) => (
            <CustomTreemapNode
              {...(nodeProps as TreemapNodeProps)}
            />
          )}
        />
      </ResponsiveContainer>
    </div>
  );
}
