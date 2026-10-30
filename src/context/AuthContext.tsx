import React, { useEffect, useState } from "react";
import {
  registerUnauthorizedHandler,
  setTokenProvider,
} from "../interceptors/apiClient";
import {
  getUserIdFromToken,
  isUserAdmin,
  login,
  loginWithExternalProvider,
  logout as logoutFromBackend,
  verifyTwoFactor,
  type AuthSessionResponse,
} from "../services/authService";
import type { CredentialsLoginResult } from "./AuthContextDefinition";
import type { AuthProviderType } from "../domain/auth";
import {
  clearAuthCookies,
  getAuthSessionCookies,
  getAuthTokenCookie,
  saveAuthCookies,
} from "../storage/authCookie";
import {
  AuthContext,
  type AuthenticatedUser,
} from "./AuthContextDefinition";

interface StoredSession {
  user: AuthenticatedUser | null;
  expiresAt: number | null;
}

const readStoredSession = (): StoredSession => {
  const { token, expiresAt: expiresAtValue, email } = getAuthSessionCookies();
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
  clearAuthCookies();
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
    setTokenProvider(async () => getAuthTokenCookie());
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

  const applyAuthenticatedSession = async (
    session: AuthSessionResponse,
    email: string
  ): Promise<void> => {
    const expirationTime = Date.parse(session.expiresAt);

    if (!session.accessToken || !Number.isFinite(expirationTime) || expirationTime <= Date.now()) {
      throw new Error("El backend devolvió una sesión inválida o vencida.");
    }

    const userId = getUserIdFromToken(session.accessToken);
    saveAuthCookies(session.accessToken, session.expiresAt, email);
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

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<CredentialsLoginResult> => {
    const session = await login(email, password);

    if (session.requiresTwoFactor) {
      if (!session.challengeToken) {
        throw new Error("El backend no devolvió el token de verificación de dos factores.");
      }

      return {
        requiresTwoFactor: true,
        challengeToken: session.challengeToken,
        expiresAt: session.expiresAt ?? "",
        message: session.message ?? undefined,
      };
    }

    if (!session.accessToken || !session.expiresAt) {
      throw new Error("El backend devolvió una sesión inválida o vencida.");
    }

    await applyAuthenticatedSession(
      {
        accessToken: session.accessToken,
        tokenType: session.tokenType ?? "Bearer",
        expiresAt: session.expiresAt,
      },
      email
    );
    return { requiresTwoFactor: false };
  };

  const completeTwoFactorLogin = async (
    challengeToken: string,
    code: string,
    email: string
  ): Promise<void> => {
    const session = await verifyTwoFactor(challengeToken, code);
    await applyAuthenticatedSession(session, email);
  };

  const loginWithProvider = async (provider: AuthProviderType): Promise<void> => {
    const { default: firebaseAuthAdapter } = await import(
      "../infrastructure/firebase/FirebaseAuthAdapter"
    );
    const identity = await firebaseAuthAdapter.loginWithProvider(provider);
    let session;
    try {
      session = await loginWithExternalProvider(provider, identity.idToken);
    } catch (error) {
      await firebaseAuthAdapter.logout();
      throw error;
    }
    const expirationTime = Date.parse(session.expiresAt);

    if (!session.accessToken || !Number.isFinite(expirationTime) || expirationTime <= Date.now()) {
      throw new Error("El backend devolvió una sesión externa inválida o vencida.");
    }

    const email = identity.user.email;
    if (!email) {
      throw new Error("El proveedor externo no devolvió un correo válido.");
    }

    const userId = getUserIdFromToken(session.accessToken);
    saveAuthCookies(session.accessToken, session.expiresAt, email);
    setUser({ email, id: userId });
    setExpiresAt(expirationTime);
    setIsAdmin(null);
    setRoleCheckError(null);
    setLoading(true);

    try {
      setIsAdmin(await isUserAdmin(userId));
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

  const logout = async (): Promise<void> => {
    try {
      await logoutFromBackend();
    } finally {
      clearStoredSession();
      setUser(null);
      setExpiresAt(null);
      setIsAdmin(null);
      setRoleCheckError(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    roleCheckError,
    loginWithCredentials,
    completeTwoFactorLogin,
    loginWithProvider,
    refreshAdminStatus,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
