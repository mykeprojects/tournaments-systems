import { createBrowserRouter, Navigate } from "react-router-dom";
import SignIn from "../pages/Authentication/SignIn";
import SignUp from "../pages/Authentication/SignUp";
import ForgotPassword from "../pages/Authentication/ForgotPassword";
import ResetPassword, { SetNewPassword } from "../pages/Authentication/ResetPassword";
import Dashboard from "../pages/Protected/Dashboard";
import RoleManagement from "../pages/Protected/RoleManagement";
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
      {
        path: routePaths.roles,
        element: <RoleManagement />,
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