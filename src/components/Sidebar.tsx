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
  Truck
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
  const visibleItems = items.filter(i => i.show);

  const sections: NavSection[] = ["OPERACION", "CATALOGOS", "ADMIN"];

  return (
    <aside
      className="
        hidden md:flex
        w-64
        flex-col
        border-r
        bg-white
        h-[calc(100vh-72px)]
        sticky
        top-[72px]
      "
    >
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {sections.map(section => {
          const sectionItems = visibleItems.filter(
            item => item.section === section
          );

          if (sectionItems.length === 0) return null;

          return (
            <div key={section}>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {SECTION_LABELS[section]}
              </div>

              <div className="space-y-1">
                {sectionItems.map(item => {
                  const Icon = ICONS[item.label];

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `
                          flex items-center gap-3
                          px-3 py-2 rounded-lg text-sm
                          transition
                          ${
                            isActive
                              ? "bg-brand-gold text-black font-semibold"
                              : "text-slate-700 hover:bg-slate-100"
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
    </aside>
  );
}