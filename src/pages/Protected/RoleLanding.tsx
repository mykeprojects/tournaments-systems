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
  if (hasPermission("users.view") || hasPermission("roles.view")) {
    return <Dashboard />;
  }
  if (hasApplicationRole(roles.map((role) => role.name), "fan")) {
    return <Navigate to={routePaths.bets} replace />;
  }
  if (hasApplicationRole(roles.map((role) => role.name), "sportsAdmin")) {
    return <Navigate to={routePaths.sportsBets} replace />;
  }
  return <Forbidden />;
}
