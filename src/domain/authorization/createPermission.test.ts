import { describe, expect, it } from "vitest";
import {
  defaultBaseUrlForModel,
  permissionDraftsForResource,
  validateCreatePermission,
  validateCreateResourcePermissions,
} from "./createPermission";

describe("validateCreatePermission", () => {
  it("accepts a complete catalog permission", () => {
    expect(
      validateCreatePermission({
        method: "GET",
        url: "/api/tournaments/{id}",
        model: "tournaments",
      })
    ).toBeNull();
  });

  it("rejects incomplete or invalid data", () => {
    expect(
      validateCreatePermission({ method: "", url: "/api/users", model: "users" })
    ).toBe("El método HTTP es obligatorio.");
    expect(
      validateCreatePermission({ method: "GET", url: "api/users", model: "users" })
    ).toBe("La URL debe iniciar con /.");
    expect(
      validateCreatePermission({ method: "GET", url: "/api/users", model: "" })
    ).toBe("El modelo o recurso es obligatorio.");
  });
});

describe("permissionDraftsForResource", () => {
  it("creates one permission per selected matrix operation", () => {
    expect(
      permissionDraftsForResource("pizzas", "/api/pizzas/", [
        "Listar",
        "Ver",
        "Crear",
        "Actualizar",
        "Eliminar",
      ])
    ).toEqual([
      { method: "GET", url: "/api/pizzas/{id}", model: "pizzas" },
      { method: "GET", url: "/api/pizzas", model: "pizzas" },
      { method: "POST", url: "/api/pizzas", model: "pizzas" },
      { method: "PUT", url: "/api/pizzas/{id}", model: "pizzas" },
      { method: "DELETE", url: "/api/pizzas/{id}", model: "pizzas" },
    ]);
  });

  it("builds the default collection url from the model name", () => {
    expect(defaultBaseUrlForModel("Pizzas")).toBe("/api/pizzas");
  });
});

describe("validateCreateResourcePermissions", () => {
  it("rejects a generic /api url and an empty operation set", () => {
    expect(
      validateCreateResourcePermissions({
        model: "pizzas",
        baseUrl: "/api/",
        actions: ["Crear"],
      })
    ).toBe("Indica la URL completa del recurso, por ejemplo /api/pizzas.");
    expect(
      validateCreateResourcePermissions({
        model: "pizzas",
        baseUrl: "/api/pizzas",
        actions: [],
      })
    ).toBe(
      "Selecciona al menos una operación (Ver, Listar, Crear, Actualizar o Eliminar)."
    );
  });
});
