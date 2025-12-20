import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { AuthContextType } from "@/context/AuthContext";

type UserWithRole = {
  role?: string; // local
  rol?: string;  // stg
};

export interface UseAuthReturn extends AuthContextType {
  role: string | null;
  hasRole: (role: "SUPER_ADMIN" | "ADMIN" | "VENDOR") => boolean;
  isSuper: boolean;
  isAdmin: boolean;
  isVendor: boolean;
}

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  // 🔑 Normalizar rol (local usa `role`, stg usa `rol`)
  const user = ctx.user as UserWithRole | undefined;
  const role: string | null = user?.role ?? user?.rol ?? null;

  const hasRole = (r: "SUPER_ADMIN" | "ADMIN" | "VENDOR") => role === r;

  return {
    ...ctx,
    role,
    hasRole,
    isSuper: hasRole("SUPER_ADMIN"),
    isAdmin: hasRole("ADMIN"),
    isVendor: hasRole("VENDOR"),
  };
}
