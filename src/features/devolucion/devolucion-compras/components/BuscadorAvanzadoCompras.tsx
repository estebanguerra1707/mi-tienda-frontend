"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
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
  onClearAll?: () => void;
}

const BuscadorAvanzadoCompras = forwardRef<BuscadorAvanzadoComprasHandle, Props>(
  ({ onSelect, selectedId, onClearAll }, ref) => {
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
      username: "",
    });

    const [resultados, setResultados] = useState<CompraItem[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);

    const buscar = useBuscarComprasFiltrado();

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
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

      const sorted = [...(page.content ?? [])].sort((a, b) => {
        const ta = new Date(a.purchaseDate).getTime();
        const tb = new Date(b.purchaseDate).getTime();
        if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
        if (Number.isNaN(ta)) return 1;
        if (Number.isNaN(tb)) return -1;
        return tb - ta; // DESC
      });

      setResultados(sorted);
    };

    const { user, hasRole } = useAuth() as {
      user?: { branchId?: number };
      hasRole?: (r: string) => boolean;
    };

    const isSuper = hasRole?.("SUPER_ADMIN") ?? false;
    const isAdmin = hasRole?.("ADMIN") ?? false;
    const canFilterByUser = isSuper || isAdmin;

    const { data: providers = [] } = useProviders({
      isSuper,
      branchId: !isSuper ? user?.branchId : undefined,
    });

    const clearLocal = () => {
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
        username: "",
      });

      setResultados([]);
      setShowAdvanced(false);
      setOpenStart(false);
      setOpenEnd(false);
    };

    const clearAll = () => {
      clearLocal();
      onClearAll?.();
    };

    useImperativeHandle(ref, () => ({
      limpiar() {
        clearLocal();
      },
    }));

    const input =
      "w-full border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500";

    const handlePick = (c: CompraItem) => {
      onSelect(c);
    };

    return (
      <div className="space-y-4">
        {/* -------- FILTROS -------- */}
        <form onSubmit={submit} className="space-y-4">
          <h3 className="text-base font-semibold">Filtros · Compras</h3>
          <p className="text-sm text-gray-500">
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
                <button type="button" className={`${input} text-left`}>
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
                <button type="button" className={`${input} text-left`}>
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
            <Button type="submit" className="bg-blue-600 text-white w-full sm:w-auto">
              Buscar
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={clearAll}
            >
              Limpiar
            </Button>

            {!showAdvanced && (
              <Button type="button" variant="ghost" onClick={() => setShowAdvanced(true)}>
                Búsqueda avanzada
              </Button>
            )}
          </div>

          {showAdvanced && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t pt-3">
              <input
                name="min"
                placeholder="Monto mínimo"
                value={filtros.min}
                onChange={handleChange}
                className={input}
              />
              <input
                name="max"
                placeholder="Monto máximo"
                value={filtros.max}
                onChange={handleChange}
                className={input}
              />

              <div className="grid grid-cols-3 gap-2">
                <input name="day" placeholder="Día" value={filtros.day} onChange={handleChange} className={input} />
                <input name="month" placeholder="Mes" value={filtros.month} onChange={handleChange} className={input} />
                <input name="year" placeholder="Año" value={filtros.year} onChange={handleChange} className={input} />
              </div>

              {canFilterByUser && (
                <input
                  name="username"
                  placeholder="Usuario (vendor)"
                  value={filtros.username}
                  onChange={handleChange}
                  className={input}
                />
              )}

              <select
                name="active"
                value={filtros.active}
                onChange={handleChange}
                className={`${input} lg:col-span-3`}
              >
                <option value="">Activo</option>
                <option value="true">Sólo activos</option>
                <option value="false">Sólo inactivos</option>
              </select>

              <Button type="submit" className="bg-blue-600 text-white w-full sm:w-auto">
                Aplicar
              </Button>

              <Button type="button" variant="outline" onClick={clearAll} className="w-full sm:w-auto">
                Limpiar
              </Button>

              <Button type="button" variant="ghost" onClick={() => setShowAdvanced(false)}>
                Ocultar avanzada
              </Button>
            </div>
          )}
        </form>

        {/* ✅ RESULTADOS MOBILE (solo < lg) */}
        <div className="space-y-2 lg:hidden">
          {resultados.map((c) => {
            const selected = selectedId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => handlePick(c)}
                className={`
                  w-full rounded-lg p-3 text-left border transition-all
                  ${
                    selected
                      ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300 cursor-default"
                      : "border-gray-200 hover:bg-blue-50 active:scale-[0.98]"
                  }
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
                <p className="text-xs text-gray-600">Usuario: {c.userName}</p>
              </button>
            );
          })}
        </div>

        {/* ✅ RESULTADOS DESKTOP (solo >= lg) */}
        {resultados.length > 0 && (
          <div className="hidden lg:block space-y-2">
            {resultados.map((c) => {
              const selected = selectedId === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c)}
                  className={`
                    w-full flex justify-between items-center
                    px-4 py-4
                    rounded-xl border
                    text-left transition
                    ${
                      selected
                        ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200"
                        : "bg-white border-gray-200 hover:bg-blue-50 active:bg-blue-100"
                    }
                  `}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">Compra #{c.id}</p>

                    <p className="text-xs text-gray-600">
                      {new Date(c.purchaseDate).toLocaleString("es-MX")} Monto · $
                      {Number(c.amountPaid).toFixed(2)} MXN
                    </p>

                    <p className="text-xs text-gray-600">
                      Proveedor: {c.providerName} · Método de pago: {c.paymentName}
                    </p>

                    <p className="text-xs text-gray-600">Usuario: {c.userName}</p>
                  </div>

                  <span className="text-blue-600 text-xl leading-none">›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

export default BuscadorAvanzadoCompras;
