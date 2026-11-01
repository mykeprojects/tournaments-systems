import { describe, expect, it } from "vitest";
import { permissionAction } from "./permissionMatrix";

describe("permissionAction", () => {
  it("maps HTTP methods to profile operations", () => {
    expect(permissionAction("GET", "/api/users")).toBe("Listar");
    expect(permissionAction("GET", "/api/users/{id}")).toBe("Ver");
    expect(permissionAction("GET", "/api/users/{id}/detail")).toBe("Ver");
    expect(permissionAction("POST", "/api/users")).toBe("Crear");
    expect(permissionAction("PUT", "/api/users/{id}")).toBe("Actualizar");
    expect(permissionAction("DELETE", "/api/users/{id}")).toBe("Eliminar");
  });
});
