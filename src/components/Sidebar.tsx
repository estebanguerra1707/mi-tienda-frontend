import { NavLink } from "react-router-dom";
import type { NavItem, NavLabel, NavSection } from "@/types/navigation";
import type { LucideIcon } from "lucide-react";

import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Receipt,
  RotateCcw,
  BarChart3,
  Tags,
  Users,
  Store,
  Warehouse,
  Truck,
} from "lucide-react";

type Props = {
  items: NavItem[];
};

const ICONS: Record<NavLabel, LucideIcon> = {
  Dashboard: LayoutGrid,
  Productos: Package,
  Compras: ShoppingCart,
  Ventas: Receipt,
  Devoluciones: RotateCcw,
  Reportes: BarChart3,
  Categorías: Tags,
  Usuarios: Users,
  Sucursales: Store,
  Inventario: Warehouse,
  Proveedores: Truck,
  Clientes: Users,
};

const SECTION_LABELS: Record<NavSection, string> = {
  OPERACION: "Operación",
  CATALOGOS: "Catálogos",
  ADMIN: "Administración",
};

export default function Sidebar({ items }: Props) {
  const visibleItems = items.filter((i) => i.show);
  const sections: NavSection[] = ["OPERACION", "CATALOGOS", "ADMIN"];

  return (
    <aside className="flex w-full h-full flex-col overflow-hidden">
      {/* NAV SCROLL */}
      <nav className="flex-1 min-h-0 p-3 space-y-6 overflow-y-auto no-scrollbar">
        {sections.map((section) => {
          const sectionItems = visibleItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section}>
              <div className="px-3 mb-2 text-[11px] font-semibold text-white/70 uppercase tracking-wide">
                {SECTION_LABELS[section]}
              </div>

              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const Icon = ICONS[item.label];

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `
                          group flex items-center gap-3
                          px-3 py-2 rounded-xl text-sm
                          transition
                          ${
                            isActive
                              ? "bg-[#D4AF37] text-black font-semibold shadow-sm"
                              : "text-white/90 hover:bg-white/10"
                          }
                        `
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* FOOTER (SIEMPRE ABAJO) */}
      <div className="mt-auto px-4 py-3 border-t border-white/10">
        <div className="text-sm font-semibold text-white/90">Mi Inventario</div>
        <div className="text-[11px] text-white/60">Copyright 2026-2030 ©</div>
      </div>
    </aside>
  );
}
