import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "@/utils/Colors";
import { ReporteGananciasDTO } from "../api";

export function ResumenGananciasChart({ data }: { data: ReporteGananciasDTO }) {
  const resumen = [
    { label: "Hoy", value: data.hoy },
    { label: "Semana", value: data.semana },
    { label: "Mes", value: data.mes },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={resumen}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />

          {/* Color único */}
          <Bar dataKey="value" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
