import { createBrowserRouter, Navigate } from "react-router-dom";
import SignIn from "../pages/Authentication/SignIn";
import SignUp from "../pages/Authentication/SignUp";
import Dashboard from "../pages/Protected/Dashboard";
import Forbidden from "../pages/Protected/Forbidden";
import { AuthGuard, RoleGuard } from "./guards";
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
        path: routePaths.dashboard,
        element: <Dashboard />,
      },
      {
        element: <RoleGuard allowedRoles={["ADMIN"]} />,
        children: [
          {
            path: routePaths.admin,
            element: <Dashboard />, // Sustituir por AdminDashboard si aplica
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
    path: routePaths.forbidden,
    element: <Forbidden />,
  },

  {
    path: "*",
    element: <Navigate to={routePaths.signIn} replace />,
  },
]);

export default router;