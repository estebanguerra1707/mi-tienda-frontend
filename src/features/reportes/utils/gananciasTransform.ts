import { GananciaDiaDTO } from "../api";

export function transformarGanancias(
  datos: GananciaDiaDTO[],
  tipo: "day" | "week" | "month"
) {
  if (!datos || datos.length === 0) return [];

  const fechas = datos.map((d) => new Date(d.fecha));
  const fechaMin = new Date(Math.min(...fechas.map((f) => f.getTime())));
  const fechaMax = new Date(Math.max(...fechas.map((f) => f.getTime())));

  if (tipo === "month") {
    const meses: { label: string; ganancia: number }[] = [];

    const cursor = new Date(
      fechaMin.getFullYear(),
      fechaMin.getMonth(),
      1
    );
    const fin = new Date(
      fechaMax.getFullYear(),
      fechaMax.getMonth(),
      1
    );

    while (cursor <= fin) {
      const label = cursor.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
      });

      const suma = datos
        .filter((d) => {
          const fd = new Date(d.fecha);
          return (
            fd.getFullYear() === cursor.getFullYear() &&
            fd.getMonth() === cursor.getMonth()
          );
        })
        .reduce((acc, d) => acc + Number(d.ganancia), 0);

      meses.push({
        label,
        ganancia: suma,
      });

      // avanzar 1 mes
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return meses;
  }

  if (tipo === "day") {
    return datos.map((d) => ({
      label: new Date(d.fecha).toLocaleDateString("es-MX"),
      ganancia: Number(d.ganancia),
    }));
  }
  if (tipo === "week") {
    const semanas: Record<string, number> = {};

    datos.forEach((d) => {
      const fecha = new Date(d.fecha);

      // obtener lunes de esa semana
      const lunes = new Date(fecha);
      const day = fecha.getDay(); // 0 domingo, 1 lunes
      const diff = day === 0 ? -6 : 1 - day; // ajustar para lunes
      lunes.setDate(fecha.getDate() + diff);

      const key = lunes.toLocaleDateString("es-MX");

      semanas[key] = (semanas[key] || 0) + Number(d.ganancia);
    });

    return Object.entries(semanas).map(([label, ganancia]) => ({
      label,
      ganancia,
    }));
  }

  return [];
}
