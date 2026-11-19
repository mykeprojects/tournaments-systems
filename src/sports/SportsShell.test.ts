import { describe, expect, it } from "vitest";
import { formatRoleName } from "./SportsShell";

describe("formatRoleName", () => {
  it("formats AFICIONADO to Aficionado", () => {
    expect(formatRoleName("AFICIONADO")).toBe("Aficionado");
  });

  it("formats ADMINISTRADOR to Administrador", () => {
    expect(formatRoleName("ADMINISTRADOR")).toBe("Administrador");
  });

  it("formats ADMIN to Admin", () => {
    expect(formatRoleName("ADMIN")).toBe("Admin");
  });

  it("formats any arbitrary role name dynamically", () => {
    expect(formatRoleName("CONSULTOR")).toBe("Consultor");
    expect(formatRoleName("ENTRENADOR")).toBe("Entrenador");
    expect(formatRoleName("Arbitro")).toBe("Arbitro");
  });

  it("defaults to Usuario when role name is null or empty", () => {
    expect(formatRoleName(null)).toBe("Usuario");
    expect(formatRoleName("")).toBe("Usuario");
  });
});
