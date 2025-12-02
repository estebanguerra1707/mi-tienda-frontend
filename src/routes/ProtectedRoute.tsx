import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/context/AuthContext";

type Props = {
  roles?: Role[];
};

export default function ProtectedRoute({ roles }: Props) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname } }}
      />
    );
  }

  if (roles && roles.length > 0) {
    const role = user?.role ?? null;
    if (!role || !roles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}