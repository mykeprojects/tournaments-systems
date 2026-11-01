import { describe, expect, it } from "vitest";
import {
  isValidPhoneNumber,
  sanitizePhoneNumber,
} from "./phoneNumber";

describe("phoneNumber", () => {
  it("keeps only the first 10 digits", () => {
    expect(sanitizePhoneNumber("300 123-4567 extra")).toBe("3001234567");
    expect(sanitizePhoneNumber("abc")).toBe("");
  });

  it("accepts exactly 10 digits", () => {
    expect(isValidPhoneNumber("3001234567")).toBe(true);
    expect(isValidPhoneNumber("300123456")).toBe(false);
    expect(isValidPhoneNumber("30012abc67")).toBe(false);
  });
});
