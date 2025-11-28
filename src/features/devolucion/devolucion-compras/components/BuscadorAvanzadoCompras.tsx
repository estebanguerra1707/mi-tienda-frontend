"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useProviders } from "@/hooks/useCatalogs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CompraFiltro, CompraPage } from "../hooks/useBuscarComprasFiltrado";
import type { CompraItem } from "@/features/compras/api";
import { useBuscarComprasFiltrado } from "../hooks/useBuscarComprasFiltrado";

export interface BuscadorAvanzadoComprasHandle {
  limpiar: () => void;
}

interface Props {
  onSelect: (compra: CompraItem) => void;
}

const BuscadorAvanzadoCompras = forwardRef<BuscadorAvanzadoComprasHandle, Props>(
  ({ onSelect }, ref) => {
  const [filtros, setFiltros] = useState<CompraFiltro>({
    purchaseId: "",
    proveedorId: "",
    start: "",
    end: "",
    min: "",
    max: "",
    day: "",
    month: "",
    year: "",
    active: "",
  });

  const [resultados, setResultados] = useState<CompraItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const buscar = useBuscarComprasFiltrado();
  const { data: providers = [] } = useProviders({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setFecha = (key: "start" | "end", date?: Date) => {
    if (!date) {
      setFiltros((f) => ({ ...f, [key]: "" }));
      return;
    }

    const pad = (n: number) => String(n).padStart(2, "0");

    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;

    if (key === "end") {
      setFiltros((f) => ({ ...f, end: formatted + "T23:59:59.999" }));
    } else {
      setFiltros((f) => ({ ...f, start: formatted + "T00:00:00" }));
    }
  };

  const parseDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    if (isNaN(d.getTime())) return undefined;
    return d;
  };

  const startDate = parseDate(filtros.start);
  const endDate = parseDate(filtros.end);

  // ======================================================
  //  SUBMIT CORREGIDO Y ESTRICTO
  // ======================================================
 const submit = async (e: React.FormEvent) => {
  e.preventDefault();

  const cleanFilters: CompraFiltro = {};

  for (const [key, value] of Object.entries(filtros)) {
    if (value === "" || value === undefined) continue;

    // numéricos → enviar como string (backend así los espera)
    if (
      ["day", "month", "year", "min", "max", "purchaseId", "proveedorId"].includes(key)
    ) {
      cleanFilters[key as keyof CompraFiltro] = String(value);
      continue;
    }

    // boolean → enviar como string ("true"/"false")
    if (key === "active") {
      cleanFilters.active = value;
      continue;
    }

    // fechas
    if (key === "start" || key === "end") {
      cleanFilters[key] = value;
      continue;
    }

    // fallback
    cleanFilters[key as keyof CompraFiltro] = value as string;
  }

  const page: CompraPage = await buscar.mutateAsync(cleanFilters);
  setResultados(page.content);
};

  const clear = () => {
    setFiltros({
      purchaseId: "",
      proveedorId: "",
      start: "",
      end: "",
      min: "",
      max: "",
      day: "",
      month: "",
      year: "",
      active: "",
    });
    setResultados([]);
  };

  const input = "w-full border rounded px-3 py-2";
  useImperativeHandle(ref, () => ({
    limpiar() {
      setFiltros({
        purchaseId: "",
        proveedorId: "",
        start: "",
        end: "",
        min: "",
        max: "",
        day: "",
        month: "",
        year: "",
        active: "",
      });
      setResultados([]);
    }
  }));


  return (
    <>
      <form onSubmit={submit} className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Filtros de compras</h3>

        {/* FILTROS PRINCIPALES */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">

          {/* ID */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">ID Compra</span>
            <input
              type="number"
              name="purchaseId"
              value={filtros.purchaseId}
              onChange={handleChange}
              className={input}
              placeholder="Ej: 1023"
            />
          </label>

          {/* Proveedor */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Proveedor</span>
            <select
              name="proveedorId"
              value={filtros.proveedorId}
              onChange={handleChange}
              className={input}
            >
              <option value="">Todos</option>
              {providers.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          {/* Fecha inicio */}
          <div className="flex flex-col gap-1">
            <span className="text-sm">Desde</span>
            <Popover open={openStart} onOpenChange={setOpenStart}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={input}>
                  {startDate ? format(startDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setFecha("start", d || undefined);
                    setOpenStart(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha fin */}
          <div className="flex flex-col gap-1">
            <span className="text-sm">Hasta</span>
            <Popover open={openEnd} onOpenChange={setOpenEnd}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={input}>
                  {endDate ? format(endDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setFecha("end", d || undefined);
                    setOpenEnd(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* BOTONES */}
            <div className="flex justify-end gap-2 mt-3">
            <Button type="submit" className="bg-blue-600 text-white">
                Buscar
            </Button>

            <Button type="button" variant="outline" onClick={clear}>
                Limpiar
            </Button>

            {!showAdvanced && (
                <Button variant="outline" onClick={() => setShowAdvanced(true)}>
                Búsqueda avanzada
                </Button>
            )}

            </div>

        {/* FILTROS AVANZADOS */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <label className="flex flex-col gap-1">
                <span className="text-sm">Monto mínimo</span>
                <input type="number" name="min" value={filtros.min} onChange={handleChange} className={input} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">Monto máximo</span>
                <input type="number" name="max" value={filtros.max} onChange={handleChange} className={input} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">Día / Mes / Año</span>
                <div className="grid grid-cols-3 gap-2">
                  <input name="day" className={input} value={filtros.day} onChange={handleChange} placeholder="dd" />
                  <input name="month" className={input} value={filtros.month} onChange={handleChange} placeholder="mm" />
                  <input name="year" className={input} value={filtros.year} onChange={handleChange} placeholder="yyyy" />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">Activo</span>
                <select name="active" value={filtros.active} onChange={handleChange} className={input}>
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end mt-3">
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 text-white">
                  Buscar avanzada
                </Button>

                <Button type="button" variant="outline" onClick={clear}>
                  Limpiar avanzada
                </Button>

                <Button variant="outline" onClick={() => setShowAdvanced(false)}>
                  Ocultar avanzada
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* RESULTADOS */}
      {resultados.length > 0 && (
        <div className="border rounded mt-4 overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Proveedor</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Método</th>
                <th className="p-2">Monto</th>
                <th className="p-2"></th>
              </tr>
            </thead>

            <tbody>
              {resultados.map((c) => (
                <tr key={c.id} className="border-t hover:bg-blue-50 cursor-pointer">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{c.providerName}</td>
                  <td className="p-2">{new Date(c.purchaseDate).toLocaleDateString("es-MX")}</td>
                  <td className="p-2">{c.paymentName}</td>
                  <td className="p-2 text-right">${c.amountPaid.toFixed(2)}</td>
                  <td className="p-2">
                    <Button size="sm" onClick={() => onSelect(c)}>
                      Seleccionar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
});
export default BuscadorAvanzadoCompras;
