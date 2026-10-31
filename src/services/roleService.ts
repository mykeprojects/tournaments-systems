import apiClient from "../interceptors/apiClient";
import type { Role } from "./userService";

export interface Permission {
  id: number;
  url: string;
  method: string;
  model: string | null;
}

export type PermissionModule =
  | "Gestión de usuarios"
  | "Gestión de roles"
  | "Gestión de permisos"
  | "Otros";

export interface RolePermissionAssignment {
  id: number;
  roleId: number;
  permissionId: number;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface RolePermissionChangeSet {
  additions: number[];
  removals: RolePermissionAssignment[];
}

export const listPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get<Permission[]>("/api/permissions");
  return response.data;
};

export const listRolePermissionAssignments = async (): Promise<
  RolePermissionAssignment[]
> => {
  const response = await apiClient.get<RolePermissionAssignment[]>(
    "/api/role-permissions"
  );
  return response.data;
};

export const createRole = async (role: CreateRoleRequest): Promise<Role> => {
  const response = await apiClient.post<Role>("/api/roles", role);
  return response.data;
};

export const updateRole = async (
  roleId: number,
  role: CreateRoleRequest
): Promise<Role> => {
  const response = await apiClient.put<Role>(`/api/roles/${roleId}`, role);
  return response.data;
};

export const deleteRole = async (roleId: number): Promise<void> => {
  await apiClient.delete(`/api/roles/${roleId}`);
};

export const createRolePermission = async (
  roleId: number,
  permissionId: number
): Promise<RolePermissionAssignment> => {
  const response = await apiClient.post<RolePermissionAssignment>(
    "/api/role-permissions",
    { roleId, permissionId }
  );
  return response.data;
};

export const deleteRolePermission = async (
  assignmentId: number
): Promise<void> => {
  await apiClient.delete(`/api/role-permissions/${assignmentId}`);
};

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

export const syncRolePermissions = async (
  roleId: number,
  selectedPermissionIds: number[],
  assignments: RolePermissionAssignment[]
): Promise<void> => {
  const changes = getRolePermissionChanges(
    roleId,
    selectedPermissionIds,
    assignments
  );
  const results = await Promise.allSettled([
    ...changes.additions.map((permissionId) =>
      createRolePermission(roleId, permissionId)
    ),
    ...changes.removals.map((assignment) =>
      deleteRolePermission(assignment.id)
    ),
  ]);
  const failedChanges = results.filter(
    (result) => result.status === "rejected"
  ).length;

  if (failedChanges > 0) {
    throw new Error(
      `El rol se guardó, pero falló la actualización de ${failedChanges} permiso(s). Revisa el estado actual y vuelve a intentarlo.`
    );
  }
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

    return [{
      module,
      permissions: modulePermissions.sort(
        (permissionA, permissionB) =>
          permissionA.method.localeCompare(permissionB.method) ||
          permissionA.url.localeCompare(permissionB.url)
      ),
    }];
  });
};
