import { describe, expect, it } from "vitest";
import { applicationRoleLabel, hasApplicationRole } from "./roleAccess";

describe("application role access", () => {
  it("recognizes the Spanish role names independent of accents and separators", () => {
    expect(hasApplicationRole(["Aficionado"], "fan")).toBe(true);
    expect(hasApplicationRole(["ADMINISTRADOR_DEPORTIVO"], "sportsAdmin")).toBe(true);
  });

  it("does not grant sports administration to a generic administrator", () => {
    expect(hasApplicationRole(["ADMIN"], "sportsAdmin")).toBe(false);
  });

  it("provides the role label used by the application shell", () => {
    expect(applicationRoleLabel(["AFICIONADO"])).toBe("Aficionado");
    expect(applicationRoleLabel([])).toBe("Usuario");
  });
});
