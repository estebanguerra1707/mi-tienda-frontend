import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


export interface PuntoGrafica {
  label: string;
  ganancia: number;
}

const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export const GananciasChart = ({ data, titulo }: { data: PuntoGrafica[]; titulo: string }) => {
  return (
    <div className="shadow p-4 bg-white rounded mb-6">
      <h2 className="font-semibold text-lg mb-2">{titulo}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(v) => formatter.format(v as number)} />
          <Area type="monotone" dataKey="ganancia" name="Ganancia" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
