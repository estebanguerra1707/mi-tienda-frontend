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

  const cls = "w-full border rounded px-3 py-2";

  return (
    <div className="p-4 bg-white border rounded shadow-sm space-y-6">
      <h3 className="font-semibold text-lg">Filtro Devoluciones VENTAS</h3>

      {/* -------------------------------------- */}
      {/* 🔹 BÚSQUEDA SIMPLE */}
      {/* -------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <label className="flex flex-col gap-1">
          <span>ID devolución</span>
          <input name="id" value={filtros.id ?? ""} onChange={change} className={cls} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Código de barras</span>
          <input name="codigoBarras" value={filtros.codigoBarras ?? ""} onChange={change} className={cls} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Tipo de devolución</span>
          <select name="tipoDevolucion" value={filtros.tipoDevolucion ?? ""} onChange={change} className={cls}>
            <option value="">Todas</option>
            <option value="TOTAL">TOTAL</option>
            <option value="PARCIAL">PARCIAL</option>
          </select>
        </label>

        {/* Fechas */}
        <div className="flex flex-col gap-1">
          <span>Desde</span>
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
          <span>Hasta</span>
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

      {/* -------------------------------------- */}
      {/* 🔹 BÚSQUEDA AVANZADA */}
      {/* -------------------------------------- */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">

          <label className="flex flex-col gap-1">
            <span>ID Venta</span>
            <input name="ventaId" value={filtros.ventaId ?? ""} onChange={change} className={cls} />
          </label>

         <label className="flex flex-col gap-1">
            <span>Usuario</span>
            <select
                name="username"
                value={filtros.username ?? ""}
                onChange={change}
                className={cls}
            >
                <option value="">Todos</option>

                {users.map((u) => (
                <option key={u.id} value={u.email}> 
                    {u.username ?? u.email}
                </option>
                ))}
            </select>
            </label>

          <label className="flex flex-col gap-1">
            <span>Nombre del producto</span>
            <input name="productName" value={filtros.productName ?? ""} onChange={change} className={cls} />
          </label>

          {/* Monto */}
          <input name="minMonto" placeholder="Monto mínimo" className={cls} value={filtros.minMonto ?? ""} onChange={change} />
          <input name="maxMonto" placeholder="Monto máximo" className={cls} value={filtros.maxMonto ?? ""} onChange={change} />

          {/* Cantidad */}
          <input name="minCantidad" placeholder="Cantidad mínima" className={cls} value={filtros.minCantidad ?? ""} onChange={change} />
          <input name="maxCantidad" placeholder="Cantidad máxima" className={cls} value={filtros.maxCantidad ?? ""} onChange={change} />

          {/* Fecha por día, mes, año */}
          <div className="grid grid-cols-3 gap-2">
            <input name="day" placeholder="Día" className={cls} value={filtros.day ?? ""} onChange={change} />
            <input name="month" placeholder="Mes" className={cls} value={filtros.month ?? ""} onChange={change} />
            <input name="year" placeholder="Año" className={cls} value={filtros.year ?? ""} onChange={change} />
          </div>
        </div>
      )}

      {/* BOTONES */}
      <div className="flex justify-end gap-2 pt-2">


        {/* Buscar */}
        <Button
          onClick={apply}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Buscar
        </Button>

        {/* Limpiar */}
       <Button
        variant="outline"
        onClick={() => {
          clear();      // limpia inputs
          onClear();    // limpia filtros + resultados en el padre
        }}
      >
        Limpiar
      </Button>
        {/* Búsqueda avanzada */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Ocultar búsqueda avanzada" : "Búsqueda avanzada"}
        </Button>

      </div>
    </div>
  );
}
