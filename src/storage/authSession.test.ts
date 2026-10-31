import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthSession,
  getAuthSession,
  getAuthToken,
  saveAuthSession,
} from "./authSession";

const storedValues = new Map<string, string>();
const sessionStorageMock = {
  getItem: (key: string) => storedValues.get(key) ?? null,
  setItem: (key: string, value: string) => storedValues.set(key, value),
  removeItem: (key: string) => storedValues.delete(key),
};

describe("auth session storage", () => {
  beforeEach(() => {
    storedValues.clear();
    vi.stubGlobal("sessionStorage", sessionStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists the token, expiration, and email for the current tab", () => {
    saveAuthSession("jwt-token", "2030-01-01T00:00:00Z", "admin@example.com");

    expect(getAuthSession()).toEqual({
      token: "jwt-token",
      expiresAt: "2030-01-01T00:00:00Z",
      email: "admin@example.com",
    });
    expect(getAuthToken()).toBe("jwt-token");
  });

  it("removes malformed session data instead of accepting it", () => {
    storedValues.set("security-api-session", "{invalid json");

    expect(getAuthSession()).toBeNull();
    expect(storedValues.has("security-api-session")).toBe(false);
  });

  it("clears the stored session on logout", () => {
    saveAuthSession("jwt-token", "2030-01-01T00:00:00Z", "admin@example.com");

    clearAuthSession();

    expect(getAuthSession()).toBeNull();
  });
});
