const TOKEN_COOKIE = "security-api-token";
const EXPIRY_COOKIE = "security-api-token-expiry";
const EMAIL_COOKIE = "security-api-user-email";

const readCookie = (name: string): string | null => {
  const prefix = `${name}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);

  return value ? decodeURIComponent(value) : null;
};

const writeCookie = (name: string, value: string, expiresAt: string): void => {
  const maxAge = Math.max(
    0,
    Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)
  );
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
};

export const saveAuthCookies = (
  token: string,
  expiresAt: string,
  email: string
): void => {
  writeCookie(TOKEN_COOKIE, token, expiresAt);
  writeCookie(EXPIRY_COOKIE, expiresAt, expiresAt);
  writeCookie(EMAIL_COOKIE, email, expiresAt);
};

export const getAuthTokenCookie = (): string | null => readCookie(TOKEN_COOKIE);

export const getAuthSessionCookies = (): {
  token: string | null;
  expiresAt: string | null;
  email: string | null;
} => ({
  token: readCookie(TOKEN_COOKIE),
  expiresAt: readCookie(EXPIRY_COOKIE),
  email: readCookie(EMAIL_COOKIE),
});

export const clearAuthCookies = (): void => {
  for (const name of [TOKEN_COOKIE, EXPIRY_COOKIE, EMAIL_COOKIE]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
};
