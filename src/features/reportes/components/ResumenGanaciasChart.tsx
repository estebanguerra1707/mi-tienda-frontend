import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS } from "@/utils/Colors";
import { ReporteGananciasDTO } from "../api";

export function ResumenGananciasChart({ data }: { data: ReporteGananciasDTO }) {
  const resumen = [
    { label: "Hoy", value: data.hoy },
    { label: "Semana", value: data.semana },
    { label: "Mes", value: data.mes },
  ];

  // 🎨 colores tomados de tu paleta
  const COLOR_LIST = [
    COLORS.primary,   // azul
    COLORS.secondary, // verde
    COLORS.warning    // amarillo
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={resumen}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />

          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {resumen.map((_, index) => (
              <Cell key={index} fill={COLOR_LIST[index % COLOR_LIST.length]} />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
