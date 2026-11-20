import type { Role, UserRoleAssignment } from "../../models/user";

export type ApplicationRole = "fan" | "sportsAdmin";

export const ADMINISTRATOR_ROLE_ASSIGNMENT_PROTECTED_MESSAGE =
  "No puedes quitar el rol de administrador a otro usuario que también tiene ese rol.";

const ROLE_NAMES: Record<ApplicationRole, Set<string>> = {
  fan: new Set(["AFICIONADO", "HINCHA", "FAN"]),
  sportsAdmin: new Set([
    "ADMINISTRADOR DEPORTIVO",
    "SPORTS ADMIN",
    "SPORT ADMIN",
  ]),
};

const ADMIN_ROLE_NAMES = new Set([
  "ADMIN",
  "ADMINISTRADOR",
  "ROLE ADMIN",
  "ROLE ADMINISTRADOR",
]);

const normalizeRoleName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isAdministratorRole = (
  role: Pick<Role, "name"> | null
): boolean =>
  role !== null && ADMIN_ROLE_NAMES.has(normalizeRoleName(role.name));

export const isAdministratorRoleAssignmentRemovalProtected = (
  assignments: UserRoleAssignment[],
  currentUserId: number | undefined,
  targetUserId: number,
  targetRole: Pick<Role, "name">
): boolean =>
  currentUserId !== undefined &&
  currentUserId !== targetUserId &&
  isAdministratorRole(targetRole) &&
  assignments.some(
    (assignment) =>
      assignment.userId === currentUserId &&
      isAdministratorRole(assignment.role)
  );

export const hasApplicationRole = (
  roleNames: string[],
  requiredRole: ApplicationRole,
): boolean =>
  roleNames.some((name) => {
    const normalized = normalizeRoleName(name);
    if (ADMIN_ROLE_NAMES.has(normalized)) {
      return requiredRole === "sportsAdmin";
    }
    return ROLE_NAMES[requiredRole].has(normalized);
  });

export const applicationRoleLabel = (roleNames: string[]): string => {
  if (roleNames.some((name) => ADMIN_ROLE_NAMES.has(normalizeRoleName(name)))) {
    return "Administrador";
  }
  if (hasApplicationRole(roleNames, "sportsAdmin")) return "Administrador deportivo";
  if (hasApplicationRole(roleNames, "fan")) return "Aficionado";
  return roleNames[0] ?? "Usuario";
};
