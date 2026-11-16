import { Outlet } from "react-router-dom";
import { SportsShell } from "./SportsShell";

export default function AppShellLayout() {
  return (
    <SportsShell>
      <Outlet />
    </SportsShell>
  );
}
