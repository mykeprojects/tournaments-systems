import { createBrowserRouter, Navigate } from "react-router-dom";
import SignIn from "../pages/Authentication/SignIn";
import Dashboard from "../pages/Protected/Dashboard";
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
        path: routePaths.dashboard,
        element: <Dashboard />,
      },
      {
        path: routePaths.admin,
        element: <Dashboard />,
      },
    ],
  },

  {
    path: routePaths.signIn,
    element: <SignIn />,
  },
  {
    path: routePaths.signUp,
    element: <Navigate to={routePaths.signIn} replace />,
  },
  {
    path: "*",
    element: <Navigate to={routePaths.signIn} replace />,
  },
]);

export default router;