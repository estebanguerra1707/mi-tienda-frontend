import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { NavItem, NavLabel, NavSection } from "@/types/navigation";

import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Receipt,
  RotateCcw,
  BarChart3,
  Users,
  Warehouse,
  Tags,
  Truck,
  Store,
} from "lucide-react";

const ICONS: Record<NavLabel, LucideIcon> = {
  Dashboard: LayoutGrid,
  Productos: Package,
  Compras: ShoppingCart,
  Ventas: Receipt,
  Devoluciones: RotateCcw,
  Reportes: BarChart3,
  Clientes: Users,
  Inventario: Warehouse,
  Categorías: Tags,
  Proveedores: Truck,
  Usuarios: Users,
  Sucursales: Store,
};

const SECTION_LABELS: Record<NavSection, string> = {
  OPERACION: "Operación",
  CATALOGOS: "Catálogos",
  ADMIN: "Administración",
};

// 🎨 Tema por sección (colores que combinan, sobrios)
const SECTION_THEME: Record<
  NavSection,
  { chip: string; icon: string; hover: string; ring: string }
> = {
  OPERACION: {
    chip: "bg-blue-100 text-blue-700",
    icon: "text-blue-600",
    hover: "hover:bg-blue-50",
    ring: "focus-visible:ring-blue-400",
  },
  CATALOGOS: {
    chip: "bg-amber-100 text-amber-800",
    icon: "text-amber-600",
    hover: "hover:bg-amber-50",
    ring: "focus-visible:ring-amber-400",
  },
  ADMIN: {
    chip: "bg-violet-100 text-violet-700",
    icon: "text-violet-600",
    hover: "hover:bg-violet-50",
    ring: "focus-visible:ring-violet-400",
  },
};

export default function HomeLauncher({ items }: { items: NavItem[] }) {
  const nav = useNavigate();

  const visibleItems = items.filter((i) => i.show);
  const sections: NavSection[] = ["OPERACION", "CATALOGOS", "ADMIN"];

  return (
    <div className="mx-auto w-full max-w-md p-4 overflow-x-hidden">
      <h1 className="mb-4 text-xl font-semibold">Menú</h1>

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionItems = visibleItems.filter((i) => i.section === section);
          if (sectionItems.length === 0) return null;

          const theme = SECTION_THEME[section];

          return (
            <section key={section}>
              <div className="mb-2 px-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {SECTION_LABELS[section]}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${theme.chip}`}
                >
                  {sectionItems.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {sectionItems.map((item) => {
                  const Icon = ICONS[item.label];

                  return (
                    <button
                      key={item.to}
                      onClick={() =>
                        nav(item.to, {
                          replace: true,
                          state: { fromLauncher: true },
                        })
                      }
                      className={`
                        group
                        h-28 rounded-2xl border p-4
                        flex flex-col justify-between items-start
                        bg-white
                        active:scale-[0.98]
                        transition
                        shadow-sm
                        ${theme.hover}
                        focus-visible:outline-none focus-visible:ring-2 ${theme.ring}
                      `}
                    >
                      {/* “chip” arriba para dar identidad de color */}
                      <span className={`h-1.5 w-10 rounded-full ${theme.chip}`} />

                      <div className="w-full flex items-start justify-between gap-2">
                        <Icon
                          className={`h-6 w-6 ${theme.icon} group-hover:opacity-90 transition`}
                        />
                      </div>

                      <span className="text-base font-medium text-slate-900">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}