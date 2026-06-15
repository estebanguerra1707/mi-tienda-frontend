"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useClients } from "@/hooks/useClients";
import { usePaymentMethods } from "@/hooks/useCatalogs";

interface Props {
  onApply: (next: Record<string, string | undefined>) => void;
  showId?: boolean;
  onClear?: () => void;
  showWeeklyConsolidation?: boolean;

}

export default function AdvancedFiltersVentas({
  onApply,
  showId = false,
  onClear,
  showWeeklyConsolidation = false,
}: Props) {
  const [filtros, setFiltros] = useState<Record<string, string | undefined>>({
    clientId: "",
    paymentMethodId: "",
    startDate: "",
    endDate: "",
    min: "",
    max: "",
    day: "",
    month: "",
    year: "",
    active: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const { data: clients = [] } = useClients();
  const { data: paymentMethods = [] } = usePaymentMethods();

  const parseLocalDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const startDate = parseLocalDate(filtros.startDate);
  const endDate = parseLocalDate(filtros.endDate);

  const pad = (n: number) => String(n).padStart(2, "0");

const toBackendDateTime = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};

const buildSemanaMartesLunes = (weeksBack: number) => {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // JS: domingo=0, lunes=1, martes=2...
  const diffToTuesday = (base.getDay() - 2 + 7) % 7;

  const currentTuesday = new Date(base);
  currentTuesday.setDate(base.getDate() - diffToTuesday);

  const start = new Date(currentTuesday);
  start.setDate(currentTuesday.getDate() - weeksBack * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: toBackendDateTime(start),
    endDate: toBackendDateTime(end),
  };
};

const applySemanaMartesLunes = (weeksBack: number) => {
  const semana = buildSemanaMartesLunes(weeksBack);

  const next = {
    ...filtros,
    startDate: semana.startDate,
    endDate: semana.endDate,
  };

  setFiltros(next);

  const clean = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v != null && v !== "")
  );

  onApply({ ...clean, page: "0", size: "20" });
};

const periodoSemanalLabel =
  startDate && endDate
    ? `${format(startDate, "EEEE dd MMM yyyy", { locale: es })} - ${format(
        endDate,
        "EEEE dd MMM yyyy",
        { locale: es }
      )}`
    : "Sin periodo semanal seleccionado";

  const setDate = (key: "startDate" | "endDate", d?: Date) => {
    if (!d) {
      setFiltros((p) => ({ ...p, [key]: undefined }));
      return;
    }

    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (key === "startDate") local.setHours(0, 0, 0, 0);
    else local.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(
      local.getDate()
    )}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(
      local.getSeconds()
    )}`;

    setFiltros((p) => ({ ...p, [key]: formatted }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (value === "" || value === "NaN") {
      setFiltros((p) => ({ ...p, [name]: undefined }));
      return;
    }

    setFiltros((p) => ({ ...p, [name]: value }));
  };

  const apply = () => {
    const clean = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v != null && v !== "")
    );
    onApply({ ...clean, page: "0", size: "20" });

  };

  const clear = () => {
    setFiltros({});
    setShowAdvanced(false);
    setOpenStart(false);
    setOpenEnd(false);

    onApply({});
    onClear?.();
  };

  const inputCls =
    "w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-1">

      <h3 className="text-base font-semibold">
        Filtros ·  ventas
      </h3>
      <p className="text-sm text-gray-500">
        Busca una venta, selecciona y haz devolución de producto
      </p>

      {/* ---------- FILTROS PRINCIPALES ---------- */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

        {showId && (
          <input
            name="id"
            value={filtros.id ?? ""}
            onChange={handleChange}
            placeholder="Folio (ID)"
            className={inputCls}
          />
        )}

        <select
          name="clientId"
          value={filtros.clientId ?? ""}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="">Cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="paymentMethodId"
          value={filtros.paymentMethodId ?? ""}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="">Método de pago</option>
          {paymentMethods.map((m) => (
            <option key={m.id} value={String(m.id)}>
              {m.name}
            </option>
          ))}
        </select>

        {/* FECHAS */}
        <div className="flex flex-col sm:flex-row lg:col-span-4 gap-3">

          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <button className={`${inputCls} text-left`}>
                {startDate
                  ? format(startDate, "dd MMM yyyy", { locale: es })
                  : "Desde"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  setDate("startDate", d);
                  setOpenStart(false);
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <button className={`${inputCls} text-left`}>
                {endDate
                  ? format(endDate, "dd MMM yyyy", { locale: es })
                  : "Hasta"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  setDate("endDate", d);
                  setOpenEnd(false);
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
{showWeeklyConsolidation && (
  <div className="lg:col-span-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-900">
          Periodo semanal para ticket consolidado
        </p>
        <p className="text-xs text-blue-700">
          El ticket semanal debe tomar ventas de martes a lunes.
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {periodoSemanalLabel}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto bg-white"
          onClick={() => applySemanaMartesLunes(0)}
        >
          Semana actual
        </Button>

        <Button
          variant="outline"
          className="w-full sm:w-auto bg-white"
          onClick={() => applySemanaMartesLunes(1)}
        >
          Semana anterior
        </Button>
      </div>
    </div>
  </div>
)}
      </div>

      {/* ---------- BOTONES ---------- */}
      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <Button className="bg-blue-600 text-white w-full sm:w-auto" onClick={apply}>
          Buscar
        </Button>

        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            setFiltros({});
            setShowAdvanced(false);
            setOpenStart(false);
            setOpenEnd(false);  

            onApply({});
            onClear?.();
          }}
        >
          Limpiar
        </Button>

        {!showAdvanced && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => setShowAdvanced(true)}
          >
            Búsqueda avanzada
          </Button>
        )}
      </div>

      {/* ---------- AVANZADO ---------- */}
      {showAdvanced && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t pt-3">

          <input name="min" placeholder="Monto mínimo" value={filtros.min ?? ""} onChange={handleChange} className={inputCls} />
          <input name="max" placeholder="Monto máximo" value={filtros.max ?? ""} onChange={handleChange} className={inputCls} />

          <div className="grid grid-cols-3 gap-2">
            <input name="day" placeholder="Día" value={filtros.day ?? ""} onChange={handleChange} className={inputCls} />
            <input name="month" placeholder="Mes" value={filtros.month ?? ""} onChange={handleChange} className={inputCls} />
            <input name="year" placeholder="Año" value={filtros.year ?? ""} onChange={handleChange} className={inputCls} />
          </div>

          <select
            name="active"
            value={filtros.active ?? ""}
            onChange={handleChange}
            className={`${inputCls} lg:col-span-3`}
          >
            <option value="">Activo</option>
            <option value="true">Sólo activos</option>
            <option value="false">Sólo inactivos</option>
          </select>

          <div className="flex flex-col sm:flex-row gap-2 justify-end lg:col-span-3">
            <Button className="bg-blue-600 text-white w-full sm:w-auto" onClick={apply}>
              Aplicar
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={clear}>
              Limpiar
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setShowAdvanced(false)}
            >
              Ocultar avanzada
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
