import apiClient from "../interceptors/apiClient";
import type { Permission } from "./roleService";

export type PermissionKey =
  | "users.view"
  | "users.viewDetails"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.assignRoles"
  | "roles.view"
  | "roles.create"
  | "roles.edit"
  | "roles.delete"
  | "permissions.view"
  | "permissions.create"
  | "permissions.edit"
  | "permissions.delete"
  | "permissions.assign"
  | "profiles.view"
  | "profiles.create"
  | "profiles.edit"
  | "profiles.delete";

type RouteGrant = { method: string; url: string };

const PERMISSION_ROUTES: Record<PermissionKey, RouteGrant[]> = {
  "users.view": [{ method: "GET", url: "/api/users" }],
  "users.viewDetails": [{ method: "GET", url: "/api/users/{id}/detail" }],
  "users.create": [{ method: "POST", url: "/api/users" }],
  "users.edit": [{ method: "PUT", url: "/api/users/{id}" }],
  "users.delete": [{ method: "DELETE", url: "/api/users/{id}" }],
  "users.assignRoles": [
    { method: "GET", url: "/api/user-roles" },
    { method: "POST", url: "/api/user-roles" },
    { method: "GET", url: "/api/roles" },
  ],
  "roles.view": [{ method: "GET", url: "/api/roles" }],
  "roles.create": [{ method: "POST", url: "/api/roles" }],
  "roles.edit": [{ method: "PUT", url: "/api/roles/{id}" }],
  "roles.delete": [{ method: "DELETE", url: "/api/roles/{id}" }],
  "permissions.view": [{ method: "GET", url: "/api/permissions" }],
  "permissions.create": [{ method: "POST", url: "/api/permissions" }],
  "permissions.edit": [{ method: "PUT", url: "/api/permissions/{id}" }],
  "permissions.delete": [{ method: "DELETE", url: "/api/permissions/{id}" }],
  "permissions.assign": [
    { method: "GET", url: "/api/role-permissions" },
    { method: "POST", url: "/api/role-permissions" },
    { method: "DELETE", url: "/api/role-permissions/{id}" },
  ],
  "profiles.view": [{ method: "GET", url: "/api/users/{id}/profile" }],
  "profiles.create": [{ method: "POST", url: "/api/users/{id}/profile" }],
  "profiles.edit": [{ method: "PUT", url: "/api/users/{id}/profile" }],
  "profiles.delete": [{ method: "DELETE", url: "/api/users/{id}/profile" }],
};

const normalizeRoute = (url: string): string =>
  url.replace(/(?<=\/)(?:\d+|[a-f0-9]{24})(?=\/|$)/gi, "{id}");

export const hasPermission = (
  permissions: Permission[],
  permission: PermissionKey
): boolean => {
  const grantedRoutes = new Set(
    permissions.map(
      ({ method, url }) => `${method.toUpperCase()} ${normalizeRoute(url)}`
    )
  );

  return PERMISSION_ROUTES[permission].every(({ method, url }) =>
    grantedRoutes.has(`${method} ${url}`)
  );
};

export const listCurrentUserPermissions = async (
  userId: number
): Promise<Permission[]> => {
  const response = await apiClient.get<Permission[]>(
    `/api/users/${userId}/permissions`
  );
  return response.data;
};
