import { describe, expect, it } from "vitest";
import {
  isAdministratorRoleAssignmentRemovalProtected,
  type UserRoleAssignment,
} from "./userService";

const assignment = (
  id: number,
  userId: number,
  roleName: string
): UserRoleAssignment => ({
  id,
  userId,
  role: { id: id + 100, name: roleName, description: "" },
});

describe("administrator role assignment protection", () => {
  it("protects the ADMIN assignment of another administrator", () => {
    const assignments = [
      assignment(1, 10, "ADMIN"),
      assignment(2, 20, "admin"),
    ];

    expect(
      isAdministratorRoleAssignmentRemovalProtected(
        assignments,
        10,
        20,
        assignments[1].role
      )
    ).toBe(true);
  });

  it("does not protect other roles, self-removal, or non-administrator actors", () => {
    const administratorRole = { id: 1, name: "ADMIN", description: "" };
    const assignments = [assignment(1, 10, "ADMIN")];

    expect(
      isAdministratorRoleAssignmentRemovalProtected(
        assignments,
        10,
        20,
        { name: "USUARIO" }
      )
    ).toBe(false);
    expect(
      isAdministratorRoleAssignmentRemovalProtected(
        assignments,
        10,
        10,
        administratorRole
      )
    ).toBe(false);
    expect(
      isAdministratorRoleAssignmentRemovalProtected(
        [assignment(1, 10, "USUARIO")],
        10,
        20,
        administratorRole
      )
    ).toBe(false);
  });

  it("also protects the ADMINISTRADOR alias", () => {
    expect(
      isAdministratorRoleAssignmentRemovalProtected(
        [assignment(1, 10, "ADMIN")],
        10,
        20,
        { name: "ADMINISTRADOR" }
      )
    ).toBe(true);
  });
});
