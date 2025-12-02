// src/context/AuthProvider.tsx
import { useMemo, useState, type ReactNode } from "react";
import {
  AuthContext,
  type AuthCtx,
  type User,
  type Role,
} from "./AuthContext";

import { login as loginApi, logout as logoutApi } from "@/features/auth/authService";
import { getAccessToken } from "@/features/auth/tokenStorage";

export default function AuthProvider({ children }: { children: ReactNode }) {
  // Token del contexto = accessToken
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  // Leer usuario desde localStorage
  const user: User | null = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || !token) return null;

    try {
      const raw = JSON.parse(storedUser) as {
        id?: number;
        username?: string;
        email?: string;
        rol?: Role;
        branchId?: number;
        businessType?: number;
      };

      return {
        id: raw.id ?? null,
        email: raw.email ?? null,
        username: raw.username ?? null,
        role: raw.rol ?? null,
        branchId: raw.branchId ?? null,
        businessType: raw.businessType ?? null,
      };
    } catch {
      return null;
    }
  }, [token]);

  const value = useMemo<AuthCtx>(
    () => ({
      token,
      user,
      isAuthenticated: !!token,

      async login(email: string, password: string) {
        const data = await loginApi(email, password); // Guarda tokens y user
        setToken(data.accessToken);
      },

      logout() {
        logoutApi();
        setToken(null);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
