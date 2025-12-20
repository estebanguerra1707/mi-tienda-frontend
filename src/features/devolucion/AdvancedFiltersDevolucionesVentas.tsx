"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUsers } from "@/hooks/useUsers"; 

interface Props {
  onApply: (next: Record<string, string | undefined>) => void;
  onClear: () => void;
}

export default function AdvancedFiltersDevoluciones({ onApply, onClear }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: users = [] } = useUsers();

  const FILTROS_DEFAULT = {
    id: "",
    codigoBarras: "",
    tipoDevolucion: "",
    startDate: "",
    endDate: "",
    username: "",
    ventaId: "",
    productName: "",
    day: "",
    month: "",
    year: "",
    minMonto: "",
    maxMonto: "",
    minCantidad: "",
    maxCantidad: "",
  };

  const [filtros, setFiltros] = useState(FILTROS_DEFAULT);

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

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

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const apply = () => {
    const clean: Record<string, string> = {};
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        clean[key] = value;
      }
    });
    onApply({ ...clean, page: "0", size: "20" });
  };

  const clear = () => {
    setFiltros(FILTROS_DEFAULT);
  };

  const cls =
    "w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4">

      <h3 className="text-base font-semibold">
        Filtro devoluciones · Ventas
      </h3>
       <p className="text-sm sm:text-base font-medium text-gray-700">
        Busca devolución hecha de una venta
      </p>

      {/* ---------------- SIMPLE ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

        <label className="flex flex-col gap-1">
          <span className="text-sm">ID devolución</span>
          <input name="id" value={filtros.id} onChange={change} className={cls} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Código de barras</span>
          <input name="codigoBarras" value={filtros.codigoBarras} onChange={change} className={cls} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Tipo devolución</span>
          <select name="tipoDevolucion" value={filtros.tipoDevolucion} onChange={change} className={cls}>
            <option value="">Todas</option>
            <option value="TOTAL">TOTAL</option>
            <option value="PARCIAL">PARCIAL</option>
          </select>
        </label>

        {/* FECHAS */}
        <div className="flex flex-col gap-1">
          <span className="text-sm">Desde</span>
          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cls}>
                {startDate ? format(startDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  setDate("startDate", d || undefined);
                  setOpenStart(false);
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm">Hasta</span>
          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cls}>
                {endDate ? format(endDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  setDate("endDate", d || undefined);
                  setOpenEnd(false);
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ---------------- AVANZADO ---------------- */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t">

          <label className="flex flex-col gap-1">
            <span className="text-sm">ID Venta</span>
            <input name="ventaId" value={filtros.ventaId} onChange={change} className={cls} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Usuario</span>
            <select name="username" value={filtros.username} onChange={change} className={cls}>
              <option value="">Todos</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.username ?? u.email}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Producto</span>
            <input name="productName" value={filtros.productName} onChange={change} className={cls} />
          </label>

          <input name="minMonto" placeholder="Monto mínimo" value={filtros.minMonto} onChange={change} className={cls} />
          <input name="maxMonto" placeholder="Monto máximo" value={filtros.maxMonto} onChange={change} className={cls} />

          <input name="minCantidad" placeholder="Cantidad mínima" value={filtros.minCantidad} onChange={change} className={cls} />
          <input name="maxCantidad" placeholder="Cantidad máxima" value={filtros.maxCantidad} onChange={change} className={cls} />

          <div className="grid grid-cols-3 gap-2">
            <input name="day" placeholder="Día" value={filtros.day} onChange={change} className={cls} />
            <input name="month" placeholder="Mes" value={filtros.month} onChange={change} className={cls} />
            <input name="year" placeholder="Año" value={filtros.year} onChange={change} className={cls} />
          </div>
        </div>
      )}

      {/* ---------------- BOTONES ---------------- */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button className="bg-blue-600 text-white w-full sm:w-auto" onClick={apply}>
          Buscar
        </Button>

        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            clear();
            onClear();
          }}
        >
          Limpiar
        </Button>

        <Button
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Ocultar avanzada" : "Búsqueda avanzada"}
        </Button>
      </div>
    </div>
  );
}
