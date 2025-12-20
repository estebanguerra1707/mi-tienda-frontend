import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import LogoutButton from "@/components/LogoutButton";
import { useHasAnyRole } from "@/features/auth/roles"
import { useIdleLogout } from "@/features/auth/useIdleLogout";

import { bc } from "@/lib/broadcast";
import { logout } from "@/features/auth/authService";

import { useNavigate } from "react-router-dom";
import ConfirmLogoutModal from "@/components/ConfirmLogoutModal";

type NavItem = { to: string; label: string; show: boolean };

export default function AppLayout() {
  useIdleLogout();

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const userName = user?.username || "Usuario";

  const canInventory = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);
  const canUsers = useHasAnyRole(["SUPER_ADMIN"]);
  const canBranches = useHasAnyRole(["SUPER_ADMIN"]);
  const canCategories = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);
  const canReports = useHasAnyRole(["ADMIN", "SUPER_ADMIN"]);
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
  const NAV_ITEMS: NavItem[] = [
    { to: "/", label: "Dashboard", show: true },
    { to: "/productos", label: "Productos", show: true },
    { to: "/compras", label: "Compras", show: true },
    { to: "/ventas", label: "Ventas", show: true },
    { to: "/devoluciones", label: "Devoluciones", show: true },
    { to: "/reportes", label: "Reportes", show: canReports },
    { to: "/categorias", label: "Categorías", show: canCategories },
    { to: "/usuarios", label: "Usuarios", show: canUsers },
    { to: "/sucursales", label: "Sucursales", show: canBranches },
    { to: "/inventario", label: "Inventario", show: canInventory },
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
            mx-auto 
            max-w-[1900px]
            px-3 sm:px-4 md:px-6 lg:px-10
            py-3
            flex items-center gap-4
          "
        >
          {/* LOGO + BURGER */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-black/10"
              onClick={() => setOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <div
              className="
                font-bold 
                text-lg sm:text-xl md:text-2xl
                whitespace-nowrap
              "
            >
              Mi Inventario
            </div>
          </div>

          {/* NAV (CENTRO, MULTILÍNEA, SIN SCROLL) */}
        <nav
          className="
            hidden md:flex
            items-center
            flex-nowrap
            overflow-x-auto
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
            gap-6
            text-sm lg:text-base xl:text-lg
            px-2
          "
        >
          {NAV_ITEMS.filter(i => i.show).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                  whitespace-nowrap
                  px-3 py-2
                  rounded-lg transition
                  ${isActive ? "bg-brand-gold text-black" : "hover:bg-white/20"}
                `
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

          {/* USER + LOGOUT (DERECHA) */}
          <div
            className="
              flex items-center gap-2 sm:gap-3 lg:gap-4
              shrink-0
            "
          >
            <img
              src="https://ui-avatars.com/api/?name=U&background=random"
              alt="avatar"
              className="
                w-7 h-7 
                md:w-8 md:h-8 
                lg:w-9 lg:h-9
                rounded-full border
              "
            />
            {/* Nombre responsivo, siempre visible en desktop y truncado si es largo */}
            <span
              className="
                hidden sm:inline
                font-medium
                text-xs sm:text-sm md:text-sm lg:text-base
                max-w-[180px] xl:max-w-[220px]
                truncate
              "
              title={userName}
            >
              {userName}
            </span>
            <LogoutButton
              onClick={() => {
                setOpen(false);
                setShowLogout(true);
              }}
            />     
            </div>
        </div>
      </header>

      {/* DRAWER (MÓVIL) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 w-[80%] max-w-[300px] h-full bg-white shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Menú</h2>
              <button className="p-2" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <ul className="space-y-1">
              {NAV_ITEMS.filter(i => i.show).map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded hover:bg-black/5"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <main
        className="
          mx-auto 
          max-w-[1900px]
          px-3 sm:px-4 md:px-6 lg:px-10
          pt-16 sm:pt-[72px]
          pb-6
        "
      >
        <Outlet />
              </main>
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
