import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AppRole } from "../domain/auth";
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

export const RoleGuard = ({ allowedRoles }: { allowedRoles: AppRole[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader message="Validando permisos..." />;
  }

  if (!user) {
    return <Navigate to={routePaths.signIn} state={{ from: location }} replace />;
  }

  return allowedRoles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to={routePaths.forbidden} replace />
  );
};