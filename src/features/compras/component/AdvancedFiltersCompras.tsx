"use client";

import { useState } from "react";
import { useProviders } from "@/hooks/useCatalogs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  params: URLSearchParams;
  onApply: (next: Record<string, string | undefined>) => void;
}

export default function AdvancedFiltersCompras({ params, onApply }: Props) {
  // ---------- estado local ----------
  const [filtros, setFiltros] = useState<Record<string, string | undefined>>({
    supplier: params.get("supplier") ?? "",
    start: params.get("start") ?? "",
    end: params.get("end") ?? "",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    day: params.get("day") ?? "",
    month: params.get("month") ?? "",
    year: params.get("year") ?? "",
    active: params.get("active") ?? "",
  });

  const { data: providers = [], loading } = useProviders({});

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const parseLocalDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const startDate = parseLocalDate(filtros.start);
  const endDate = parseLocalDate(filtros.end);

  const setDate = (key: "start" | "end", d?: Date) => {
    if (!d) {
      setFiltros((prev) => ({ ...prev, [key]: undefined }));
      return;
    }

    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (key === "start") localDate.setHours(0, 0, 0, 0);
    else localDate.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(
      localDate.getDate()
    )}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;

    setFiltros((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const apply = () => {
    const clean = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v != null && v !== ""));
    onApply({ ...clean, page: "1" });
  };

  const clear = () => {
    setFiltros({});
    onApply({});
  };

  const inputCls = "w-full border rounded px-3 py-2";

  // 🔹 Panel de filtros avanzados internos
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">Filtros de compras</h3>

      {/* 🔹 Filtros principales (siempre visibles) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
        {/* Proveedor */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">Proveedor</span>
          <select
            name="supplier"
            value={filtros.supplier ?? ""}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="">Todos</option>
            {loading && <option>Cargando...</option>}
            {!loading &&
              providers.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>

        {/* Fecha desde */}
        <div className="flex flex-col gap-1">
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
                  setDate("start", d);
                  setOpenStart(false);
                }}
                initialFocus
                locale={es}
                fromYear={2020}
                toYear={2030}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fecha hasta */}
        <div className="flex flex-col gap-1">
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
                  setDate("end", d);
                  setOpenEnd(false);
                }}
                initialFocus
                locale={es}
                fromYear={2020}
                toYear={2030}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* 🔹 Botones BUSCAR y LIMPIAR en compras (igual que ventas) */}
      <div className="flex justify-end gap-2 mt-3">
        <Button 
          onClick={apply} 
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Buscar
        </Button>

        <Button variant="outline" onClick={clear}>
          Limpiar
        </Button>
      </div>

      {/* 🔹 Filtros avanzados (ocultos inicialmente) */}
      {!showAdvanced && (
        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={() => setShowAdvanced(true)}>
            Búsqueda avanzada
          </Button>
        </div>
      )}

      {/* 🔹 Filtros avanzados (ocultos inicialmente) */}
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

          {/* Activo */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between sm:col-span-2 lg:col-span-3 gap-4 mt-2">
          
            <label className="flex flex-col gap-1 w-full sm:w-1/3 lg:w-1/4">
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
            </label>

            {/* 🔹 Botones alineados en la misma fila */}
            <div className="flex gap-2 justify-end w-full sm:w-auto">
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
