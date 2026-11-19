import { createBrowserRouter, Navigate } from "react-router-dom";
import SignIn from "../pages/Authentication/SignIn";
import SignUp from "../pages/Authentication/SignUp";
import ForgotPassword from "../pages/Authentication/ForgotPassword";
import ResetPassword, { SetNewPassword } from "../pages/Authentication/ResetPassword";
import RoleLanding from "../pages/Protected/RoleLanding";
import RoleManagement from "../pages/Protected/RoleManagement";
import FanBetsPage from "../pages/Protected/FanBetsPage";
import FanPaymentMethodsPage from "../pages/Protected/FanPaymentMethodsPage";
import SportsAdminBetsPage from "../pages/Protected/SportsAdminBetsPage";
import MatchManagementPage from "../pages/Protected/MatchManagementPage";
import MatchTrackingPage from "../pages/Protected/MatchTrackingPage";
import Forbidden from "../pages/Protected/Forbidden";
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
import { AuthGuard, RoleGuard } from "./guards";
import { routePaths } from "./routePaths";

export { routePaths };

export const router = createBrowserRouter([
  {
    element: <AuthGuard />,
    children: [
      {
        path: routePaths.forbidden,
        element: <Forbidden />,
      },
      {
        path: routePaths.home,
        element: <Navigate to={routePaths.dashboard} replace />,
      },
      {
        element: <AppShellLayout />,
        children: [
          {
            path: routePaths.dashboard,
            element: <RoleLanding />,
          },
          {
            path: routePaths.admin,
            element: <RoleLanding />,
          },
          {
            path: routePaths.roles,
            element: <RoleManagement />,
          },
          {
            element: <RoleGuard requiredRole="fan" />,
            children: [
              { path: routePaths.bets, element: <FanBetsPage /> },
              { path: routePaths.paymentMethods, element: <FanPaymentMethodsPage /> },
            ],
          },
          {
            element: <RoleGuard requiredRole="sportsAdmin" />,
            children: [{ path: routePaths.sportsBets, element: <SportsAdminBetsPage /> }],
          },
          {
            element: <RoleGuard requiredRole={["sportsAdmin", "fan"]} />,
            children: [{ path: routePaths.tracking, element: <MatchTrackingPage /> }],
          },
          {
            element: <RoleGuard requiredRole="sportsAdmin" />,
            children: [
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
                  { path: "partidos", element: <MatchManagementPage /> },
                ],
              },
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