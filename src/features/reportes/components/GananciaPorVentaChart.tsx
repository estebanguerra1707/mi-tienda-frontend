import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface Props {
  ventaId: number | null;
  ganancia: number | null;
}

export function GananciaPorVentaChart({ ventaId, ganancia }: Props) {
  if (!ventaId || ganancia == null) return null;

  const data = [
    {
      name: `Venta #${ventaId}`,
      ganancia,
    },
  ];

  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          <Bar dataKey="ganancia" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
