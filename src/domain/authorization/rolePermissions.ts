import type {
  Permission,
  PermissionModule,
  RolePermissionAssignment,
  RolePermissionChangeSet,
} from "../../models/authorization";

export const DUPLICATE_ROLE_PERMISSION_MESSAGE =
  "Ya existe un rol con esa misma configuración de permisos.";

export const getRolePermissionChanges = (
  roleId: number,
  selectedPermissionIds: number[],
  assignments: RolePermissionAssignment[]
): RolePermissionChangeSet => {
  const currentAssignments = assignments.filter(
    (assignment) => assignment.roleId === roleId
  );
  const currentPermissionIds = new Set(
    currentAssignments.map((assignment) => assignment.permissionId)
  );
  const selectedIds = new Set(selectedPermissionIds);

  return {
    additions: [...selectedIds].filter((id) => !currentPermissionIds.has(id)),
    removals: currentAssignments.filter(
      (assignment) => !selectedIds.has(assignment.permissionId)
    ),
  };
};

export const hasDuplicateRolePermissionSet = (
  roleIds: number[],
  assignments: RolePermissionAssignment[],
  permissionIds: number[],
  excludedRoleId?: number
): boolean => {
  const candidate = new Set(permissionIds);
  const permissionIdsByRole = new Map<number, Set<number>>();
  roleIds.forEach((roleId) => permissionIdsByRole.set(roleId, new Set()));

  assignments.forEach(({ roleId, permissionId }) => {
    permissionIdsByRole.get(roleId)?.add(permissionId);
  });

  return [...permissionIdsByRole.entries()].some(
    ([roleId, assignedPermissionIds]) =>
      roleId !== excludedRoleId &&
      assignedPermissionIds.size === candidate.size &&
      [...candidate].every((permissionId) =>
        assignedPermissionIds.has(permissionId)
      )
  );
};

export const groupPermissionsByModule = (
  permissions: Permission[]
): Array<{ module: PermissionModule; permissions: Permission[] }> => {
  const moduleOrder: PermissionModule[] = [
    "Gestión de usuarios",
    "Gestión de roles",
    "Gestión de permisos",
    "Otros",
  ];
  const groups = new Map<PermissionModule, Permission[]>();

  for (const permission of permissions) {
    const url = permission.url.toLocaleLowerCase();
    const model = permission.model?.trim().toLocaleLowerCase() ?? "";
    let module: PermissionModule;

    if (
      url.startsWith("/api/users") ||
      url.startsWith("/api/user-roles") ||
      model === "users" ||
      model === "user" ||
      model === "profiles" ||
      model === "profile" ||
      model === "user_roles" ||
      model === "userroles"
    ) {
      module = "Gestión de usuarios";
    } else if (
      url.startsWith("/api/roles") ||
      model === "roles" ||
      model === "role"
    ) {
      module = "Gestión de roles";
    } else if (
      url.startsWith("/api/permissions") ||
      url.startsWith("/api/role-permissions") ||
      model === "permissions" ||
      model === "permission" ||
      model === "role_permissions" ||
      model === "rolepermissions"
    ) {
      module = "Gestión de permisos";
    } else {
      module = "Otros";
    }

    const group = groups.get(module) ?? [];
    group.push(permission);
    groups.set(module, group);
  }

  return moduleOrder.flatMap((module) => {
    const modulePermissions = groups.get(module);
    if (!modulePermissions) return [];

    return [
      {
        module,
        permissions: modulePermissions.sort(
          (permissionA, permissionB) =>
            permissionA.method.localeCompare(permissionB.method) ||
            permissionA.url.localeCompare(permissionB.url)
        ),
      },
    ];
  });
};
