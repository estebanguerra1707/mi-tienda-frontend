import { Role } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

export function useHasAnyRole(roles: Role[]): boolean {
  const { user } = useAuth();

  if (!user || !user.role) return false;
  return roles.includes(user.role);
}
