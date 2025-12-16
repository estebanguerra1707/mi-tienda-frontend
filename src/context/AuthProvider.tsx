import { useMemo, useState, type ReactNode, useEffect } from "react";
import {
  AuthContext,
  type AuthCtx,
  type User,
  type Role,
} from "./AuthContext";

import { login as loginApi, logout as logoutApi } from "@/features/auth/authService";
import { getAccessToken } from "@/features/auth/tokenStorage";

export default function AuthProvider({ children }: { children: ReactNode }) {
  // 1) Estado para token
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  // 2) Estado para user
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

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
        username: raw.username ?? null,
        email: raw.email ?? null,
        role: raw.rol ?? null,
        branchId: raw.branchId ?? null,
        businessType: raw.businessType ?? null,
      };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        const value = e.newValue;
        if (!value) {
          setUser(null);
          return;
        }
        try {
          const raw = JSON.parse(value);
          setUser({
            id: raw.id ?? null,
            username: raw.username ?? null,
            email: raw.email ?? null,
            role: raw.rol ?? null,
            branchId: raw.branchId ?? null,
            businessType: raw.businessType ?? null,
          });
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      token,
      user,
      isAuthenticated: !!token,

      async login(email: string, password: string) {
        const data = await loginApi(email, password);

        // loginApi ya guarda accessToken, refreshToken y user en localStorage
        setToken(data.accessToken);

        // ponemos el user también en el estado
        setUser({
          id: data.id ?? null,
          username: data.username ?? null,
          email: data.email ?? null,
          role: data.rol ?? null,
          branchId: data.branchId ?? null,
          businessType: data.businessType ?? null,
        });
      },
      logout(manual?: boolean) {
        logoutApi(manual);
        setToken(null);
        setUser(null);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
