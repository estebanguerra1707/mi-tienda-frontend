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
}

export default function AdvancedFiltersVentas({ onApply, showId = false }: Props) {
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
      setFiltros((prev) => ({ ...prev, [key]: undefined }));
      return;
    }
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (key === "startDate") localDate.setHours(0, 0, 0, 0);
    else localDate.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(
      localDate.getDate()
    )}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;

    setFiltros((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (value === "" || value === "NaN") {
      setFiltros((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    if (name === "clientId" || name === "paymentMethodId") {
      setFiltros((prev) => ({ ...prev, [name]: String(value) }));
      return;
    }

    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const apply = () => {
    const clean = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v != null && v !== ""));
    onApply({ ...clean, page: "1" });
  };

  const clear = () => {
    setFiltros({});
    onApply({});
  };

  const inputCls =
    "w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition bg-white";

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white shadow-md border space-y-6 
                    max-w-full mx-auto 
                    [&>*]:text-gray-900">

      <h3 className="text-xl font-semibold tracking-tight text-gray-800">
        Filtros de ventas
      </h3>

      {/* Filtros principales */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

        {showId && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Folio (ID)</span>
            <input
              name="id"
              value={filtros.id ?? ""}
              onChange={handleChange}
              placeholder="Ej: 21"
              className={inputCls}
            />
          </label>
        )}

        {/* Cliente */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Cliente</span>
          <select name="clientId" value={filtros.clientId ?? ""} onChange={handleChange} className={inputCls}>
            <option value="">Todos</option>
            {clients.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Método de pago */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Método de pago</span>
          <select
            name="paymentMethodId"
            value={filtros.paymentMethodId ?? ""}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="">Todos</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        {/* Fechas */}
        <div className="flex flex-col sm:flex-row lg:col-span-4 gap-4">

          {/* Desde */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-sm font-medium">Desde</span>
            <Popover open={openStart} onOpenChange={setOpenStart}>
              <PopoverTrigger asChild>
                <button className={`${inputCls} text-left`}>
                  {startDate ? format(startDate, "dd 'de' MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 shadow-lg rounded-xl">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setDate("startDate", d);
                    setOpenStart(false);
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hasta */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-sm font-medium">Hasta</span>
            <Popover open={openEnd} onOpenChange={setOpenEnd}>
              <PopoverTrigger asChild>
                <button className={`${inputCls} text-left`}>
                  {endDate ? format(endDate, "dd 'de' MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 shadow-lg rounded-xl">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setDate("endDate", d);
                    setOpenEnd(false);
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Botones principales */}
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={apply} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm sm:text-base">
          Buscar
        </Button>

        <Button variant="outline" onClick={clear} className="px-5 py-2 rounded-lg text-sm sm:text-base">
          Limpiar
        </Button>

        {!showAdvanced && (
          <Button variant="outline" onClick={() => setShowAdvanced(true)} className="px-5 py-2 rounded-lg">
            Búsqueda avanzada
          </Button>
        )}
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t pt-6">

          {/* Min */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Monto mínimo</span>
            <input
              name="min"
              type="number"
              value={filtros.min ?? ""}
              onChange={handleChange}
              className={inputCls}
              placeholder="0.00"
            />
          </label>

          {/* Max */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Monto máximo</span>
            <input
              name="max"
              type="number"
              value={filtros.max ?? ""}
              onChange={handleChange}
              className={inputCls}
              placeholder="0.00"
            />
          </label>

          {/* Día / Mes / Año */}
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Día</span>
              <input name="day" type="number" value={filtros.day ?? ""} onChange={handleChange} className={inputCls} placeholder="dd" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Mes</span>
              <input name="month" type="number" value={filtros.month ?? ""} onChange={handleChange} className={inputCls} placeholder="mm" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Año</span>
              <input name="year" type="number" value={filtros.year ?? ""} onChange={handleChange} className={inputCls} placeholder="yyyy" />
            </label>
          </div>

          {/* Activo */}
          <div className="flex flex-col gap-1 lg:col-span-3">
            <span className="text-sm font-medium">Activo</span>
            <select name="active" value={filtros.active ?? ""} onChange={handleChange} className={inputCls}>
              <option value="">Todos</option>
              <option value="true">Sólo activos</option>
              <option value="false">Sólo inactivos</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex flex-wrap justify-end gap-3 lg:col-span-3 pt-2">
            <Button onClick={apply} className="bg-blue-600 text-white px-5 py-2 rounded-lg">
              Aplicar
            </Button>
            <Button variant="outline" onClick={clear} className="px-5 py-2 rounded-lg">
              Limpiar
            </Button>
            <Button variant="outline" onClick={() => setShowAdvanced(false)} className="px-5 py-2 rounded-lg">
              Ocultar avanzada
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
