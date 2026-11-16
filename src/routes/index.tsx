import { createBrowserRouter, Navigate } from "react-router-dom";
import SignIn from "../pages/Authentication/SignIn";
import SignUp from "../pages/Authentication/SignUp";
import ForgotPassword from "../pages/Authentication/ForgotPassword";
import ResetPassword, { SetNewPassword } from "../pages/Authentication/ResetPassword";
import Dashboard from "../pages/Protected/Dashboard";
import RoleManagement from "../pages/Protected/RoleManagement";
import AppShellLayout from "../sports/AppShellLayout";
import SportsLayout from "../sports/SportsLayout";
import AsociarDeportesPage from "../sports/pages/AsociarDeportesPage";
import AsignarHabilidadesPage from "../sports/pages/AsignarHabilidadesPage";
import DeportesPage from "../sports/pages/DeportesPage";
import EquiposPage from "../sports/pages/EquiposPage";
import HabilidadesPage from "../sports/pages/HabilidadesPage";
import JugadoresPage from "../sports/pages/JugadoresPage";
import PerfilDeportivoPage from "../sports/pages/PerfilDeportivoPage";
import PlantillaPage from "../sports/pages/PlantillaPage";
import { AuthGuard } from "./guards";
import { routePaths } from "./routePaths";

export { routePaths };

export const router = createBrowserRouter([
  {
    element: <AuthGuard />,
    children: [
      {
        path: routePaths.home,
        element: <Navigate to={routePaths.dashboard} replace />,
      },
      {
        element: <AppShellLayout />,
        children: [
      {
        path: routePaths.dashboard,
        element: <Dashboard />,
      },
      {
        path: routePaths.admin,
        element: <Dashboard />,
      },
      {
        path: routePaths.roles,
        element: <RoleManagement />,
      },
      {
        path: "/gestion",
        element: <SportsLayout />,
        children: [
          { index: true, element: <Navigate to={routePaths.sports} replace /> },
          { path: "deportes", element: <DeportesPage /> },
          { path: "equipos", element: <EquiposPage /> },
          { path: "equipos/asociar", element: <AsociarDeportesPage /> },
          { path: "equipos/plantilla", element: <PlantillaPage /> },
          { path: "jugadores", element: <JugadoresPage /> },
          { path: "habilidades", element: <HabilidadesPage /> },
          { path: "habilidades/asignar", element: <AsignarHabilidadesPage /> },
          { path: "perfil", element: <PerfilDeportivoPage /> },
        ],
      },
        ],
      },
    ],
  },

  {
    path: routePaths.signIn,
    element: <SignIn />,
  },
  {
    path: routePaths.signUp,
    element: <SignUp />,
  },
  {
    path: routePaths.forgotPassword,
    element: <ForgotPassword />,
  },
  {
    path: routePaths.recoverVerify,
    element: <ResetPassword />,
  },
  {
    path: routePaths.resetPassword,
    element: <SetNewPassword />,
  },
  {
    path: "*",
    element: <Navigate to={routePaths.signIn} replace />,
  },
]);

export default router;