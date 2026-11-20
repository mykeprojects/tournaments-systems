import { Navigate } from "react-router-dom";
import { hasApplicationRole } from "../../domain/authorization/roleAccess";
import { useAuth } from "../../hooks/useAuth";
import { routePaths } from "../../routes/routePaths";
import FullScreenLoader from "../../components/FullScreenLoader";
import Dashboard from "./Dashboard";
import Forbidden from "./Forbidden";

export default function RoleLanding() {
  const { roles, roleLoading, roleLoadError, hasPermission } = useAuth();

  if (roleLoading) {
    return <FullScreenLoader message="Cargando tus funcionalidades..." />;
  }
  if (roleLoadError) {
    return <Forbidden />;
  }
  const roleNames = roles.map((role) => role.name);
  if (hasPermission("users.view") || hasPermission("roles.view")) {
    return <Dashboard />;
  }
  if (hasApplicationRole(roleNames, "sportsAdmin")) {
    return <Navigate to={routePaths.sports} replace />;
  }
  if (hasApplicationRole(roleNames, "fan")) {
    return <Navigate to={routePaths.bets} replace />;
  }
  return <Forbidden />;
}
