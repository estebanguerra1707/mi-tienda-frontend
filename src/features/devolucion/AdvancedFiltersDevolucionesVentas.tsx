"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUsers } from "@/hooks/useUsers";

interface Props {
  onApply: (next: Record<string, string | undefined>) => void;
  onClear: () => void;
}

export default function AdvancedFiltersDevoluciones({
  onApply,
  onClear,
}: Props) {
  const { data: users = [] } = useUsers();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const DEFAULT = {
    id: "",
    codigoBarras: "",
    tipoDevolucion: "",
    startDate: "",
    endDate: "",
    ventaId: "",
    username: "",
    productName: "",
    minMonto: "",
    maxMonto: "",
    minCantidad: "",
    maxCantidad: "",
    day: "",
    month: "",
    year: "",
  };

  const [filtros, setFiltros] = useState(DEFAULT);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const inputCls =
    "w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const parseDate = (v?: string) => {
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const startDate = parseDate(filtros.startDate);
  const endDate = parseDate(filtros.endDate);

  const setDate = (key: "startDate" | "endDate", d?: Date) => {
    if (!d) return;
    const local = new Date(d);
    local.setHours(
      key === "startDate" ? 0 : 23,
      key === "startDate" ? 0 : 59,
      key === "startDate" ? 0 : 59,
      key === "startDate" ? 0 : 999
    );

    setFiltros((p) => ({
      ...p,
      [key]: local.toISOString(),
    }));
  };

  const change = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFiltros((p) => ({ ...p, [name]: value }));
  };

  const apply = () => {
    const clean: Record<string, string> = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) clean[k] = v;
    });
    onApply({ ...clean, page: "0", size: "20" });
  };

  const clear = () => {
    setFiltros(DEFAULT);
    onClear();
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          Devoluciones · Ventas
        </h3>
        <p className="text-sm text-gray-500">
          Encuentra devoluciones realizadas por cada venta
        </p>
      </div>

      {/* BÚSQUEDA RÁPIDA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <input
          name="id"
          placeholder="ID devolución"
          value={filtros.id}
          onChange={change}
          className={inputCls}
        />

        <input
          name="codigoBarras"
          placeholder="Código de barras"
          value={filtros.codigoBarras}
          onChange={change}
          className={inputCls}
        />

        <select
          name="tipoDevolucion"
          value={filtros.tipoDevolucion}
          onChange={change}
          className={inputCls}
        >
          <option value="">Tipo de devolución</option>
          <option value="TOTAL">TOTAL</option>
          <option value="PARCIAL">PARCIAL</option>
        </select>
      </div>

      {/* FECHAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* DESDE */}
        <Popover open={openStart} onOpenChange={setOpenStart}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={inputCls}>
              {startDate
                ? format(startDate, "dd MMM yyyy", { locale: es })
                : "Desde"}
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
              locale={es}
            />
          </PopoverContent>
        </Popover>

        {/* HASTA */}
        <Popover open={openEnd} onOpenChange={setOpenEnd}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={inputCls}>
              {endDate
                ? format(endDate, "dd MMM yyyy", { locale: es })
                : "Hasta"}
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
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* AVANZADOS */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAdvanced ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <input
              name="ventaId"
              placeholder="ID Venta"
              value={filtros.ventaId}
              onChange={change}
              className={inputCls}
            />

            <select
              name="username"
              value={filtros.username}
              onChange={change}
              className={inputCls}
            >
              <option value="">Usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.username ?? u.email}
                </option>
              ))}
            </select>

            <input
              name="productName"
              placeholder="Producto"
              value={filtros.productName}
              onChange={change}
              className={inputCls}
            />

            <input
              name="minMonto"
              placeholder="Monto mínimo"
              value={filtros.minMonto}
              onChange={change}
              className={inputCls}
            />

            <input
              name="maxMonto"
              placeholder="Monto máximo"
              value={filtros.maxMonto}
              onChange={change}
              className={inputCls}
            />

            <input
              name="minCantidad"
              placeholder="Cantidad mínima"
              value={filtros.minCantidad}
              onChange={change}
              className={inputCls}
            />

            <input
              name="maxCantidad"
              placeholder="Cantidad máxima"
              value={filtros.maxCantidad}
              onChange={change}
              className={inputCls}
            />
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button className="w-full sm:w-auto bg-blue-600 text-white" onClick={apply}>
          Buscar
        </Button>

        <Button variant="outline" className="w-full sm:w-auto" onClick={clear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
