import { describe, expect, it } from "vitest";
import {
  isAdministratorRole,
  hasDuplicateRolePermissionSet,
  getRolePermissionChanges,
  groupPermissionsByModule,
  type Permission,
  type RolePermissionAssignment,
} from "./roleService";

const permissions: Permission[] = [
  { id: 1, method: "GET", url: "/api/users", model: "users" },
  { id: 2, method: "POST", url: "/api/users", model: "users" },
  { id: 3, method: "GET", url: "/api/roles", model: "roles" },
  { id: 4, method: "GET", url: "/api/permissions", model: "permissions" },
  { id: 5, method: "GET", url: "/api/role-permissions", model: null },
  { id: 6, method: "GET", url: "/api/tournaments", model: "tournaments" },
];

describe("role permission utilities", () => {
  it("protects only the ADMIN role", () => {
    expect(isAdministratorRole({ name: "ADMIN" }))
      .toBe(true);
    expect(isAdministratorRole({ name: "admin" }))
      .toBe(true);
    expect(isAdministratorRole({
      name: "ADMINISTRADOR",
    })).toBe(false);
    expect(isAdministratorRole(null)).toBe(false);
  });

  it("groups permissions using the existing module categories", () => {
    expect(groupPermissionsByModule(permissions)).toEqual([
      {
        module: "Gestión de usuarios",
        permissions: [permissions[0], permissions[1]],
      },
      { module: "Gestión de roles", permissions: [permissions[2]] },
      {
        module: "Gestión de permisos",
        permissions: [permissions[3], permissions[4]],
      },
      { module: "Otros", permissions: [permissions[5]] },
    ]);
  });

  it("groups permissions without a module under otros", () => {
    const permissionsWithoutModule: Permission[] = [
      { id: 4, method: "GET", url: "/api/legacy", model: null },
      { id: 5, method: "GET", url: "/api/unassigned", model: "  " },
    ];

    expect(groupPermissionsByModule(permissionsWithoutModule)).toEqual([
      { module: "Otros", permissions: permissionsWithoutModule },
    ]);
  });

  it("calculates only permission additions and removals for the selected role", () => {
    const assignments: RolePermissionAssignment[] = [
      { id: 10, roleId: 7, permissionId: 1 },
      { id: 11, roleId: 7, permissionId: 2 },
      { id: 12, roleId: 8, permissionId: 3 },
    ];

    expect(getRolePermissionChanges(7, [2, 3], assignments)).toEqual({
      additions: [3],
      removals: [{ id: 10, roleId: 7, permissionId: 1 }],
    });
  });

  it("deduplicates selected permission ids", () => {
    expect(getRolePermissionChanges(7, [3, 3], [])).toEqual({
      additions: [3],
      removals: [],
    });
  });

  it("detects equal permission sets regardless of selection order", () => {
    const assignments: RolePermissionAssignment[] = [
      { id: 1, roleId: 7, permissionId: 10 },
      { id: 2, roleId: 7, permissionId: 11 },
      { id: 3, roleId: 8, permissionId: 11 },
      { id: 4, roleId: 8, permissionId: 10 },
    ];

    expect(hasDuplicateRolePermissionSet(
      [7, 8],
      assignments,
      [10, 11],
      7
    )).toBe(true);
  });

  it("excludes the edited role and distinguishes different sets", () => {
    const assignments: RolePermissionAssignment[] = [
      { id: 1, roleId: 7, permissionId: 10 },
    ];

    expect(hasDuplicateRolePermissionSet(
      [7],
      assignments,
      [10],
      7
    )).toBe(false);
    expect(hasDuplicateRolePermissionSet(
      [7],
      assignments,
      [10, 11]
    )).toBe(false);
  });

  it("treats two empty permission sets as duplicates", () => {
    expect(hasDuplicateRolePermissionSet(
      [7, 8],
      [],
      []
    )).toBe(true);
  });
});
