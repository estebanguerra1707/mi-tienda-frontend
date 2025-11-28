
import { Navigate, Outlet, useLocation } from "react-router-dom";

type Props = {
  roles?: string[]; // <-- acepta roles opcionales
};

export default function ProtectedRoute({ roles }: Props) {
  const token = localStorage.getItem("jwt");
  const role  = localStorage.getItem("rol");

  const location = useLocation();

  // sin token -> login
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname } }}
      />
    );
  }

  // si se pasaron roles y el rol del usuario no está permitido -> redirige
  if (roles && roles.length > 0 && (!role || !roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
