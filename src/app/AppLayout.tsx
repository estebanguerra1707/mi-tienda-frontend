import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import LogoutButton from "@/components/LogoutButton";
import { useHasAnyRole } from "@/features/auth/roles"
import { useIdleLogout } from "@/features/auth/useIdleLogout";

import { bc } from "@/lib/broadcast";
import { logout } from "@/features/auth/authService";

import { useNavigate } from "react-router-dom";
import ConfirmLogoutModal from "@/components/ConfirmLogoutModal";

import HomeLauncher from "@/components/HomeLauncher";
import type { NavItem } from "@/types/navigation";
import { useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import Sidebar from "@/components/Sidebar";


export default function AppLayout() {
  
  useIdleLogout();
const location = useLocation();
const fromLauncher = (location.state as { fromLauncher?: boolean } | null)?.fromLauncher === true;
const isHome = location.pathname === "/";

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const userName = user?.username || "Usuario";

  const canInventory = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);
  const canUsers = useHasAnyRole(["SUPER_ADMIN"]);
  const canBranches = useHasAnyRole(["SUPER_ADMIN"]);
  const canCategories = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);
  const canReports = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);
  const canSuppliers = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);

const [showLogout, setShowLogout] = useState(false);
const nav = useNavigate();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  
 useEffect(() => {
   bc.onmessage = (event) => {
      if (event.data === "logout") {
        nav("/login", { replace: true });
      }
    };
 }, [nav]);

useEffect(() => {
  if (location.pathname === "/") {
    nav("/dashboard", { replace: true });
  }
}, [location.pathname, nav]);

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", section: "OPERACION", show: true },
  { to: "/ventas", label: "Ventas", section: "OPERACION", show: true },
  { to: "/compras", label: "Compras", section: "OPERACION", show: true },
  { to: "/devoluciones", label: "Devoluciones", section: "OPERACION", show: true },

  { to: "/productos", label: "Productos", section: "CATALOGOS", show: true },
  { to: "/categorias", label: "Categorías", section: "CATALOGOS", show: canCategories },
  { to: "/clientes", label: "Clientes", section: "CATALOGOS", show: canSuppliers },
  { to: "/proveedores", label: "Proveedores", section: "CATALOGOS", show: canSuppliers },

  { to: "/inventario", label: "Inventario", section: "ADMIN", show: canInventory },
  { to: "/sucursales", label: "Sucursales", section: "ADMIN", show: canBranches },
  { to: "/usuarios", label: "Usuarios", section: "ADMIN", show: canUsers },
  { to: "/reportes", label: "Reportes", section: "ADMIN", show: canReports },
];
useEffect(() => {
  document.body.style.overflow = showLogout ? "hidden" : "";
  return () => {
    document.body.style.overflow = "";
  };
}, [showLogout]);
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* HEADER */}
       <header
          className="
            sticky top-0 z-30
            h-16 sm:h-[72px]
            bg-brand-blue shadow
          "
        >
          <div
            className="
              w-full
              px-3 sm:px-4 md:px-6 lg:px-10
              py-3
              flex items-center
            "
          >
            {/* IZQUIERDA — LOGO */}
            <div className="flex items-center gap-2 shrink-0">
              {!isHome && (
                <button
                  onClick={() => nav("/")}
                  className="p-2 rounded-lg hover:bg-black/10 active:scale-[0.95] md:hidden"
                  aria-label="Ir al inicio"
                >
                  <Home className="h-5 w-5" />
                </button>
              )}

              <div className="font-bold text-lg sm:text-xl md:text-2xl whitespace-nowrap">
                Mi Inventario
              </div>
            </div>

            {/* DERECHA — USER + LOGOUT */}
            <div
              className="
                ml-auto
                flex items-center gap-2 sm:gap-3 lg:gap-4
                shrink-0
              "
            >
              <img
                src="https://ui-avatars.com/api/?name=U&background=random"
                alt="avatar"
                className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full border"
              />

              <span
                className="
                  hidden sm:inline
                  font-medium
                  text-xs sm:text-sm md:text-sm lg:text-base
                  max-w-[220px]
                  truncate
                "
                title={userName}
              >
                {userName}
              </span>

              <LogoutButton onClick={() => setShowLogout(true)} />
            </div>
          </div>
        </header>

      <div className="flex min-w-0 overflow-x-hidden">
        {/* SIDEBAR — SOLO DESKTOP */}
        <aside className="hidden md:block w-64 shrink-0">
          <Sidebar items={NAV_ITEMS} />
        </aside>
        {/* MAIN */}
          <main
            className="
              flex-1
              min-w-0
              max-w-full
              overflow-x-hidden
              bg-slate-50
              px-3 sm:px-4 md:px-6 lg:px-10
              pt-4
              pb-6
              min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-72px)]
            "
>
          {/* Home launcher solo en / y mobile */}
      <div className="block md:hidden max-w-full overflow-x-hidden">
          {location.pathname === "/dashboard" && !fromLauncher && (
            <HomeLauncher items={NAV_ITEMS} />
          )}
        </div>

          {/* CONTENIDO → SIEMPRE */}
          <Outlet />
        </main>
      </div>
       
      <ConfirmLogoutModal
        open={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => {
          setShowLogout(false);

          // 🔴 iOS Safari fix (quita foco activo)
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }

          setTimeout(() => {
            logout(true);
            nav("/login", { replace: true });
          }, 50);
        }}
      />
    </div>
    
  );
}
