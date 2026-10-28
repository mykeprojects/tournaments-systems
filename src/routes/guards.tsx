import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { routePaths } from "./routePaths";
import FullScreenLoader from "../components/FullScreenLoader";

export const AuthGuard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader message="Validando sesión..." />;
  }

  return user ? (
    <Outlet />
  ) : (
    <Navigate to={routePaths.signIn} state={{ from: location }} replace />
  );
};