import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { COLORS } from "@/utils/Colors";
interface Props {
  brutas: number | null;
  netas: number | null;
}

export function BrutasNetasChart({ brutas, netas }: Props) {
  if (brutas == null || netas == null) return null;
  const data = [
    {
      label: "Rango seleccionado",
      brutas,
      netas,
    },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Bar dataKey="brutas" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          <Bar dataKey="netas" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
