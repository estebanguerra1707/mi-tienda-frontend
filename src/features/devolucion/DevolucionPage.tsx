"use client";

import { useState, useRef, useMemo } from "react";

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

type StoredUser = {
  rol?: string;
  role?: string;
};

function getRole(): string {
  const raw = localStorage.getItem("user");
  if (!raw) return "";
  try {
    const user = JSON.parse(raw) as StoredUser;
    return user.rol ?? user.role ?? "";
  } catch {
    return "";
  }
}

export default function DevolucionesPage() {
  const role = getRole();
  const isVendor = role === "VENDOR";

  // 👉 tab inicial seguro según rol
  const [tab, setTab] = useState<TabName>(
    isVendor ? "ventas" : "compras"
  );

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

  // ✅ Tabs visibles según rol
  const TABS = useMemo(
    () => [
      !isVendor && { key: "compras", label: "Filtro Compras" },
      !isVendor && {
        key: "Filtrar devoluciones compras",
        label: "Devolución Compras",
      },
      { key: "ventas", label: "Filtro Ventas" },
      {
        key: "Filtrar devoluciones ventas",
        label: "Devolución Ventas",
      },
    ].filter(Boolean) as { key: TabName; label: string }[],
    [isVendor]
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">

      {/* ------------------- TABS ------------------- */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => cambiarTab(t.key)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition
              ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 active:bg-gray-200"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ------------------- CONTENIDO ------------------- */}
      <div className="bg-white rounded-xl border p-3 sm:p-5">

        {!isVendor && tab === "compras" && (
          <NuevaDevolucionPage ref={refCompras} />
        )}

        {tab === "ventas" && (
          <NuevaDevolucionVentaPage ref={refVentas} />
        )}

        {tab === "Filtrar devoluciones ventas" && (
          <BuscadorAvanzadoDevoluciones
            ref={devolucionesRef}
            onSelect={(dev) =>
              console.log("Devolución seleccionada:", dev)
            }
            onClearFilters={() => devolucionesRef.current?.limpiar()}
          />
        )}

        {!isVendor && tab === "Filtrar devoluciones compras" && (
          <BusquedaDevolucionesComprasPage ref={refSearchCompras} />
        )}

      </div>
    </div>
  );
}
