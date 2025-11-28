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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Si el usuario selecciona "Todos", dejar el valor en undefined
    if (value === "" || value === "NaN") {
      setFiltros((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // Si es un ID numérico (clientId o paymentMethodId), convertir a string correcta
    if (name === "clientId" || name === "paymentMethodId") {
      setFiltros((prev) => ({ ...prev, [name]: String(value) }));
      return;
    }

    // Valor normal
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const apply = () => {
    const clean = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v != null && v !== "")
    );
    onApply({ ...clean, page: "1" });
  };

  const clear = () => {
    setFiltros({});
    onApply({});
  };

  const inputCls = "w-full border rounded px-3 py-2";

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">Filtros de ventas</h3>

{/* 🔹 Filtros principales en 4 columnas (misma fila) */}
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">

    {showId && (
      <label className="flex flex-col gap-1">
        <span className="text-sm">Folio (ID)</span>
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
      <span className="text-sm">Cliente</span>
      <select
        name="clientId"
        value={filtros.clientId ?? ""}
        onChange={handleChange}
        className={inputCls}
      >
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
      <span className="text-sm">Método de pago</span>
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

    <div className="flex gap-4 col-span-4">
      {/* Desde */}
      <div className="flex flex-col gap-1 w-full">
        <span className="text-sm">Desde</span>
        <Popover open={openStart} onOpenChange={setOpenStart}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={inputCls}>
              {startDate
                ? format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: es })
                : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
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
        <span className="text-sm">Hasta</span>
        <Popover open={openEnd} onOpenChange={setOpenEnd}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={inputCls}>
              {endDate
                ? format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: es })
                : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
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

  {/* 🔹 Botones BUSCAR y LIMPIAR en otra fila */}
  <div className="flex justify-end gap-2 col-span-4 mt-2">
    <Button
      onClick={apply}
      className="bg-blue-600 text-white hover:bg-blue-700"
    >
      Buscar
    </Button>

    <Button variant="outline" onClick={clear}>
      Limpiar
    </Button>

    {!showAdvanced && (
      <Button variant="outline" onClick={() => setShowAdvanced(true)}>
        Búsqueda avanzada
      </Button>
    )}
  </div>
      {/* 🔹 Filtros avanzados */}
      {showAdvanced && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end pt-4 border-t">
          {/* Monto mínimo */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Monto mínimo</span>
            <input
              name="min"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={filtros.min ?? ""}
              onChange={handleChange}
              className={inputCls}
              placeholder="0.00"
            />
          </label>

          {/* Monto máximo */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Monto máximo</span>
            <input
              name="max"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={filtros.max ?? ""}
              onChange={handleChange}
              className={inputCls}
              placeholder="0.00"
            />
          </label>

          {/* Día / Mes / Año */}
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Día</span>
              <input
                name="day"
                type="number"
                min={1}
                max={31}
                value={filtros.day ?? ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="dd"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Mes</span>
              <input
                name="month"
                type="number"
                min={1}
                max={12}
                value={filtros.month ?? ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="mm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Año</span>
              <input
                name="year"
                type="number"
                min={2000}
                max={2100}
                value={filtros.year ?? ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="yyyy"
              />
            </label>
          </div>

          {/* Activo + botones */}
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3 justify-between items-end">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-sm">Activo</span>
              <select
                name="active"
                value={filtros.active ?? ""}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="">Todos</option>
                <option value="true">Sólo activos</option>
                <option value="false">Sólo inactivos</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={apply} className="bg-blue-600 hover:bg-blue-700 text-white">
                Aplicar
              </Button>
              <Button variant="outline" onClick={clear}>
                Limpiar
              </Button>
              <Button variant="outline" onClick={() => setShowAdvanced(false)}>
                Ocultar avanzada
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
