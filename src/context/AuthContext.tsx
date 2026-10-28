import React, { useEffect, useState } from "react";
import {
  registerUnauthorizedHandler,
  setTokenProvider,
} from "../infrastructure/http/apiClient";
import { getUserIdFromToken, isUserAdmin, login } from "../services/authService";
import {
  AuthContext,
  type AuthenticatedUser,
} from "./AuthContextDefinition";

const SESSION_TOKEN_KEY = "security-api-token";
const SESSION_EXPIRY_KEY = "security-api-token-expiry";
const SESSION_EMAIL_KEY = "security-api-user-email";

interface StoredSession {
  user: AuthenticatedUser | null;
  expiresAt: number | null;
}

const readStoredSession = (): StoredSession => {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const expiresAtValue = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  const email = sessionStorage.getItem(SESSION_EMAIL_KEY);
  const expiresAt = expiresAtValue ? Date.parse(expiresAtValue) : Number.NaN;

  if (!token || !email || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return { user: null, expiresAt: null };
  }

  try {
    return {
      user: { email, id: getUserIdFromToken(token) },
      expiresAt,
    };
  } catch {
    return { user: null, expiresAt: null };
  }
};

const clearStoredSession = (): void => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  sessionStorage.removeItem(SESSION_EMAIL_KEY);
};

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storedSession] = useState(readStoredSession);
  const [user, setUser] = useState(storedSession.user);
  const [expiresAt, setExpiresAt] = useState(storedSession.expiresAt);
  const [loading, setLoading] = useState(Boolean(storedSession.user));
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);

  useEffect(() => {
    setTokenProvider(async () => sessionStorage.getItem(SESSION_TOKEN_KEY));
    const unregisterUnauthorizedHandler = registerUnauthorizedHandler(() => {
      clearStoredSession();
      setUser(null);
      setExpiresAt(null);
      setIsAdmin(null);
      setRoleCheckError(null);
    });

    if (!storedSession.user) {
      clearStoredSession();
    } else {
      void isUserAdmin(storedSession.user.id)
        .then((adminStatus) => {
          setIsAdmin(adminStatus);
          setRoleCheckError(null);
        })
        .catch((error: unknown) => {
          setIsAdmin(null);
          setRoleCheckError(
            error instanceof Error
              ? error.message
              : "No fue posible verificar si esta cuenta es administradora."
          );
        })
        .finally(() => setLoading(false));
    }

    return () => {
      unregisterUnauthorizedHandler();
      setTokenProvider(null);
    };
  }, [storedSession.user]);

  useEffect(() => {
    if (!user || !expiresAt) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearStoredSession();
      setUser(null);
      setExpiresAt(null);
      setIsAdmin(null);
      setRoleCheckError(null);
    }, Math.max(0, expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [user, expiresAt]);

  const loginWithCredentials = async (email: string, password: string): Promise<void> => {
    const session = await login(email, password);
    const expirationTime = Date.parse(session.expiresAt);

    if (!session.accessToken || !Number.isFinite(expirationTime) || expirationTime <= Date.now()) {
      throw new Error("El backend devolvió una sesión inválida o vencida.");
    }

    const userId = getUserIdFromToken(session.accessToken);
    sessionStorage.setItem(SESSION_TOKEN_KEY, session.accessToken);
    sessionStorage.setItem(SESSION_EXPIRY_KEY, session.expiresAt);
    sessionStorage.setItem(SESSION_EMAIL_KEY, email);
    setUser({ email, id: userId });
    setExpiresAt(expirationTime);
    setIsAdmin(null);
    setRoleCheckError(null);
    setLoading(true);

    try {
      setIsAdmin(await isUserAdmin(userId));
    } catch (error) {
      setIsAdmin(null);
      setRoleCheckError(
        error instanceof Error
          ? error.message
          : "No fue posible verificar si esta cuenta es administradora."
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshAdminStatus = async (): Promise<void> => {
    if (!user) {
      return;
    }

    setLoading(true);
    setRoleCheckError(null);

    try {
      setIsAdmin(await isUserAdmin(user.id));
    } catch (error) {
      setIsAdmin(null);
      setRoleCheckError(
        error instanceof Error
          ? error.message
          : "No fue posible verificar si esta cuenta es administradora."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    clearStoredSession();
    setUser(null);
    setExpiresAt(null);
    setIsAdmin(null);
    setRoleCheckError(null);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    isAdmin,
    roleCheckError,
    loginWithCredentials,
    refreshAdminStatus,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
