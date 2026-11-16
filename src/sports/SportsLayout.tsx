import { Outlet } from "react-router-dom";
import { SportsCatalogProvider } from "./SportsCatalogContext";

export default function SportsLayout() {
  return (
    <SportsCatalogProvider>
      <Outlet />
    </SportsCatalogProvider>
  );
}
