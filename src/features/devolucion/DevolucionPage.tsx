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
    <div className="p-6 space-y-6">
      <div className="flex gap-4 border-b pb-2">
        <button
          onClick={() => cambiarTab("compras")}
          className={`px-4 py-2 font-medium ${
            tab === "compras"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Devolución de Compras
        </button>

        <button
          onClick={() => cambiarTab("Filtrar devoluciones compras")}
          className={`px-4 py-2 font-medium ${
            tab === "Filtrar devoluciones compras"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Filtro devolución compras
        </button>

        <button
          onClick={() => cambiarTab("ventas")}
          className={`px-4 py-2 font-medium ${
            tab === "ventas"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Devolución de Ventas
        </button>

        <button
          onClick={() => cambiarTab("Filtrar devoluciones ventas")}
          className={`px-4 py-2 font-medium ${
            tab === "Filtrar devoluciones ventas"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Filtro devolución ventas
        </button>
      </div>

      <div className="pt-4">
        {tab === "compras" && <NuevaDevolucionPage ref={refCompras} />}

        {tab === "ventas" && <NuevaDevolucionVentaPage ref={refVentas} />}

        {tab === "Filtrar devoluciones ventas" && (
          <BuscadorAvanzadoDevoluciones
            ref={devolucionesRef}
            onSelect={(dev) => console.log("Devolución seleccionada:", dev)}
            onClearFilters={() => devolucionesRef.current?.limpiar()}
          />
        )}

       {tab === "Filtrar devoluciones compras" && (
        <BusquedaDevolucionesComprasPage ref={refSearchCompras} />
      )}
      </div>
    </div>
  );
}
