import { describe, expect, it } from "vitest";
import { iconForResource } from "./permissionMatrixIcons";

describe("iconForResource", () => {
  it("maps known resources to their icon", () => {
    expect(iconForResource("users")).toBe("user");
    expect(iconForResource("roles")).toBe("shield");
    expect(iconForResource("tournaments")).toBe("trophy");
  });

  it("falls back to a generic icon for unknown resources", () => {
    expect(iconForResource("unknown-module")).toBe("cube");
  });
});
