import { useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthCtx, type User, type Role } from "./AuthContext";
import { loginApi, logoutApi } from "@/services/auth.service";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("jwt"));

  // Derivar un objeto user a partir del storage (cambia cuando cambia el token)
  const user: User = useMemo(() => {
    const role = (localStorage.getItem("rol") as Role | null) ?? null;
  const branchIdStr = localStorage.getItem("branchId");
  const businessTypeStr = localStorage.getItem("businessType");
  const idStr = localStorage.getItem("userId"); 

  return {
    id: idStr ? Number(idStr) : null,
    email: localStorage.getItem("email"),
    username: localStorage.getItem("username"),
    role,
    branchId: branchIdStr ? Number(branchIdStr) : null,
    businessType: businessTypeStr ? Number(businessTypeStr) : null,
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);


  const value = useMemo<AuthCtx>(() => ({
    token,
    user,
    isAuthenticated: !!token,

    async login(email: string, password: string) {
      const { token: tk, rol, branchId, businessType, username, id } =
        await loginApi({ email, password });

      localStorage.setItem("jwt", tk);
      if (rol) localStorage.setItem("rol", rol);
      if (branchId != null) localStorage.setItem("branchId", String(branchId));
      if (businessType != null) localStorage.setItem("businessType", String(businessType));
      if (username) localStorage.setItem("username", username);
      if (email) localStorage.setItem("email", email);
      if (id != null) localStorage.setItem("userId", String(id)); // <-- nuevo

      setToken(tk);
    },

    logout() {
      logoutApi()
        .catch(() => {
          console.warn("No se pudo notificar logout al backend");
        })
        .finally(() => {
          localStorage.removeItem("jwt");
          localStorage.removeItem("rol");
          localStorage.removeItem("branchId");
          localStorage.removeItem("businessType");
          localStorage.removeItem("username");
          localStorage.removeItem("email");
          setToken(null);
          window.location.href = "/login";
        });
    },
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
