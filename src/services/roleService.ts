import apiClient from "../interceptors/apiClient";
import { getRolePermissionChanges } from "../domain/authorization/rolePermissions";
import type {
  CreateRoleRequest,
  Permission,
  PermissionRequest,
  RolePermissionAssignment,
} from "../models/authorization";
import type { Role } from "../models/user";

export const listPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get<Permission[]>("/api/permissions");
  return response.data;
};

export const createPermission = async (
  permission: PermissionRequest
): Promise<Permission> => {
  const response = await apiClient.post<Permission>("/api/permissions", permission);
  return response.data;
};

export const updatePermission = async (
  permissionId: number,
  permission: PermissionRequest
): Promise<Permission> => {
  const response = await apiClient.put<Permission>(
    `/api/permissions/${permissionId}`,
    permission
  );
  return response.data;
};

export const deletePermission = async (permissionId: number): Promise<void> => {
  await apiClient.delete(`/api/permissions/${permissionId}`);
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

export const replaceRolePermissions = async (
  roleId: number,
  permissionIds: number[]
): Promise<void> => {
  await apiClient.put(`/api/roles/${roleId}/permissions`, { permissionIds });
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

