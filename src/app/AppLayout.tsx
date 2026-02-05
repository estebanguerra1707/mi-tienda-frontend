import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "@/components/LogoutButton";
import { useIdleLogout } from "@/features/auth/useIdleLogout";
import { bc } from "@/lib/broadcast";
import { logout } from "@/features/auth/authService";
import ConfirmLogoutModal from "@/components/ConfirmLogoutModal";
import type { NavItem } from "@/types/navigation";
import { Home } from "lucide-react";
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

  const user = readStoredUser();
  const userName = user?.username || "Usuario";
  const role = (user?.rol ?? user?.role) || "";

  const isVendor = role === "VENDOR";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isMobile = useIsMobile(768);
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
    // Royal Blue + Gold
    {
      bg: ["#0B3D91", "#0D47A1", "#0A2F6B"],
      fg: ["#D4AF37", "#F3D27A", "#FFF3C4", "#E5E7EB", "#C9A227"],
    },
    // Navy + Champagne
    {
      bg: ["#0B1F3A", "#0F172A", "#102A43"],
      fg: ["#FFD89B", "#F6D365", "#FFF3C4", "#D6DEE8", "#E7C873"],
    },
    // Charcoal + Platinum
    {
      bg: ["#111827", "#0F172A", "#1F2937"],
      fg: ["#E5E7EB", "#CBD5E1", "#D6DEE8", "#FFF3C4", "#F3D27A"],
    },
    // Emerald + Ivory
    {
      bg: ["#064E3B", "#065F46", "#14532D"],
      fg: ["#FFF3C4", "#F6D365", "#E5E7EB", "#D6DEE8", "#FFD89B"],
    },
    // Indigo + Warm Gold
    {
      bg: ["#1E3A8A", "#312E81", "#1E293B"],
      fg: ["#C9A227", "#D4AF37", "#F3D27A", "#E5E7EB", "#FFF3C4"],
    },
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
           <button
            onClick={() => nav("/home")}
            className="p-2 rounded-lg hover:bg-black/10 md:hidden"
            type="button"
          >
            <Home className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 select-none">
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
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 shrink-0 bg-[#0D47A1]">
          <Sidebar items={NAV_ITEMS} />
        </aside>

        {/* MAIN (scroll aquí) */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 pt-4 pb-6 px-3 sm:px-4 md:px-6 lg:px-10">
          {/* 📱 MOBILE */}
          <div className="md:hidden">
            {isHome ? <HomeLauncher items={NAV_ITEMS} /> : <Outlet />}
          </div>

          {/* 🖥️ DESKTOP */}
          <div className="hidden md:block">
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
