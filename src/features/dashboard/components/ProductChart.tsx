import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
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
    <div className="bg-white p-2 border rounded shadow">
      <p className="font-semibold">{p.productName}</p>
      <p>Cantidad vendida: {p.totalQuantity}</p>
    </div>
  );
};

export function ProductosChart({ data }: Props) {
  return (
    <div className="w-full h-72 mt-4 bg-white p-4 border rounded shadow">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} syncId="chart-consolidado">
          <XAxis dataKey="productName" />
          <YAxis />
          <Tooltip content={tooltipSimple} />
          <Bar dataKey="totalQuantity" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
