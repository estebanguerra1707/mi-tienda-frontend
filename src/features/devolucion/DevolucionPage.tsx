"use client";

import { useState, useRef } from "react";

import NuevaDevolucionPage from "@/features/devolucion/devolucion-compras/pages/NuevaDevolucion";
import NuevaDevolucionVentaPage from "@/features/devolucion/devolucion-ventas/pages/NuevaDevolucionVentaPage";

import BuscadorAvanzadoDevoluciones, {
  BuscadorAvanzadoDevolucionesHandle,
} from "./BuscadorAvanzadoDevolucionesVentas";

import type { BuscadorDevolucionesComprasHandle } from "@/features/devolucion/devolucion-compras/components/BuscadorDevolucionesCompras";
import BusquedaDevolucionesComprasPage from "@/features/devolucion/devolucion-compras/pages/BusquedaDevolucionesComprasPage";

type TabName =
  | "compras"
  | "Filtrar devoluciones compras"
  | "ventas"
  | "Filtrar devoluciones ventas";

export default function DevolucionesPage() {
  const [tab, setTab] = useState<TabName>("compras");

  const refCompras = useRef<{ limpiar: () => void }>(null);
  const refVentas = useRef<{ limpiar: () => void }>(null);
  const devolucionesRef = useRef<BuscadorAvanzadoDevolucionesHandle>(null);
  const refSearchCompras = useRef<BuscadorDevolucionesComprasHandle>(null);

  const cambiarTab = (nuevo: TabName) => {
    setTab(nuevo);

    refCompras.current?.limpiar?.();
    refVentas.current?.limpiar?.();
    devolucionesRef.current?.limpiar?.();
    refSearchCompras.current?.limpiar?.();
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ---------------- TABS MODERNIZADOS ---------------- */}
      <div className="bg-white rounded-xl shadow-md border p-3">
        <div className="flex gap-4">

          {[
            { key: "compras", label: "Devolución Compras" },
            { key: "Filtrar devoluciones compras", label: "Filtro Compras" },
            { key: "ventas", label: "Devolución Ventas" },
            { key: "Filtrar devoluciones ventas", label: "Filtro Ventas" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => cambiarTab(t.key as TabName)}
              className={`
                px-4 py-2 font-medium rounded-lg transition
                ${
                  tab === t.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {t.label}
            </button>
          ))}

        </div>
      </div>

      {/* ---------------- CONTENIDO ---------------- */}
      <div className="bg-white rounded-xl shadow-md border p-6 transition">

        {tab === "compras" && (
          <div className="shadow-sm hover:shadow-lg transition rounded-xl p-2">
            <NuevaDevolucionPage ref={refCompras} />
          </div>
        )}

        {tab === "ventas" && (
          <div className="shadow-sm hover:shadow-lg transition rounded-xl p-2">
            <NuevaDevolucionVentaPage ref={refVentas} />
          </div>
        )}

        {tab === "Filtrar devoluciones ventas" && (
          <div className="shadow-sm hover:shadow-lg transition rounded-xl p-2">
            <BuscadorAvanzadoDevoluciones
              ref={devolucionesRef}
              onSelect={(dev) =>
                console.log("Devolución seleccionada:", dev)
              }
              onClearFilters={() => devolucionesRef.current?.limpiar()}
            />
          </div>
        )}

        {tab === "Filtrar devoluciones compras" && (
          <div className="shadow-sm hover:shadow-lg transition rounded-xl p-2">
            <BusquedaDevolucionesComprasPage ref={refSearchCompras} />
          </div>
        )}

      </div>
    </div>
  );
}
