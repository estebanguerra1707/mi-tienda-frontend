import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { NavItem, NavLabel } from "@/types/navigation";

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
  Truck
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
  Sucursales: Warehouse,
};


export default function HomeLauncher({ items }: { items: NavItem[] }) {
  const nav = useNavigate();

  return (
    <div className="mx-auto w-full max-w-md p-4 overflow-x-hidden">
      <h1 className="mb-4 text-xl font-semibold">Menú</h1>

      <div className="grid grid-cols-2 gap-3">
        {items.filter(i => i.show).map(item => {
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
              className="
                h-28 rounded-2xl border p-4
                flex flex-col justify-between items-start
                bg-white
                active:scale-[0.98]
                shadow-sm
              "
            >
              <Icon className="h-6 w-6 text-brand-blue" />
              <span className="text-base font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}