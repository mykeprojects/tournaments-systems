import { describe, expect, it } from "vitest";
import {
  arePermissionIdSetsEqual,
  buildPermissionMatrix,
  isMatrixCellChecked,
  permissionAction,
  summarizeRoleMatrix,
  toggleMatrixCell,
} from "./permissionMatrix";
import type { Permission } from "../../models/authorization";

const permissions: Permission[] = [
  { id: 1, method: "GET", url: "/api/users", model: "users" },
  { id: 2, method: "GET", url: "/api/users/{id}", model: "users" },
  { id: 3, method: "GET", url: "/api/users/{id}/detail", model: "users" },
  { id: 4, method: "POST", url: "/api/users", model: "users" },
  { id: 5, method: "GET", url: "/api/roles", model: "roles" },
  { id: 6, method: "GET", url: "/api/tournaments", model: "tournaments" },
];

describe("permissionAction", () => {
  it("maps HTTP methods to matrix operations", () => {
    expect(permissionAction("GET", "/api/users")).toBe("Listar");
    expect(permissionAction("GET", "/api/users/{id}")).toBe("Ver");
    expect(permissionAction("GET", "/api/users/{id}/detail")).toBe("Ver");
    expect(permissionAction("POST", "/api/users")).toBe("Crear");
    expect(permissionAction("PUT", "/api/users/{id}")).toBe("Actualizar");
    expect(permissionAction("DELETE", "/api/users/{id}")).toBe("Eliminar");
  });
});

describe("buildPermissionMatrix", () => {
  it("groups resources into mockup modules and actions", () => {
    const matrix = buildPermissionMatrix(permissions);
    expect(matrix.map(({ module }) => module)).toEqual([
      "Administración",
      "Gestión deportiva",
    ]);
    const users = matrix[0].resources.find((resource) => resource.key === "users");
    expect(users?.label).toBe("Usuarios");
    expect(users?.cells.Listar.map(({ id }) => id)).toEqual([1]);
    expect(users?.cells.Ver.map(({ id }) => id)).toEqual([2, 3]);
    expect(users?.cells.Crear.map(({ id }) => id)).toEqual([4]);
  });
});

describe("matrix cell selection", () => {
  it("toggles every permission of the cell together", () => {
    expect(toggleMatrixCell([1], [2, 3])).toEqual([1, 2, 3]);
    expect(toggleMatrixCell([1, 2, 3], [2, 3])).toEqual([1]);
    expect(isMatrixCellChecked([2, 3], [2, 3])).toBe(true);
    expect(isMatrixCellChecked([2], [2, 3])).toBe(false);
  });
});

describe("summarizeRoleMatrix", () => {
  it("counts available, assigned and modules with access", () => {
    const matrix = buildPermissionMatrix(permissions);
    expect(summarizeRoleMatrix(matrix, [1, 2, 3, 6])).toEqual({
      availableCount: 6,
      assignedCount: 4,
      unassignedCount: 2,
      modulesWithAccess: 2,
    });
    expect(arePermissionIdSetsEqual([3, 1], [1, 3])).toBe(true);
  });
});
