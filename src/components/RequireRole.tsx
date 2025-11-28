import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RequireRole({ allow, children }: { allow: Array<"ADMIN"|"SUPER_ADMIN">; children: ReactNode }) {
  const { hasRole } = useAuth();
  const ok = allow.some(r => hasRole?.(r) ?? false);
  if (!ok) return <div className="p-6 text-red-600">No autorizado</div>;
  return <>{children}</>;
}