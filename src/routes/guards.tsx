import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { routePaths } from "./routePaths";
import FullScreenLoader from "../components/FullScreenLoader";
import { hasApplicationRole, type ApplicationRole } from "../domain/authorization/roleAccess";

export const AuthGuard = () => {
  const { user, loading, roleLoading } = useAuth();
  const location = useLocation();

  if (loading || roleLoading) {
    return <FullScreenLoader message="Validando sesión..." />;
  }

  return user ? (
    <Outlet />
  ) : (
    <Navigate to={routePaths.signIn} state={{ from: location }} replace />
  );
};

export const RoleGuard = ({
  requiredRole,
}: {
  requiredRole: ApplicationRole | ApplicationRole[];
}) => {
  const { user, roleLoading, roleLoadError, roles } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={routePaths.signIn} state={{ from: location }} replace />;
  }
  if (roleLoading) {
    return <FullScreenLoader message="Validando rol..." />;
  }
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (
    roleLoadError ||
    !requiredRoles.some((role) => hasApplicationRole(roles.map((item) => item.name), role))
  ) {
    return <Navigate to={routePaths.forbidden} replace />;
  }
  return <Outlet />;
};