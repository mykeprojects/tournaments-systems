import type { Permission } from "../../services/roleService";

export const MATRIX_ACTIONS = [
  "Ver",
  "Listar",
  "Crear",
  "Actualizar",
  "Eliminar",
] as const;

export type PermissionAction = (typeof MATRIX_ACTIONS)[number];

export type PermissionModule =
  | "Administración"
  | "Gestión deportiva"
  | "Comercial"
  | "Infraestructura"
  | "Reportes"
  | "Otros";

export type MatrixResource = {
  key: string;
  label: string;
  cells: Record<PermissionAction, Permission[]>;
};

export type MatrixModule = {
  module: PermissionModule;
  resources: MatrixResource[];
};

const MODULE_ORDER: PermissionModule[] = [
  "Administración",
  "Gestión deportiva",
  "Comercial",
  "Infraestructura",
  "Reportes",
  "Otros",
];

const RESOURCE_LABELS: Record<string, string> = {
  users: "Usuarios",
  user: "Usuarios",
  profiles: "Perfiles",
  profile: "Perfiles",
  "user-roles": "Roles de usuario",
  user_roles: "Roles de usuario",
  userroles: "Roles de usuario",
  roles: "Roles",
  role: "Roles",
  permissions: "Permisos",
  permission: "Permisos",
  "role-permissions": "Permisos de rol",
  role_permissions: "Permisos de rol",
  rolepermissions: "Permisos de rol",
  tournaments: "Torneos",
  teams: "Equipos",
  equipos: "Equipos",
  players: "Jugadores",
  jugadores: "Jugadores",
  matches: "Partidos",
  partidos: "Partidos",
  tickets: "Entradas",
  entradas: "Entradas",
  venues: "Escenarios",
  escenarios: "Escenarios",
  reports: "Reportes",
  reportes: "Reportes",
};

const RESOURCE_ORDER = [
  "users",
  "roles",
  "permissions",
  "profiles",
  "user-roles",
  "role-permissions",
  "tournaments",
  "teams",
  "players",
  "matches",
  "tickets",
  "venues",
  "reports",
];

const emptyCells = (): Record<PermissionAction, Permission[]> => ({
  Ver: [],
  Listar: [],
  Crear: [],
  Actualizar: [],
  Eliminar: [],
});

export const permissionAction = (
  method: string,
  url: string
): PermissionAction | string => {
  const normalized = method.trim().toUpperCase();

  if (normalized === "POST") {
    return "Crear";
  }
  if (normalized === "PUT" || normalized === "PATCH") {
    return "Actualizar";
  }
  if (normalized === "DELETE") {
    return "Eliminar";
  }
  if (normalized === "GET") {
    return /\{id\}|\/detail(?:\/|$)/i.test(url) ? "Ver" : "Listar";
  }

  return method;
};

const isMatrixAction = (value: string): value is PermissionAction =>
  MATRIX_ACTIONS.includes(value as PermissionAction);

const normalizeResourceKey = (permission: Permission): string => {
  const model = permission.model?.trim().toLocaleLowerCase() ?? "";
  if (model) {
    return model.replaceAll("_", "-");
  }
  const url = permission.url.trim().toLocaleLowerCase();
  const match = url.match(/^\/api\/([^/]+)/);
  return match?.[1] ?? "otros";
};

export const resourceLabel = (permission: Permission): string => {
  const key = normalizeResourceKey(permission);
  return RESOURCE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
};

export const permissionModule = (permission: Permission): PermissionModule => {
  const key = normalizeResourceKey(permission);
  if (
    ["users", "user", "profiles", "profile", "user-roles", "userroles", "roles", "role", "permissions", "permission", "role-permissions", "rolepermissions"].includes(
      key
    )
  ) {
    return "Administración";
  }
  if (["tournaments", "teams", "equipos", "players", "jugadores", "matches", "partidos"].includes(key)) {
    return "Gestión deportiva";
  }
  if (["tickets", "entradas"].includes(key)) {
    return "Comercial";
  }
  if (["venues", "escenarios"].includes(key)) {
    return "Infraestructura";
  }
  if (["reports", "reportes"].includes(key)) {
    return "Reportes";
  }
  return "Otros";
};

export const buildPermissionMatrix = (
  permissions: Permission[]
): MatrixModule[] => {
  const modules = new Map<PermissionModule, Map<string, MatrixResource>>();

  for (const permission of permissions) {
    const action = permissionAction(permission.method, permission.url);
    if (!isMatrixAction(action)) {
      continue;
    }
    const module = permissionModule(permission);
    const key = normalizeResourceKey(permission);
    const resources = modules.get(module) ?? new Map<string, MatrixResource>();
    const current = resources.get(key) ?? {
      key,
      label: resourceLabel(permission),
      cells: emptyCells(),
    };
    current.cells[action] = [...current.cells[action], permission];
    resources.set(key, current);
    modules.set(module, resources);
  }

  return MODULE_ORDER.flatMap((module) => {
    const resources = modules.get(module);
    if (!resources) {
      return [];
    }
    const ordered = [...resources.values()].sort((left, right) => {
      const leftIndex = RESOURCE_ORDER.indexOf(left.key);
      const rightIndex = RESOURCE_ORDER.indexOf(right.key);
      if (leftIndex === -1 && rightIndex === -1) {
        return left.label.localeCompare(right.label);
      }
      if (leftIndex === -1) {
        return 1;
      }
      if (rightIndex === -1) {
        return -1;
      }
      return leftIndex - rightIndex;
    });
    return [{ module, resources: ordered }];
  });
};

export const isMatrixCellChecked = (
  selectedIds: number[],
  cellPermissionIds: number[]
): boolean =>
  cellPermissionIds.length > 0 &&
  cellPermissionIds.every((id) => selectedIds.includes(id));

export const toggleMatrixCell = (
  selectedIds: number[],
  cellPermissionIds: number[]
): number[] => {
  if (cellPermissionIds.length === 0) {
    return selectedIds;
  }
  const selected = new Set(selectedIds);
  const allSelected = cellPermissionIds.every((id) => selected.has(id));
  for (const id of cellPermissionIds) {
    if (allSelected) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
  }
  return [...selected];
};

export const assignedPermissionIdsForRole = (
  roleId: number,
  assignments: Array<{ roleId: number; permissionId: number }>
): number[] =>
  assignments
    .filter((assignment) => assignment.roleId === roleId)
    .map((assignment) => assignment.permissionId);

export const arePermissionIdSetsEqual = (
  left: number[],
  right: number[]
): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
};

export type RoleMatrixSummary = {
  availableCount: number;
  assignedCount: number;
  unassignedCount: number;
  modulesWithAccess: number;
};

export const summarizeRoleMatrix = (
  matrix: MatrixModule[],
  selectedIds: number[]
): RoleMatrixSummary => {
  const selected = new Set(selectedIds);
  let availableCount = 0;
  let assignedCount = 0;
  let modulesWithAccess = 0;

  for (const module of matrix) {
    const moduleHasAccess = module.resources.some((resource) =>
      MATRIX_ACTIONS.some((action) =>
        isMatrixCellChecked(
          selectedIds,
          resource.cells[action].map((permission) => permission.id)
        )
      )
    );
    if (moduleHasAccess) {
      modulesWithAccess += 1;
    }
    for (const resource of module.resources) {
      for (const action of MATRIX_ACTIONS) {
        for (const permission of resource.cells[action]) {
          availableCount += 1;
          if (selected.has(permission.id)) {
            assignedCount += 1;
          }
        }
      }
    }
  }

  return {
    availableCount,
    assignedCount,
    unassignedCount: availableCount - assignedCount,
    modulesWithAccess,
  };
};
