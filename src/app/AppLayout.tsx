import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "@/components/LogoutButton";
import { useIdleLogout } from "@/features/auth/useIdleLogout";
import { bc } from "@/lib/broadcast";
import { logout } from "@/features/auth/authService";
import ConfirmLogoutModal from "@/components/ConfirmLogoutModal";
import type { NavItem } from "@/types/navigation";
import { Home, Menu, X } from "lucide-react"; // <-- Agregamos X para botón cerrar
import Sidebar from "@/components/Sidebar";
import HomeLauncher from "@/components/HomeLauncher";
import { useIsMobile } from "@/hooks/useIsMobile";

type StoredUser = {
  username?: string;
  rol?: string;
  role?: string;
};

function readStoredUser(): StoredUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export default function AppLayout() {
  useIdleLogout();

  const nav = useNavigate();
  const location = useLocation();

  const [showLogout, setShowLogout] = useState(false);
  
  // CAMBIO CLAVE: Inicializar en false para que empiece cerrado en escritorio
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);

  const user = readStoredUser();
  const userName = user?.username || "Usuario";
  const role = (user?.rol ?? user?.role) || "";

  const isVendor = role === "VENDOR";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isMobile = useIsMobile(1024); 
  const isAdminOrSuper = role === "ADMIN" || role === "SUPER_ADMIN";

  const isHome = location.pathname === "/home";
  const isDashboard = location.pathname === "/dashboard";

  useEffect(() => {
    const noForce = ["/login", "/register", "/forgot-password", "/reset-password", "/token-expired"];
    if (noForce.includes(location.pathname)) return;

    if (isVendor) {
      if (isDashboard) {
        nav("/ventas", { replace: true });
      }
      return;
    }

    if (!isAdminOrSuper) return;

    if (isMobile) {
      return;
    }

    if (isHome) {
      nav("/dashboard", { replace: true });
    }
  }, [location.pathname, isVendor, isAdminOrSuper, isMobile, isHome, isDashboard, nav]);
  
  const NAV_ITEMS: NavItem[] = useMemo(
    () => [
      { to: "/ventas", label: "Ventas", section: "OPERACION", show: true },
      { to: "/devoluciones", label: "Devoluciones", section: "OPERACION", show: true },
      { to: "/productos", label: "Productos", section: "CATALOGOS", show: true },
      { to: "/dashboard", label: "Dashboard", section: "ADMIN", show: isAdminOrSuper },

      { to: "/compras", label: "Compras", section: "OPERACION", show: !isVendor },
      { to: "/gastos", label: "Gastos", section: "OPERACION", show: !isVendor },
      { to: "/categorias", label: "Categorías", section: "CATALOGOS", show: !isVendor },
      { to: "/clientes", label: "Clientes", section: "CATALOGOS", show: !isVendor },
      { to: "/proveedores", label: "Proveedores", section: "CATALOGOS", show: !isVendor },
      { to: "/inventario", label: "Inventario", section: "ADMIN", show: !isVendor },
      { to: "/reportes", label: "Reportes", section: "ADMIN", show: !isVendor },

      { to: "/usuarios", label: "Usuarios", section: "ADMIN", show: isSuperAdmin },
      { to: "/sucursales", label: "Sucursales", section: "ADMIN", show: isSuperAdmin },
    ],
    [isVendor, isSuperAdmin, isAdminOrSuper]
  );

  const initials: string =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const hashStr = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  const [avatarSeed] = useState(() => {
    const s = crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 1e9);
    return String(s);
  });
  
  const THEMES = [
    { bg: ["#0B3D91", "#0D47A1", "#0A2F6B"], fg: ["#D4AF37", "#F3D27A", "#FFF3C4", "#E5E7EB", "#C9A227"] },
    { bg: ["#0B1F3A", "#0F172A", "#102A43"], fg: ["#FFD89B", "#F6D365", "#FFF3C4", "#D6DEE8", "#E7C873"] },
    { bg: ["#111827", "#0F172A", "#1F2937"], fg: ["#E5E7EB", "#CBD5E1", "#D6DEE8", "#FFF3C4", "#F3D27A"] },
    { bg: ["#064E3B", "#065F46", "#14532D"], fg: ["#FFF3C4", "#F6D365", "#E5E7EB", "#D6DEE8", "#FFD89B"] },
    { bg: ["#1E3A8A", "#312E81", "#1E293B"], fg: ["#C9A227", "#D4AF37", "#F3D27A", "#E5E7EB", "#FFF3C4"] },
  ] as const;
  
  const themeFor = (key: string) => {
    const k = `${key}-${avatarSeed}`;
    return THEMES[hashStr(k) % THEMES.length];
  };

  const bgForUser = (key: string): string => {
    const k = `${key}-${avatarSeed}`;
    const t = themeFor(key);
    return t.bg[hashStr(`${k}-bg`) % t.bg.length];
  };

  const colorForChar = (key: string, index: number): string => {
    const k = `${key}-${avatarSeed}`;
    const t = themeFor(key);
    return t.fg[hashStr(`${k}-ch-${index}`) % t.fg.length];
  };

  useEffect(() => {
    bc.onmessage = (event: MessageEvent) => {
      if (event.data === "logout") nav("/login", { replace: true });
    };
  }, [nav]);

  useEffect(() => {
    document.body.style.overflow = showLogout ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLogout]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-30 h-16 sm:h-[72px] bg-brand-blue shadow">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-10 py-3 flex items-center">
          <div className="flex items-center gap-2 shrink-0">
            
            {/* BOTÓN HOME: Visible hasta 1023px (lg:hidden) */}
            <button
              onClick={() => nav("/home")}
              className="p-2 rounded-lg hover:bg-black/10 lg:hidden"
              type="button"
            >
              <Home className="h-5 w-5 text-slate-800" />
            </button>

            {/* BOTÓN HAMBURGUESA: Visible desde 1024px (hidden lg:flex) */}
            <button
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              className="hidden lg:flex p-2 -ml-2 rounded-lg hover:bg-black/10 transition-colors"
              type="button"
              title={isDesktopSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {/* Cambia el ícono dinámicamente si está abierto o cerrado */}
              {isDesktopSidebarOpen ? (
                <X className="h-6 w-6 text-slate-800" />
              ) : (
                <Menu className="h-6 w-6 text-slate-800" />
              )}
            </button>

            <div className="flex items-center gap-3 select-none ml-1 sm:ml-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-14 md:w-14 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="/logo001.png"
                  alt="Mi Inventario"
                  className="h-full w-full object-cover scale-125 sm:scale-120 md:scale-100"
                  draggable={false}
                />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-slate-900 text-lg sm:text-xl md:text-2xl">
                    Mi Inventario
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-yellow-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    PRO
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] sm:text-xs text-slate-500 font-medium">
                  Haciendo, tu negocio mas fácil
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div
              className="w-9 h-9 rounded-full ring-2 ring-white/40 border border-white/30 shadow-sm
                        flex items-center justify-center select-none"
              style={{ backgroundColor: bgForUser(userName) }}
              aria-label="avatar"
              title={initials}
            >
              <span className="font-extrabold leading-none text-[15px] tracking-wide">
               {Array.from(initials).map((ch, i) => (
                  <span
                    key={`${ch}-${i}`}
                    style={{ color: colorForChar(userName, i), textShadow: "0 1px 0 rgba(0,0,0,.18)" }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </div>
            <span className="hidden sm:inline font-medium truncate max-w-[220px]">
              {userName}
            </span>
            <LogoutButton onClick={() => setShowLogout(true)} />
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="flex min-w-0 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
        
        {/* SIDEBAR COLAPSABLE: Visible desde 1024px (hidden lg:flex) */}
        <aside 
          className={`hidden lg:flex flex-col shrink-0 bg-[#0D47A1] transition-all duration-300 ease-in-out ${
            isDesktopSidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <div className="w-64 h-full overflow-hidden">
             <Sidebar items={NAV_ITEMS} />
          </div>
        </aside>

        {/* MAIN (scroll aquí) */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 pt-4 pb-6 px-3 sm:px-4 md:px-6 lg:px-10">
          
          {/* 📱 MOBILE VIEW: Oculto en pantallas grandes (lg:hidden) */}
          <div className="lg:hidden">
            {isHome ? <HomeLauncher items={NAV_ITEMS} /> : <Outlet />}
          </div>

          {/* 🖥️ DESKTOP VIEW: Visible desde 1024px (hidden lg:block) */}
          <div className="hidden lg:block">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmLogoutModal
        open={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => {
          setShowLogout(false);
          logout(true);
          nav("/login", { replace: true });
        }}
      />
    </div>
  );
}