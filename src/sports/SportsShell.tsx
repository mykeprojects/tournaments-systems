import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { routePaths } from "../routes/routePaths";
import { applicationRoleLabel, hasApplicationRole } from "../domain/authorization/roleAccess";
import { displayPerson, initials } from "./format";
import { BallIcon, ChartIcon, PlayerIcon, ShieldIcon, StarIcon, TeamsIcon, TrophyIcon, UsersIcon } from "./glyphs";

export const formatRoleName = (name: string | null): string => {
  if (!name) return "Usuario";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export function SportsShell({ children }: { children: ReactNode }) {
  const { user, roles, hasPermission, logout } = useAuth();
  const { pathname } = useLocation();
  const [noticesOpen, setNoticesOpen] = useState(false);
  const name = displayPerson(user?.email);
  const roleNames = roles.map((role) => role.name);
  const isSportsAdmin = hasApplicationRole(roleNames, "sportsAdmin");
  const isFan = hasApplicationRole(roleNames, "fan");
  const roleLabel = applicationRoleLabel(roleNames);
  const nav = [
    ...(isFan
      ? [
          { to: routePaths.bets, label: "Mis apuestas", icon: <BallIcon />, active: (path: string) => path.startsWith(routePaths.bets) },
          { to: routePaths.paymentMethods, label: "Métodos de pago", icon: <ShieldIcon />, active: (path: string) => path.startsWith(routePaths.paymentMethods) },
        ]
      : []),
    ...(isFan && !isSportsAdmin
      ? [
          { to: routePaths.sportsTeams, label: "Equipos", icon: <TeamsIcon />, active: (path: string) => path.startsWith("/gestion/equipos") },
          { to: routePaths.tournaments, label: "Torneos", icon: <TrophyIcon />, active: (path: string) => path.startsWith(routePaths.tournaments) },
          { to: routePaths.sportsMatches, label: "Partidos", icon: <ChartIcon />, active: (path: string) => path.startsWith(routePaths.sportsMatches) },
        ]
      : []),
    ...(isFan || isSportsAdmin
      ? [
          { to: routePaths.tracking, label: "Seguimiento en vivo", icon: <BallIcon />, active: (path: string) => path.startsWith(routePaths.tracking) },
        ]
      : []),
    ...(isSportsAdmin
      ? [
          { to: routePaths.sports, label: "Deportes", icon: <BallIcon />, active: (path: string) => path.startsWith("/gestion/deportes") },
          { to: routePaths.sportsTeams, label: "Equipos", icon: <TeamsIcon />, active: (path: string) => path.startsWith("/gestion/equipos") },
          { to: routePaths.sportsPlayers, label: "Jugadores", icon: <PlayerIcon />, active: (path: string) => path.startsWith("/gestion/jugadores") },
          { to: routePaths.sportsSkills, label: "Habilidades", icon: <StarIcon />, active: (path: string) => path.startsWith("/gestion/habilidades") },
          { to: routePaths.sportsProfile, label: "Perfil Deportivo", icon: <ChartIcon />, active: (path: string) => path.startsWith("/gestion/perfil") },
          { to: routePaths.tournaments, label: "Torneos", icon: <TrophyIcon />, active: (path: string) => path.startsWith(routePaths.tournaments) },
          { to: routePaths.tournamentRegistrations, label: "Inscripciones", icon: <TeamsIcon />, active: (path: string) => path.startsWith(routePaths.tournamentRegistrations) },
          { to: routePaths.tournamentPhases, label: "Fases", icon: <ChartIcon />, active: (path: string) => path.startsWith(routePaths.tournamentPhases) },
          { to: routePaths.tournamentGroups, label: "Grupos", icon: <TeamsIcon />, active: (path: string) => path.startsWith(routePaths.tournamentGroups) },
          { to: routePaths.tournamentBrackets, label: "Fases finales", icon: <TrophyIcon />, active: (path: string) => path.startsWith(routePaths.tournamentBrackets) },
          { to: routePaths.sportsMatches, label: "Partidos", icon: <BallIcon />, active: (path: string) => path.startsWith(routePaths.sportsMatches) },
          { to: routePaths.sportsBets, label: "Apuestas por partido", icon: <ChartIcon />, active: (path: string) => path.startsWith(routePaths.sportsBets) },
        ]
      : []),
    ...(hasPermission("users.view")
      ? [{ to: routePaths.dashboard, label: "Usuarios", icon: <UsersIcon />, active: (path: string) => path === "/dashboard" || path === "/admin" }]
      : []),
    ...(hasPermission("roles.view")
      ? [{ to: routePaths.roles, label: "Roles", icon: <ShieldIcon />, active: (path: string) => path.startsWith("/admin/roles") }]
      : []),
  ].filter((item, index, items) => items.findIndex((other) => other.to === item.to) === index);

  return (
    <div className="sports-canvas flex min-h-screen flex-col text-white lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#07111c]/95 lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:self-start lg:overflow-hidden lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3dff7a] text-[#04210f]">
            <BallIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-black leading-tight">Sports System</p>
            <p className="text-[11px] text-slate-400">Plataforma Deportiva</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:pb-0">
          {nav.map((item) => {
            const active = item.active(pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-[#3dff7a] text-[#04210f]" : "text-slate-300 hover:bg-white/5"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto hidden px-4 py-4 lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{name}</p>
                <p className="text-xs text-emerald-300">En línea · {roleLabel}</p>
              </div>
            </div>
            <button type="button" onClick={() => void logout()} className="mt-3 w-full rounded-lg border border-white/10 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-[#3dff7a]/40 hover:text-white">
              Salir
            </button>
            <p className="mt-3 text-[10px] text-slate-500">v1.0.0 · © 2025 Sports System</p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-white/5 px-5 py-4">
          <div className="relative">
            <button
              type="button"
              aria-label="Notificaciones"
              aria-expanded={noticesOpen}
              onClick={() => setNoticesOpen((open) => !open)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-[#3dff7a]/50 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
            </button>
            {noticesOpen && (
              <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-[#1b3f63] bg-[#071321] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                <p className="text-sm font-bold text-white">Notificaciones</p>
                <p className="mt-2 text-sm text-slate-400">No tienes notificaciones.</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">{initials(name)}</span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold">{name}</span>
              <span className="block text-xs text-slate-400">{roleLabel}</span>
            </span>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
