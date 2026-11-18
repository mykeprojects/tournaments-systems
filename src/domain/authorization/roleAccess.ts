import type { Role, UserRoleAssignment } from "../../models/user";

export type ApplicationRole = "fan" | "sportsAdmin";

export const ADMINISTRATOR_ROLE_ASSIGNMENT_PROTECTED_MESSAGE =
  "No puedes quitar el rol de administrador a otro usuario que también tiene ese rol.";

const isAdministratorRoleAssignment = (role: Pick<Role, "name">): boolean =>
  ["ADMIN", "ADMINISTRADOR"].includes(
    role.name.trim().toLocaleUpperCase()
  );

export const isAdministratorRole = (
  role: Pick<Role, "name"> | null
): boolean =>
  role !== null &&
  role.name.trim().toLocaleUpperCase() === "ADMIN";

export const isAdministratorRoleAssignmentRemovalProtected = (
  assignments: UserRoleAssignment[],
  currentUserId: number | undefined,
  targetUserId: number,
  targetRole: Pick<Role, "name">
): boolean =>
  currentUserId !== undefined &&
  currentUserId !== targetUserId &&
  isAdministratorRoleAssignment(targetRole) &&
  assignments.some(
    (assignment) =>
      assignment.userId === currentUserId &&
      isAdministratorRoleAssignment(assignment.role)
  );

const ROLE_NAMES: Record<ApplicationRole, Set<string>> = {
  fan: new Set(["AFICIONADO", "HINCHA", "FAN"]),
  sportsAdmin: new Set([
    "ADMINISTRADOR DEPORTIVO",
    "SPORTS ADMIN",
    "SPORT ADMIN",
  ]),
};

const normalizeRoleName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const hasApplicationRole = (
  roleNames: string[],
  requiredRole: ApplicationRole,
): boolean =>
  roleNames.some((name) => ROLE_NAMES[requiredRole].has(normalizeRoleName(name)));

export const applicationRoleLabel = (roleNames: string[]): string => {
  if (hasApplicationRole(roleNames, "sportsAdmin")) return "Administrador deportivo";
  if (hasApplicationRole(roleNames, "fan")) return "Aficionado";
  return roleNames[0] ?? "Usuario";
};
