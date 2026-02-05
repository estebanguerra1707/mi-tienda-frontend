import { Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";

type StoredUser = {
  rol?: string;
  role?: string;
};

function readRole(): string {
  const raw = localStorage.getItem("user");
  if (!raw) return "";
  try {
    const u = JSON.parse(raw) as StoredUser;
    return (u.rol ?? u.role) ?? "";
  } catch {
    return "";
  }
}

export default function RoleIndexRedirect() {
  const role = readRole();
  const isMobile = useIsMobile(768);

  // ✅ Vendor: principal siempre Ventas (desktop y mobile)
  if (role === "VENDOR") return <Navigate to="/ventas" replace />;

  // ✅ Admin/Super: mobile -> home, desktop -> dashboard
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return isMobile ? <Navigate to="/home" replace /> : <Navigate to="/dashboard" replace />;
  }

  // fallback
  return <Navigate to="/ventas" replace />;
}
