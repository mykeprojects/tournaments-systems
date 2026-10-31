const SESSION_STORAGE_KEY = "security-api-session";

export interface StoredAuthSession {
  token: string;
  expiresAt: string;
  email: string;
}

export const saveAuthSession = (
  token: string,
  expiresAt: string,
  email: string
): void => {
  const session: StoredAuthSession = { token, expiresAt, email };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const getAuthSession = (): StoredAuthSession | null => {
  const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(storedSession);
    if (
      parsed &&
      typeof parsed === "object" &&
      "token" in parsed &&
      typeof parsed.token === "string" &&
      "expiresAt" in parsed &&
      typeof parsed.expiresAt === "string" &&
      "email" in parsed &&
      typeof parsed.email === "string"
    ) {
      return {
        token: parsed.token,
        expiresAt: parsed.expiresAt,
        email: parsed.email,
      };
    }
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }

  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  return null;
};

export const getAuthToken = (): string | null => getAuthSession()?.token ?? null;

export const clearAuthSession = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};
