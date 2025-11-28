// src/routes/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function RequireAuth({ children }: Props) {
  const token = localStorage.getItem("jwt");
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
