"use client";

import { useState } from "react";
import { useProveedores } from "@/hooks/useProveedores";
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

const { data: providers = [], isLoading } = useProveedores();

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (key === "start") dt.setHours(0, 0, 0, 0);
    else dt.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, "0");

    const formatted = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
      dt.getDate()
    )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;

    setFiltros((prev) => ({ ...prev, [key]: formatted }));
  };
  const proveedoresCatalogo = providers.map(p => ({
  id: p.id,
  name: p.name,
}));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const apply = () => {
    const clean = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v != null && v !== "")
    );
    onApply({ ...clean, page: "0" });
  };

  const clear = () => {
    setFiltros({});
    onApply({});
  };

  const inputCls =
    "w-full border rounded-lg px-3 py-2 shadow-sm bg-white focus:ring-blue-500";

  return (
    <div className="p-5 bg-white border rounded-xl shadow-md space-y-6">
      <h3 className="text-lg font-bold text-gray-800">Filtros de compras</h3>

      {/* ---------------- FILTROS PRINCIPALES ---------------- */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-end">

        {/* PROVEEDOR */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Proveedor</span>
          <select
            name="supplier"
            value={filtros.supplier ?? ""}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="">Todos</option>
            {isLoading && <option>Cargando...</option>}
            {!isLoading &&
              proveedoresCatalogo.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))
              }
          </select>
        </label>

        {/* FECHA DESDE */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Desde</span>
          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left px-3 py-2 rounded-lg">
                {startDate
                  ? format(startDate, "dd MMM yyyy", { locale: es })
                  : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  setDate("start", d || undefined);
                  setOpenStart(false);
                }}
                locale={es}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* FECHA HASTA */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Hasta</span>
          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left px-3 py-2 rounded-lg">
                {endDate
                  ? format(endDate, "dd MMM yyyy", { locale: es })
                  : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  setDate("end", d || undefined);
                  setOpenEnd(false);
                }}
                locale={es}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ---------------- BOTONES PRINCIPALES ---------------- */}
      <div className="flex justify-end gap-3">
        <Button onClick={apply} className="bg-blue-600 text-white hover:bg-blue-700">
          Buscar
        </Button>
        <Button variant="outline" onClick={clear}>
          Limpiar
        </Button>
      </div>

      {/* ---------------- BOTÓN MOSTRAR AVANZADOS ---------------- */}
      {!showAdvanced && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowAdvanced(true)}>
            Búsqueda avanzada
          </Button>
        </div>
      )}

      {/* ---------------- FILTROS AVANZADOS ---------------- */}
      {showAdvanced && (
        <div className="space-y-6 pt-4 border-t">

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-end">

            {/* Monto mínimo */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Monto mínimo</span>
              <input
                name="min"
                type="number"
                step="0.01"
                value={filtros.min ?? ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="0.00"
              />
            </label>

            {/* Monto máximo */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Monto máximo</span>
              <input
                name="max"
                type="number"
                step="0.01"
                value={filtros.max ?? ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="0.00"
              />
            </label>

            {/* Día / Mes / Año */}
            <div className="grid grid-cols-3 gap-3">
              <input
                name="day"
                type="number"
                placeholder="Día"
                value={filtros.day ?? ""}
                onChange={handleChange}
                className={inputCls}
              />
              <input
                name="month"
                type="number"
                placeholder="Mes"
                value={filtros.month ?? ""}
                onChange={handleChange}
                className={inputCls}
              />
              <input
                name="year"
                type="number"
                placeholder="Año"
                value={filtros.year ?? ""}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          {/* Activo + Botones */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

            <label className="flex flex-col gap-1 sm:w-1/3">
              <span className="text-sm font-medium">Activo</span>
              <select
                name="active"
                value={filtros.active ?? ""}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </label>

            <div className="flex gap-2 justify-end">
              <Button onClick={apply} className="bg-blue-600 text-white hover:bg-blue-700">
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
