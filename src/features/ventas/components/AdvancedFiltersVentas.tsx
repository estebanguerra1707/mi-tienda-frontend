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
}

export default function AdvancedFiltersVentas({
  onApply,
  showId = false,
  onClear,
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
