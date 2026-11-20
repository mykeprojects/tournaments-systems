import { createBrowserRouter, Navigate } from "react-router-dom";
import SignIn from "../pages/Authentication/SignIn";
import SignUp from "../pages/Authentication/SignUp";
import ForgotPassword from "../pages/Authentication/ForgotPassword";
import ResetPassword, { SetNewPassword } from "../pages/Authentication/ResetPassword";
import { useState } from "react";
import { hasApplicationRole } from "../domain/authorization/roleAccess";
import { useAuth } from "../hooks/useAuth";
import RoleLanding from "../pages/Protected/RoleLanding";
import Dashboard from "../pages/Protected/Dashboard";
import RoleManagement from "../pages/Protected/RoleManagement";
import FanBetsPage from "../pages/Protected/FanBetsPage";
import FanPaymentMethodsPage from "../pages/Protected/FanPaymentMethodsPage";
import SportsAdminBetsPage from "../pages/Protected/SportsAdminBetsPage";
import MatchManagementPage from "../pages/Protected/MatchManagementPage";
import PartidosPage from "../sports/pages/PartidosPage";
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
import TorneosPage from "../sports/pages/TorneosPage";
import TorneoDesarrolloPage from "../sports/pages/TorneoDesarrolloPage";
import InscripcionesPage from "../sports/pages/InscripcionesPage";
import FasesPage from "../sports/pages/FasesPage";
import GruposPage from "../sports/pages/GruposPage";
import FasesFinalesPage from "../sports/pages/FasesFinalesPage";
import { AuthGuard, RoleGuard } from "./guards";
import { routePaths } from "./routePaths";

export { routePaths };

function PartidosRoute() {
  const { roles } = useAuth();
  const isSportsAdmin = hasApplicationRole(
    roles.map((role) => role.name),
    "sportsAdmin",
  );
  const [tab, setTab] = useState<"schedule" | "results">("schedule");

  if (!isSportsAdmin) {
    return <PartidosPage />;
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("schedule")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            tab === "schedule"
              ? "bg-[#3dff7a] text-[#04210f]"
              : "border border-white/10 text-slate-300 hover:border-[#3dff7a]/40"
          }`}
        >
          Programación
        </button>
        <button
          type="button"
          onClick={() => setTab("results")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            tab === "results"
              ? "bg-[#3dff7a] text-[#04210f]"
              : "border border-white/10 text-slate-300 hover:border-[#3dff7a]/40"
          }`}
        >
          Resultados y anotaciones
        </button>
      </div>
      {tab === "results" ? <MatchManagementPage /> : <PartidosPage />}
    </div>
  );
}

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
            path: routePaths.accountProfile,
            element: <Dashboard />,
          },
          {
            path: routePaths.admin,
            element: <RoleLanding />,
          },
          {
            element: <RoleGuard requiredRole="administrator" />,
            children: [{ path: routePaths.roles, element: <RoleManagement /> }],
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
            path: "/gestion",
            element: <SportsLayout />,
            children: [
              { index: true, element: <Navigate to={routePaths.sports} replace /> },
              {
                element: <RoleGuard requiredRole="sportsAdmin" />,
                children: [
                  { path: "deportes", element: <DeportesPage /> },
                  { path: "equipos/asociar", element: <AsociarDeportesPage /> },
                  { path: "equipos/plantilla", element: <PlantillaPage /> },
                  { path: "jugadores", element: <JugadoresPage /> },
                  { path: "habilidades", element: <HabilidadesPage /> },
                  { path: "habilidades/asignar", element: <AsignarHabilidadesPage /> },
                  { path: "perfil", element: <PerfilDeportivoPage /> },
                  { path: "inscripciones", element: <InscripcionesPage /> },
                  { path: "fases", element: <FasesPage /> },
                  { path: "grupos", element: <GruposPage /> },
                  { path: "fases-finales", element: <FasesFinalesPage /> },
                ],
              },
              {
                element: <RoleGuard requiredRole={["sportsAdmin", "fan"]} />,
                children: [
                  { path: "equipos", element: <EquiposPage /> },
                  { path: "torneos", element: <TorneosPage /> },
                  { path: "torneos/:id/desarrollo", element: <TorneoDesarrolloPage /> },
                  { path: "partidos", element: <PartidosRoute /> },
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
