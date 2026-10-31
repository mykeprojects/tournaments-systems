import { describe, expect, it } from "vitest";
import { hasPermission, type PermissionKey } from "./authorizationService";
import type { Permission } from "./roleService";

const grant = (method: string, url: string): Permission => ({
  id: 1,
  method,
  url,
  model: null,
});

describe("permission-based UI authorization", () => {
  it("recognizes resource permissions regardless of role names", () => {
    const permissions = [grant("GET", "/api/users")];

    expect(hasPermission(permissions, "users.view")).toBe(true);
    expect(hasPermission(permissions, "users.viewDetails")).toBe(false);
    expect(hasPermission(permissions, "users.delete")).toBe(false);
  });

  it("normalizes concrete resource IDs to backend permission templates", () => {
    expect(
      hasPermission([grant("DELETE", "/api/users/123")], "users.delete")
    ).toBe(true);
  });

  it("recognizes profile permissions independently", () => {
    const permissions = [grant("POST", "/api/users/{id}/profile")];

    expect(hasPermission(permissions, "profiles.create")).toBe(true);
    expect(hasPermission(permissions, "profiles.view")).toBe(false);
    expect(hasPermission(permissions, "profiles.edit")).toBe(false);
  });

  it("requires every route used by a compound action", () => {
    const permissions = [
      grant("GET", "/api/user-roles"),
      grant("POST", "/api/user-roles"),
    ];

    expect(hasPermission(permissions, "users.assignRoles")).toBe(false);
    expect(
      hasPermission(
        [...permissions, grant("GET", "/api/roles")],
        "users.assignRoles"
      )
    ).toBe(true);
  });

  it("grants modules to any user with the required endpoint permissions", () => {
    const permissions = [
      grant("GET", "/api/users"),
      grant("GET", "/api/users/{id}/detail"),
      grant("POST", "/api/users"),
      grant("PUT", "/api/users/{id}"),
      grant("DELETE", "/api/users/{id}"),
      grant("GET", "/api/user-roles"),
      grant("POST", "/api/user-roles"),
      grant("GET", "/api/roles"),
      grant("POST", "/api/roles"),
      grant("PUT", "/api/roles/{id}"),
      grant("DELETE", "/api/roles/{id}"),
      grant("GET", "/api/permissions"),
      grant("POST", "/api/permissions"),
      grant("PUT", "/api/permissions/{id}"),
      grant("DELETE", "/api/permissions/{id}"),
      grant("GET", "/api/role-permissions"),
      grant("POST", "/api/role-permissions"),
      grant("DELETE", "/api/role-permissions/{id}"),
      grant("GET", "/api/users/{id}/profile"),
      grant("POST", "/api/users/{id}/profile"),
      grant("PUT", "/api/users/{id}/profile"),
      grant("DELETE", "/api/users/{id}/profile"),
    ];
    const keys: PermissionKey[] = [
      "users.view",
      "users.viewDetails",
      "users.create",
      "users.edit",
      "users.delete",
      "users.assignRoles",
      "roles.view",
      "roles.create",
      "roles.edit",
      "roles.delete",
      "permissions.view",
      "permissions.create",
      "permissions.edit",
      "permissions.delete",
      "permissions.assign",
      "profiles.view",
      "profiles.create",
      "profiles.edit",
      "profiles.delete",
    ];

    expect(keys.every((permission) => hasPermission(permissions, permission))).toBe(true);
  });
});
