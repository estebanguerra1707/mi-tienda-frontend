import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { AuthContextType } from "@/context/AuthContext";
export interface UseAuthReturn extends AuthContextType {
  hasRole: (role: string) => boolean;
  isSuper: boolean;
  isAdmin: boolean;
  isVendor: boolean;
}

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  const safeHasRole = (role: string) => ctx.user?.role === role;

  return {
    ...ctx,
    hasRole: safeHasRole,
    isSuper: safeHasRole("SUPER_ADMIN"),
    isAdmin: safeHasRole("ADMIN"),
    isVendor: safeHasRole("VENDOR"),
  };
}
