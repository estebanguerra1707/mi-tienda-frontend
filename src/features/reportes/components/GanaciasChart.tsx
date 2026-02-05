import React, { useEffect, useMemo, useRef, useState } from "react";
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

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

type GananciasChartProps = {
  data: PuntoGrafica[];
  titulo: string;
  className?: string;
};

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setWidth(Math.round(w));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

type TooltipPayloadItem = {
  value?: number | string;
};


/** ✅ Tipos compatibles con Recharts */
type CustomTooltipProps = {
  active?: boolean;
 payload?: TooltipPayloadItem[];
   label?: string | number;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const first = payload[0];
  const raw = first?.value;

  const value =
    typeof raw === "number" ? raw : raw != null ? Number(raw) : 0;

  return (
    <div className="rounded-xl border bg-white/95 px-3 py-2 shadow-sm">
      <p className="text-xs text-gray-600">{label ?? ""}</p>
      <p className="text-sm font-semibold">{formatMoney(value)}</p>
    </div>
  );
}

type XAxisComponentProps = React.ComponentProps<typeof XAxis>;
type YAxisComponentProps = React.ComponentProps<typeof YAxis>;

export const GananciasChart: React.FC<GananciasChartProps> = ({
  data,
  titulo,
  className,
}) => {
  const { ref, width } = useContainerWidth<HTMLDivElement>();

  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const height = isMobile ? 220 : isTablet ? 280 : 340;

  const margins = useMemo(
    () => ({
      top: 8,
      right: isMobile ? 10 : 18,
      left: isMobile ? 0 : 8,
      bottom: isMobile ? 28 : 16,
    }),
    [isMobile]
  );

  const xAxisProps: Partial<XAxisComponentProps> = useMemo(() => {
    const interval: 0 | "preserveStartEnd" = isMobile ? "preserveStartEnd" : 0;
    return {
      interval,
      minTickGap: isMobile ? 24 : 12,
      tickMargin: isMobile ? 10 : 6,
      angle: isMobile ? -35 : 0,
      textAnchor: isMobile ? "end" : "middle",
      height: isMobile ? 42 : 30,
      tick: { fontSize: isMobile ? 10 : 12 },
    };
  }, [isMobile]);

  const yAxisProps: Partial<YAxisComponentProps> = useMemo(() => {
    return {
      width: isMobile ? 48 : 70,
      tick: { fontSize: isMobile ? 10 : 12 },
      tickFormatter: (v: number) => {
        if (!isMobile) return formatMoney(v);
        const abs = Math.abs(v);
        if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
        return `${v}`;
      },
    };
  }, [isMobile]);

  return (
    <div
      ref={ref}
      className={[
        "w-full rounded-2xl bg-white shadow",
        isMobile ? "p-3" : "p-4",
        "mb-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={["font-semibold", isMobile ? "text-base" : "text-lg"].join(" ")}>
          {titulo}
        </h2>
      </div>

      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={margins}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={(p) => <CustomTooltip {...p} />} />
            <Area type="monotone" dataKey="ganancia" name="Ganancia" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
