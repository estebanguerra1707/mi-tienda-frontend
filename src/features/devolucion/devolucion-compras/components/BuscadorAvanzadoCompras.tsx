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
import { useAuth } from "@/hooks/useAuth";

export interface BuscadorAvanzadoComprasHandle {
  limpiar: () => void;
}

interface Props {
  onSelect: (compra: CompraItem) => void;
  selectedId?: number;
}

const BuscadorAvanzadoCompras = forwardRef<
  BuscadorAvanzadoComprasHandle,
  Props
>(({ onSelect, selectedId }, ref) => {
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }));
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

    setFiltros((f) => ({
      ...f,
      [key]:
        key === "start"
          ? formatted + "T00:00:00"
          : formatted + "T23:59:59.999",
    }));
  };

  const parseDate = (s?: string) => {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clean: CompraFiltro = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) clean[k as keyof CompraFiltro] = v;
    });

    const page: CompraPage = await buscar.mutateAsync(clean);
    setResultados(page.content);
  };
const { user, hasRole } = useAuth() as {
  user?: { branchId?: number };
  hasRole?: (r: string) => boolean;
};
const isSuper = hasRole?.("SUPER_ADMIN") ?? false;

const { data: providers = [] } = useProviders({
  isSuper,
  branchId: !isSuper ? user?.branchId : undefined,
});
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

  useImperativeHandle(ref, () => ({
    limpiar() {
      clear();
    },
  }));

  const input =
    "w-full border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4">

      {/* -------- FILTROS -------- */}
      <form onSubmit={submit} className="space-y-4">

        <h3 className="text-base font-semibold">Filtros de compras</h3>
          <p className="text-sm sm:text-base font-medium text-gray-700">
            Busca una compra, selecciona y haz devolución de producto
          </p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="purchaseId"
            value={filtros.purchaseId}
            onChange={handleChange}
            placeholder="ID compra"
            className={input}
          />

          <select
            name="proveedorId"
            value={filtros.proveedorId}
            onChange={handleChange}
            className={input}
          >
            <option value="">Proveedor</option>
            {providers.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>

          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <button className={`${input} text-left`}>
                {parseDate(filtros.start)
                  ? format(parseDate(filtros.start)!, "dd MMM yyyy", { locale: es })
                  : "Desde"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={parseDate(filtros.start)}
                onSelect={(d) => {
                  setFecha("start", d);
                  setOpenStart(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <button className={`${input} text-left`}>
                {parseDate(filtros.end)
                  ? format(parseDate(filtros.end)!, "dd MMM yyyy", { locale: es })
                  : "Hasta"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={parseDate(filtros.end)}
                onSelect={(d) => {
                  setFecha("end", d);
                  setOpenEnd(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button className="bg-blue-600 text-white w-full sm:w-auto">
            Buscar
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={clear}>
            Limpiar
          </Button>
          {!showAdvanced && (
            <Button variant="ghost" onClick={() => setShowAdvanced(true)}>
              Búsqueda avanzada
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t pt-3">
            <input name="min" placeholder="Monto mínimo" value={filtros.min} onChange={handleChange} className={input} />
            <input name="max" placeholder="Monto máximo" value={filtros.max} onChange={handleChange} className={input} />

            <div className="grid grid-cols-3 gap-2">
              <input name="day" placeholder="Día" value={filtros.day} onChange={handleChange} className={input} />
              <input name="month" placeholder="Mes" value={filtros.month} onChange={handleChange} className={input} />
              <input name="year" placeholder="Año" value={filtros.year} onChange={handleChange} className={input} />
            </div>

            <select name="active" value={filtros.active} onChange={handleChange} className={`${input} lg:col-span-3`}>
              <option value="">Activo</option>
              <option value="true">Sólo activos</option>
              <option value="false">Sólo inactivos</option>
            </select>

            <div className="flex flex-col sm:flex-row gap-2 justify-end lg:col-span-3">
              <Button className="bg-blue-600 text-white w-full sm:w-auto">
                Aplicar
              </Button>
              <Button variant="outline" onClick={clear} className="w-full sm:w-auto">
                Limpiar
              </Button>
              <Button variant="ghost" onClick={() => setShowAdvanced(false)}>
                Ocultar avanzada
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* -------- RESULTADOS MOBILE -------- */}
     <div className="space-y-2 lg:hidden">
        {resultados.map((c) => {
          const selected = selectedId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
               className={`
                w-full rounded-lg p-3 text-left border transition-all
                ${selected
                  ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300 cursor-default"
                  : "border-gray-200 hover:bg-blue-50 active:scale-[0.98]"}
              `}
            >
              <p className="font-medium">Compra #{c.id}</p>

              <p className="text-xs text-gray-600">
                {c.providerName} ·{" "}
                {new Date(c.purchaseDate).toLocaleDateString("es-MX")}
              </p>

              <p className="text-xs text-gray-600">
                {c.paymentName} · ${c.amountPaid.toFixed(2)}
              </p>
            </button>
          );
        })}
      </div>

      {/* -------- RESULTADOS DESKTOP -------- */}
      {resultados.length > 0 && (
        <div className="hidden lg:block border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Proveedor</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Método</th>
                <th className="p-3 text-right">Monto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {resultados.map((c) => (
                <tr key={c.id} className="border-t hover:bg-blue-50">
                  <td className="p-3">{c.id}</td>
                  <td className="p-3">{c.providerName}</td>
                  <td className="p-3">{new Date(c.purchaseDate).toLocaleDateString("es-MX")}</td>
                  <td className="p-3">{c.paymentName}</td>
                  <td className="p-3 text-right">${c.amountPaid.toFixed(2)}</td>
                  <td className="p-3">
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
    </div>
  );
});

export default BuscadorAvanzadoCompras;
